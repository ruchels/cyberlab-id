import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/server/api-v1-auth";
import { getDb } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const auth = authenticateApiKey(req, "read:ctf_public");
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const db = getDb();

    // 1. Fetch public competitions
    const comps = db
      .prepare(
        `SELECT id, title, description, start_time, end_time, format, status
         FROM ctf_competitions
         ORDER BY start_time DESC`
      )
      .all() as any[];

    // 2. Fetch public top 10 leaderboard (strictly sanitized: username, display_name, total_xp, rank)
    const leaderboard = db
      .prepare(
        `SELECT id, username, display_name, total_xp
         FROM users
         WHERE status = 'active'
         ORDER BY total_xp DESC
         LIMIT 10`
      )
      .all() as any[];

    const sanitizedLeaderboard = leaderboard.map((u, idx) => ({
      rank: idx + 1,
      displayName: u.display_name,
      username: u.username,
      totalXp: u.total_xp,
    }));

    return NextResponse.json({
      success: true,
      apiVersion: "1.0",
      timestamp: new Date().toISOString(),
      competitions: comps,
      publicLeaderboard: sanitizedLeaderboard,
    });
  } catch (err: any) {
    console.error("API v1 ctf error:", err);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
