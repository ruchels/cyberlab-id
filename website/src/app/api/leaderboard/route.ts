import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "global"; // 'global' | 'ctf'
    const db = getDb();

    let query = "";
    if (type === "ctf") {
      query = `
        SELECT 
          u.id, u.username, u.display_name, u.avatar, u.role, u.total_xp,
          COUNT(s.id) as ctf_solves_count,
          COALESCE(SUM(s.points_awarded), 0) as ctf_points
        FROM users u
        LEFT JOIN ctf_solves s ON s.user_id = u.id
        WHERE u.status = 'active'
        GROUP BY u.id
        ORDER BY ctf_points DESC, u.total_xp DESC
        LIMIT 50
      `;
    } else {
      query = `
        SELECT 
          u.id, u.username, u.display_name, u.avatar, u.role, u.total_xp,
          (SELECT COUNT(*) FROM ctf_solves WHERE user_id = u.id) as ctf_solves_count
        FROM users u
        WHERE u.status = 'active'
        ORDER BY u.total_xp DESC, u.created_at ASC
        LIMIT 50
      `;
    }

    const rows = db.prepare(query).all() as any[];

    const leaderboard = rows.map((r, index) => ({
      rank: index + 1,
      id: r.id,
      username: r.username,
      displayName: r.display_name,
      avatar: r.avatar,
      role: r.role,
      totalXp: r.total_xp,
      ctfSolvesCount: r.ctf_solves_count || 0,
      ctfPoints: r.ctf_points || 0,
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    return NextResponse.json({ error: "Gagal memuat papan peringkat." }, { status: 500 });
  }
}
