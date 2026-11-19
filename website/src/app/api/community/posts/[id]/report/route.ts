import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser, logAudit } from "@/lib/server/auth";
import crypto from "node:crypto";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login untuk melaporkan konten." }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json({ error: "Alasan pelaporan wajib diisi minimal 5 karakter." }, { status: 400 });
    }

    const db = getDb();
    const post = db.prepare("SELECT id, title FROM community_posts WHERE id = ?").get(postId) as { id: string; title: string } | undefined;

    if (!post) {
      return NextResponse.json({ error: "Diskusi tidak ditemukan." }, { status: 404 });
    }

    const reportId = `rep_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO community_reports (id, post_id, reporter_id, reason, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(reportId, postId, user.id, reason.trim(), now);

    // Flag post as reported
    db.prepare("UPDATE community_posts SET is_reported = 1 WHERE id = ?").run(postId);
    logAudit(user.id, "REPORT_POST", "community_post", postId, `Reported for: ${reason.trim()}`);

    return NextResponse.json({ message: "Laporan Anda telah diterima dan akan ditinjau oleh tim moderator." });
  } catch (error) {
    console.error("Report Post Error:", error);
    return NextResponse.json({ error: "Gagal mengirimkan laporan." }, { status: 500 });
  }
}
