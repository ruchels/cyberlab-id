import { NextResponse } from "next/server";
import { getDb, runTransaction, hashString, logAudit, createNotification } from "@/lib/server/db";
import { getSessionUser, checkRateLimit } from "@/lib/server/auth";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: compId } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login untuk mengirimkan jawaban flag kompetisi." }, { status: 401 });
    }

    const ip = request.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`arena_ctf_${user.id}_${ip}`, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak submission dalam waktu singkat. Harap tunggu 1 menit." },
        { status: 429 }
      );
    }

    const db = getDb();
    const competition = db.prepare("SELECT * FROM ctf_competitions WHERE id = ?").get(compId) as any;
    if (!competition) {
      return NextResponse.json({ error: "Kompetisi CTF tidak ditemukan." }, { status: 404 });
    }

    const now = new Date().toISOString();
    if (competition.status !== "active" && (now < competition.start_time || now > competition.end_time)) {
      return NextResponse.json(
        { error: "Kompetisi saat ini tidak sedang berlangsung (belum dimulai atau telah berakhir)." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { challengeId, flag } = body;
    if (!challengeId || !flag || !flag.trim()) {
      return NextResponse.json({ error: "Harap pilih tantangan dan masukkan flag." }, { status: 400 });
    }

    const challenge = db.prepare("SELECT * FROM ctf_challenges WHERE id = ?").get(challengeId) as any;
    if (!challenge) {
      return NextResponse.json({ error: "Tantangan tidak ditemukan." }, { status: 404 });
    }

    // Check user's team if competition is team-based
    let userTeamId: string | null = null;
    const userTeam = db
      .prepare("SELECT team_id FROM ctf_team_members WHERE user_id = ?")
      .get(user.id) as { team_id: string } | undefined;
    if (userTeam) {
      userTeamId = userTeam.team_id;
    }

    // Check if user or team already solved this challenge in this competition
    let alreadySolved = false;
    if (competition.type === "team" && userTeamId) {
      const existingTeamSolve = db
        .prepare("SELECT id FROM ctf_competition_solves WHERE competition_id = ? AND challenge_id = ? AND team_id = ?")
        .get(competition.id, challenge.id, userTeamId);
      if (existingTeamSolve) alreadySolved = true;
    } else {
      const existingUserSolve = db
        .prepare("SELECT id FROM ctf_competition_solves WHERE competition_id = ? AND challenge_id = ? AND user_id = ?")
        .get(competition.id, challenge.id, user.id);
      if (existingUserSolve) alreadySolved = true;
    }

    if (alreadySolved) {
      return NextResponse.json(
        { error: "Tantangan ini telah diselesaikan sebelumnya oleh Anda atau tim Anda. Poin tidak dapat diklaim ulang." },
        { status: 400 }
      );
    }

    // Verify flag using constant-time comparison
    const cleanFlag = flag.trim().toLowerCase();
    const submittedHash = hashString(cleanFlag);

    const submittedBuf = Buffer.from(submittedHash, "hex");
    const expectedBuf = Buffer.from(challenge.flag_hash, "hex");

    let isMatch = false;
    if (submittedBuf.length === expectedBuf.length) {
      isMatch = crypto.timingSafeEqual(submittedBuf, expectedBuf);
    }

    if (!isMatch) {
      logAudit(user.id, "ARENA_FLAG_INCORRECT", "ctf_competition", competition.id, `Incorrect flag for challenge ${challenge.id}`);
      return NextResponse.json(
        { success: false, message: "Flag salah! Periksa kembali jawaban Anda." },
        { status: 400 }
      );
    }

    // Award points & record competition solve atomically
    const solveId = `csol_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    runTransaction((txDb) => {
      txDb.prepare(`
        INSERT INTO ctf_competition_solves (id, competition_id, challenge_id, user_id, team_id, points, solved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(solveId, competition.id, challenge.id, user.id, userTeamId, challenge.points, now);

      // Also credit individual user XP
      txDb.prepare("UPDATE users SET total_xp = total_xp + ?, updated_at = ? WHERE id = ?").run(
        challenge.points,
        now,
        user.id
      );

      // If user is in team, update team total points
      if (userTeamId) {
        txDb.prepare("UPDATE ctf_teams SET total_points = total_points + ? WHERE id = ?").run(
          challenge.points,
          userTeamId
        );
      }
    });

    logAudit(user.id, "ARENA_FLAG_SOLVED", "ctf_competition", competition.id, `Solved challenge ${challenge.id} for +${challenge.points} points`);
    createNotification(
      user.id,
      "Tantangan Arena Berhasil!",
      `Flag valid untuk "${challenge.title}" pada kompetisi ${competition.title} (+${challenge.points} Poin).`,
      "ctf",
      "/arena"
    );

    return NextResponse.json({
      success: true,
      message: `FLAG BENAR! +${challenge.points} Poin berhasil ditambahkan ke skor ${userTeamId ? "tim Anda" : "individu Anda"}.`,
      pointsAwarded: challenge.points,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit flag" }, { status: 500 });
  }
}
