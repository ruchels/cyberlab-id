import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = getDb();

    const usersCount = (db.prepare("SELECT count(*) as count FROM users").get() as any).count;
    const activeUsers = (db.prepare("SELECT count(*) as count FROM users WHERE status = 'active'").get() as any).count;
    const ctfChallenges = (db.prepare("SELECT count(*) as count FROM ctf_challenges").get() as any).count;
    const ctfSolves = (db.prepare("SELECT count(*) as count FROM ctf_solves").get() as any).count;
    const postsCount = (db.prepare("SELECT count(*) as count FROM community_posts").get() as any).count;
    const reportsCount = (db.prepare("SELECT count(*) as count FROM community_reports WHERE status = 'pending'").get() as any).count;

    const recentLogs = db
      .prepare(`
        SELECT a.id, a.action, a.target_type, a.target_id, a.details, a.created_at, u.username as actor_username
        FROM audit_logs a
        LEFT JOIN users u ON u.id = a.actor_id
        ORDER BY a.created_at DESC
        LIMIT 10
      `)
      .all();

    return NextResponse.json({
      analytics: {
        totalUsers: usersCount,
        activeUsers,
        totalChallenges: ctfChallenges,
        totalSolves: ctfSolves,
        communityPosts: postsCount,
        pendingReports: reportsCount,
      },
      recentLogs,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Silakan login sebagai administrator." }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak: Hanya administrator yang diizinkan." }, { status: 403 });
    }
    console.error("Admin Analytics Error:", error);
    return NextResponse.json({ error: "Gagal memuat analitik admin." }, { status: 500 });
  }
}
