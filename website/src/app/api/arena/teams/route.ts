import { NextResponse } from "next/server";
import { getDb, runTransaction, logAudit, createNotification } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const teamMember = db
      .prepare(`
        SELECT t.id, t.name, t.description, t.leader_id, t.invite_code, t.total_points, m.role
        FROM ctf_team_members m
        JOIN ctf_teams t ON m.team_id = t.id
        WHERE m.user_id = ?
      `)
      .get(user.id) as any;

    if (!teamMember) {
      return NextResponse.json({ success: true, team: null, members: [] });
    }

    const members = db
      .prepare(`
        SELECT u.id, u.username, u.display_name, u.avatar, u.total_xp, m.role, m.joined_at
        FROM ctf_team_members m
        JOIN users u ON m.user_id = u.id
        WHERE m.team_id = ?
        ORDER BY m.role DESC, m.joined_at ASC
      `)
      .all(teamMember.id);

    return NextResponse.json({
      success: true,
      team: teamMember,
      members,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login untuk mengelola tim CTF." }, { status: 401 });
    }

    const db = getDb();
    const body = await request.json().catch(() => ({}));
    const action = body.action || "create"; // "create" | "join" | "leave"
    const now = new Date().toISOString();

    // Check if user is already in a team
    const existingMembership = db
      .prepare("SELECT team_id FROM ctf_team_members WHERE user_id = ?")
      .get(user.id) as { team_id: string } | undefined;

    if (action === "create") {
      if (existingMembership) {
        return NextResponse.json(
          { error: "Anda sudah tergabung dalam sebuah tim. Tinggalkan tim Anda terlebih dahulu untuk membuat tim baru." },
          { status: 400 }
        );
      }

      const { name, description } = body;
      if (!name || name.trim().length < 3) {
        return NextResponse.json({ error: "Nama tim harus minimal 3 karakter." }, { status: 400 });
      }

      const teamName = name.trim();
      const checkName = db.prepare("SELECT id FROM ctf_teams WHERE lower(name) = lower(?)").get(teamName);
      if (checkName) {
        return NextResponse.json({ error: "Nama tim tersebut sudah digunakan oleh regu lain." }, { status: 400 });
      }

      const teamId = `team_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      const inviteCode = `${teamName.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase()}_${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

      runTransaction((txDb) => {
        txDb.prepare(`
          INSERT INTO ctf_teams (id, name, description, leader_id, invite_code, total_points, created_at)
          VALUES (?, ?, ?, ?, ?, 0, ?)
        `).run(teamId, teamName, description || "", user.id, inviteCode, now);

        txDb.prepare(`
          INSERT INTO ctf_team_members (id, team_id, user_id, role, joined_at)
          VALUES (?, ?, ?, 'leader', ?)
        `).run(`tm_${Date.now()}_${user.id}`, teamId, user.id, now);

        // Award Team Captain achievement
        const achCap = txDb
          .prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_code = 'team-captain'")
          .get(user.id);
        if (!achCap) {
          txDb.prepare(`
            INSERT INTO user_achievements (id, user_id, achievement_code, unlocked_at)
            VALUES (?, ?, 'team-captain', ?)
          `).run(`uach_${user.id}_captain`, user.id, now);
          txDb.prepare("UPDATE users SET total_xp = total_xp + 50 WHERE id = ?").run(user.id);
        }
      });

      logAudit(user.id, "CREATE_TEAM", "ctf_team", teamId, `Created team ${teamName} with code ${inviteCode}`);

      return NextResponse.json({
        success: true,
        message: `Tim "${teamName}" berhasil dibentuk! Bagikan kode undangan: ${inviteCode}`,
        teamId,
        inviteCode,
      });
    }

    if (action === "join") {
      if (existingMembership) {
        return NextResponse.json(
          { error: "Anda sudah tergabung dalam sebuah tim. Tinggalkan tim Anda terlebih dahulu untuk bergabung ke tim lain." },
          { status: 400 }
        );
      }

      const { inviteCode } = body;
      if (!inviteCode || !inviteCode.trim()) {
        return NextResponse.json({ error: "Harap masukkan kode undangan tim." }, { status: 400 });
      }

      const team = db
        .prepare("SELECT id, name, leader_id FROM ctf_teams WHERE upper(invite_code) = upper(?)")
        .get(inviteCode.trim()) as any;

      if (!team) {
        return NextResponse.json({ error: "Kode undangan tidak valid atau tim tidak ditemukan." }, { status: 404 });
      }

      // Check max members per team (max 5)
      const countMembers = (
        db.prepare("SELECT count(*) as count FROM ctf_team_members WHERE team_id = ?").get(team.id) as { count: number }
      ).count;

      if (countMembers >= 5) {
        return NextResponse.json({ error: "Tim ini telah mencapai batas maksimum 5 anggota." }, { status: 400 });
      }

      runTransaction((txDb) => {
        txDb.prepare(`
          INSERT INTO ctf_team_members (id, team_id, user_id, role, joined_at)
          VALUES (?, ?, ?, 'member', ?)
        `).run(`tm_${Date.now()}_${user.id}`, team.id, user.id, now);

        // Award Arena Gladiator achievement
        const achGlad = txDb
          .prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_code = 'arena-gladiator'")
          .get(user.id);
        if (!achGlad) {
          txDb.prepare(`
            INSERT INTO user_achievements (id, user_id, achievement_code, unlocked_at)
            VALUES (?, ?, 'arena-gladiator', ?)
          `).run(`uach_${user.id}_glad`, user.id, now);
        }
      });

      logAudit(user.id, "JOIN_TEAM", "ctf_team", team.id, `Joined team ${team.name}`);
      createNotification(team.leader_id, "Anggota Baru Bergabung!", `${user.display_name} (@${user.username}) telah bergabung dengan tim Anda.`, "ctf", "/arena");

      return NextResponse.json({
        success: true,
        message: `Selamat! Anda berhasil bergabung dengan tim "${team.name}".`,
        teamId: team.id,
      });
    }

    if (action === "leave") {
      if (!existingMembership) {
        return NextResponse.json({ error: "Anda tidak sedang tergabung dalam tim apa pun." }, { status: 400 });
      }

      const myRole = (
        db.prepare("SELECT role FROM ctf_team_members WHERE user_id = ? AND team_id = ?").get(user.id, existingMembership.team_id) as any
      )?.role;

      if (myRole === "leader") {
        return NextResponse.json(
          { error: "Ketua tim tidak dapat meninggalkan tim. Bubarkan tim atau serahkan kepemimpinan terlebih dahulu." },
          { status: 400 }
        );
      }

      db.prepare("DELETE FROM ctf_team_members WHERE user_id = ? AND team_id = ?").run(user.id, existingMembership.team_id);
      logAudit(user.id, "LEAVE_TEAM", "ctf_team", existingMembership.team_id, "Left team");

      return NextResponse.json({
        success: true,
        message: "Anda telah keluar dari tim.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process team request" }, { status: 500 });
  }
}
