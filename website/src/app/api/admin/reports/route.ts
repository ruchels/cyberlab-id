import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = getDb();

    const reports = db
      .prepare(`
        SELECT 
          r.id, r.post_id, r.reason, r.status, r.created_at,
          u.username as reporter_username,
          p.title as post_title, p.content as post_content,
          author.username as author_username
        FROM community_reports r
        JOIN users u ON u.id = r.reporter_id
        LEFT JOIN community_posts p ON p.id = r.post_id
        LEFT JOIN users author ON author.id = p.user_id
        ORDER BY r.created_at DESC
      `)
      .all();

    return NextResponse.json({ reports });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error?.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    return NextResponse.json({ error: "Gagal memuat laporan moderasi." }, { status: 500 });
  }
}
