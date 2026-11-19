import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";
import { getCyberRangeHealth } from "@/lib/server/range/driver";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = getDb();

    // 1. User & Activity Metrics
    const totalUsers = (db.prepare("SELECT count(*) as c FROM users").get() as any).c;
    const activeSessions24h = (
      db.prepare("SELECT count(*) as c FROM sessions WHERE created_at > datetime('now', '-24 hours')").get() as any
    ).c;
    const totalSolves = (db.prepare("SELECT count(*) as c FROM ctf_solves").get() as any).c;
    const totalPosts = (db.prepare("SELECT count(*) as c FROM community_posts").get() as any).c;
    const totalComments = (db.prepare("SELECT count(*) as c FROM community_comments").get() as any).c;
    const totalAuditLogs = (db.prepare("SELECT count(*) as c FROM audit_logs").get() as any).c;

    // 2. Cyber Range Telemetry
    const rangeHealth = getCyberRangeHealth();
    const rangeSessionsStatus = db
      .prepare("SELECT status, count(*) as count FROM lab_sessions GROUP BY status")
      .all() as { status: string; count: number }[];

    // 3. Error & Security Incidents in last 24h
    const authFailures24h = (
      db
        .prepare("SELECT count(*) as c FROM audit_logs WHERE action IN ('LOGIN_FAILED', 'RATE_LIMITED') AND created_at > datetime('now', '-24 hours')")
        .get() as any
    ).c;
    const ctfIncorrect24h = (
      db
        .prepare("SELECT count(*) as c FROM audit_logs WHERE action = 'CTF_INCORRECT' AND created_at > datetime('now', '-24 hours')")
        .get() as any
    ).c;

    const memory = process.memoryUsage();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      platform: {
        version: "2.5.0",
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
      },
      telemetry: {
        users: {
          total: totalUsers,
          active24h: activeSessions24h,
        },
        ctf: {
          totalSolves,
          incorrectSubmissions24h: ctfIncorrect24h,
        },
        community: {
          totalPosts,
          totalComments,
        },
        range: {
          activeDriver: rangeHealth.activeDriver,
          isDockerAvailable: rangeHealth.isDockerAvailable,
          activeSessions: rangeHealth.totalActiveSessions,
          completedSessions: rangeHealth.totalCompletedSessions,
          statusBreakdown: rangeSessionsStatus,
        },
        security: {
          authFailures24h,
          totalAuditEvents: totalAuditLogs,
        },
        system: {
          memoryRssMb: Math.round(memory.rss / (1024 * 1024)),
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        },
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak. Endpoint metrik hanya untuk Administrator." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Failed to fetch metrics" }, { status: 500 });
  }
}
