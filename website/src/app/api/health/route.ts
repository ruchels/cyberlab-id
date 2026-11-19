import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getCyberRangeHealth } from "@/lib/server/range/driver";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startTime = Date.now();
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const db = getDb();

    // 1. Database Health Check
    const dbCheckStart = Date.now();
    const testQuery = db.prepare("SELECT 1 as alive").get() as { alive: number } | undefined;
    const dbLatencyMs = Date.now() - dbCheckStart;
    const isDbAlive = testQuery?.alive === 1;

    // Table row counts
    const usersCount = (db.prepare("SELECT count(*) as count FROM users").get() as { count: number }).count;
    const ctfSolvesCount = (db.prepare("SELECT count(*) as count FROM ctf_solves").get() as { count: number }).count;
    const labSessionsCount = (db.prepare("SELECT count(*) as count FROM lab_sessions").get() as { count: number }).count;
    const auditLogsCount = (db.prepare("SELECT count(*) as count FROM audit_logs").get() as { count: number }).count;

    // 2. Cyber Range Engine Health
    const rangeHealth = getCyberRangeHealth();

    // 3. System Memory and Node Info
    const memory = process.memoryUsage();
    const totalLatencyMs = Date.now() - startTime;

    const healthPayload = {
      status: isDbAlive ? "healthy" : "degraded",
      version: "2.5.0",
      environment: process.env.NODE_ENV || "production",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      latencyMs: totalLatencyMs,
      checks: {
        database: {
          status: isDbAlive ? "pass" : "fail",
          latencyMs: dbLatencyMs,
          tables: {
            users: usersCount,
            ctfSolves: ctfSolvesCount,
            labSessions: labSessionsCount,
            auditLogs: auditLogsCount,
          },
        },
        cyberRange: {
          status: rangeHealth.status === "healthy" ? "pass" : "warn",
          activeDriver: rangeHealth.activeDriver,
          isDockerAvailable: rangeHealth.isDockerAvailable,
          activeSessions: rangeHealth.totalActiveSessions,
          completedSessions: rangeHealth.totalCompletedSessions,
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryRssMb: Math.round(memory.rss / (1024 * 1024)),
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        },
      },
    };

    return NextResponse.json(healthPayload, {
      status: isDbAlive ? 200 : 503,
      headers: {
        "x-request-id": requestId,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error.message || "Health probe failed",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: { "x-request-id": requestId },
      }
    );
  }
}
