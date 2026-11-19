import { NextResponse } from "next/server";
import { getDb, logAudit, createNotification } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const user = await getSessionUser(request);

    const mentors = db
      .prepare(`
        SELECT m.id, m.display_name, m.bio, m.specialties, m.is_available, m.status,
               u.avatar, u.total_xp
        FROM mentors m
        JOIN users u ON m.user_id = u.id
        WHERE m.status = 'verified'
        ORDER BY m.created_at ASC
      `)
      .all() as any[];

    let myRequests: any[] = [];
    if (user) {
      myRequests = db
        .prepare(`
          SELECT r.id, r.mentor_id, r.learning_goals, r.status, r.created_at,
                 m.display_name as mentor_name
          FROM mentorship_requests r
          JOIN mentors m ON r.mentor_id = m.id
          WHERE r.student_id = ?
          ORDER BY r.created_at DESC
        `)
        .all(user.id) as any[];
    }

    const formattedMentors = mentors.map((m) => {
      let specialties = [];
      try {
        specialties = JSON.parse(m.specialties);
      } catch {}
      return {
        ...m,
        specialties,
      };
    });

    return NextResponse.json({
      success: true,
      mentors: formattedMentors,
      myRequests,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch mentors" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login untuk mengajukan bimbingan mentorship." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { mentorId, learningGoals } = body;

    if (!mentorId || !learningGoals || !learningGoals.trim()) {
      return NextResponse.json({ error: "Harap pilih mentor dan jelaskan tujuan pembelajaran Anda." }, { status: 400 });
    }

    const db = getDb();
    const mentor = db.prepare("SELECT * FROM mentors WHERE id = ? AND status = 'verified'").get(mentorId) as any;
    if (!mentor) {
      return NextResponse.json({ error: "Mentor tidak ditemukan." }, { status: 404 });
    }

    if (mentor.user_id === user.id) {
      return NextResponse.json({ error: "Anda tidak dapat mengajukan bimbingan kepada diri sendiri." }, { status: 400 });
    }

    // Check for pending request
    const existing = db
      .prepare("SELECT id FROM mentorship_requests WHERE mentor_id = ? AND student_id = ? AND status = 'pending'")
      .get(mentor.id, user.id);
    if (existing) {
      return NextResponse.json({ error: "Anda telah memiliki permohonan bimbingan yang sedang menunggu persetujuan mentor ini." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const reqId = `mreq_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    db.prepare(`
      INSERT INTO mentorship_requests (id, mentor_id, student_id, learning_goals, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `).run(reqId, mentor.id, user.id, learningGoals.trim(), now, now);

    logAudit(user.id, "REQUEST_MENTORSHIP", "mentor", mentor.id, `Requested mentorship with ${mentor.display_name}`);
    createNotification(
      mentor.user_id,
      "Permohonan Mentorship Baru!",
      `${user.display_name} (@${user.username}) mengajukan bimbingan belajar: "${learningGoals.slice(0, 80)}..."`,
      "info",
      "/mentorship"
    );

    return NextResponse.json({
      success: true,
      message: `Permohonan bimbingan berhasil dikirim ke ${mentor.display_name}! Tunggu konfirmasi mentor melalui notifikasi.`,
      requestId: reqId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit mentorship request" }, { status: 500 });
  }
}
