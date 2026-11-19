import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { requireAdmin, logAudit } from "@/lib/server/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id: reportId } = await params;
    const body = await request.json();
    const { action } = body; // 'dismiss' | 'delete_post'

    const db = getDb();
    const report = db.prepare("SELECT post_id FROM community_reports WHERE id = ?").get(reportId) as { post_id: string } | undefined;

    if (!report) {
      return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
    }

    if (action === "delete_post") {
      db.prepare("DELETE FROM community_posts WHERE id = ?").run(report.post_id);
      db.prepare("UPDATE community_reports SET status = 'resolved' WHERE id = ?").run(reportId);
      logAudit(admin.id, "MODERATE_DELETE_POST", "community_post", report.post_id, "Deleted post via report resolution");
      return NextResponse.json({ message: "Postingan berhasil dihapus dan laporan ditandai selesai." });
    } else {
      db.prepare("UPDATE community_reports SET status = 'dismissed' WHERE id = ?").run(reportId);
      // Unflag post if no other pending reports
      db.prepare("UPDATE community_posts SET is_reported = 0 WHERE id = ?").run(report.post_id);
      logAudit(admin.id, "MODERATE_DISMISS", "community_report", reportId, "Dismissed report");
      return NextResponse.json({ message: "Laporan ditolak / ditutup." });
    }
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error?.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    return NextResponse.json({ error: "Gagal memproses tindakan moderasi." }, { status: 500 });
  }
}
