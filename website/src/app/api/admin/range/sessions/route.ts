import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { requireAdmin, logAudit } from "@/lib/server/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = getDb();

    const sessions = db
      .prepare(`
        SELECT 
          s.id, s.user_id, s.template_id, s.status, s.mode, s.ip_address, s.started_at, s.expires_at, s.completed_at,
          u.username, u.display_name,
          t.title as template_title, t.category as template_category
        FROM lab_sessions s
        JOIN users u ON u.id = s.user_id
        JOIN lab_templates t ON t.id = s.template_id
        ORDER BY s.created_at DESC
        LIMIT 50
      `)
      .all();

    return NextResponse.json({ sessions });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error?.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    return NextResponse.json({ error: "Gagal memuat sesi range." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();
    const { sessionId, action } = body;

    const db = getDb();
    if (action === "terminate") {
      db.prepare(`
        UPDATE lab_sessions
        SET status = 'completed', completed_at = ?
        WHERE id = ?
      `).run(new Date().toISOString(), sessionId);

      logAudit(admin.id, "ADMIN_TERMINATE_SESSION", "lab_session", sessionId, "Administrator terminated active lab session");
      return NextResponse.json({ message: "Sesi lab berhasil dihentikan oleh administrator." });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error?.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    return NextResponse.json({ error: "Gagal memodifikasi sesi." }, { status: 500 });
  }
}
