import { NextResponse } from "next/server";
import { getDb, logAudit, createNotification } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const user = await getSessionUser(request);

    // Fetch published contributions
    const published = db
      .prepare(`
        SELECT s.id, s.type, s.title, s.description, s.tags, s.status, s.created_at,
               u.display_name as author_name, u.username as author_username, u.avatar as author_avatar
        FROM contributor_submissions s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'published'
        ORDER BY s.created_at DESC
        LIMIT 50
      `)
      .all() as any[];

    // If user is logged in, fetch their own submissions
    let mySubmissions: any[] = [];
    if (user) {
      mySubmissions = db
        .prepare(`
          SELECT id, type, title, description, tags, status, reviewer_feedback, created_at, updated_at
          FROM contributor_submissions
          WHERE user_id = ?
          ORDER BY created_at DESC
        `)
        .all(user.id) as any[];
    }

    return NextResponse.json({
      success: true,
      published,
      mySubmissions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch contributions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login untuk mengajukan kontribusi materi." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { type, title, description, content, tags } = body;

    if (!title || !description || !content) {
      return NextResponse.json({ error: "Judul, deskripsi, dan konten kontribusi wajib diisi." }, { status: 400 });
    }

    const validTypes = ["module", "tutorial", "lab", "challenge", "writeup", "tool", "doc", "research"];
    const subType = validTypes.includes(type) ? type : "tutorial";

    const db = getDb();
    const now = new Date().toISOString();
    const subId = `sub_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    db.prepare(`
      INSERT INTO contributor_submissions (
        id, user_id, type, title, description, content, tags, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
    `).run(
      subId,
      user.id,
      subType,
      title.trim().slice(0, 150),
      description.trim().slice(0, 500),
      content.trim(),
      JSON.stringify(Array.isArray(tags) ? tags : ["Community"]),
      now,
      now
    );

    logAudit(user.id, "SUBMIT_CONTRIBUTION", "contributor_submission", subId, `Submitted ${subType}: ${title.slice(0, 50)}`);
    createNotification(
      user.id,
      "Proposal Kontribusi Diterima!",
      `Usulan ${subType} "${title}" telah masuk ke antrean kurasi tim reviewer CyberLab-ID.`,
      "info",
      "/contributors"
    );

    return NextResponse.json({
      success: true,
      message: "Kontribusi Anda berhasil diajukan dan sedang dalam proses review kurasi oleh tim moderator/editor.",
      submissionId: subId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit contribution" }, { status: 500 });
  }
}
