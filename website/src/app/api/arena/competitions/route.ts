import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const user = await getSessionUser(request);

    // List competitions
    const competitions = db
      .prepare(`
        SELECT id, title, description, type, format, start_time, end_time, status, rules, challenges_list, created_at
        FROM ctf_competitions
        ORDER BY start_time DESC
      `)
      .all() as any[];

    // Fetch team leaderboards for active competitions
    const teams = db
      .prepare(`
        SELECT t.id, t.name, t.description, t.total_points, u.display_name as leader_name,
               count(m.id) as members_count
        FROM ctf_teams t
        JOIN users u ON t.leader_id = u.id
        LEFT JOIN ctf_team_members m ON t.id = m.team_id
        GROUP BY t.id
        ORDER BY t.total_points DESC, t.created_at ASC
        LIMIT 20
      `)
      .all();

    // Check if user belongs to any team
    let myTeam = null;
    if (user) {
      const memberRow = db
        .prepare(`
          SELECT t.id, t.name, t.description, t.invite_code, t.total_points, m.role
          FROM ctf_team_members m
          JOIN ctf_teams t ON m.team_id = t.id
          WHERE m.user_id = ?
        `)
        .get(user.id);
      if (memberRow) {
        myTeam = memberRow;
      }
    }

    const formattedCompetitions = competitions.map((c) => {
      let challengeIds = [];
      try {
        challengeIds = JSON.parse(c.challenges_list);
      } catch {}
      return {
        ...c,
        challengesCount: challengeIds.length,
      };
    });

    return NextResponse.json({
      success: true,
      competitions: formattedCompetitions,
      teamLeaderboard: teams,
      myTeam,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch competitions" }, { status: 500 });
  }
}
