import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const db = getDb();

    // Get solved challenge IDs
    const solves = db
      .prepare("SELECT challenge_id FROM ctf_solves WHERE user_id = ?")
      .all(user.id) as { challenge_id: string }[];

    // Get user achievements
    const achievements = db
      .prepare(`
        SELECT a.code, a.title, a.description, a.icon, a.category, ua.unlocked_at
        FROM user_achievements ua
        JOIN achievements a ON a.code = ua.achievement_code
        WHERE ua.user_id = ?
        ORDER BY ua.unlocked_at DESC
      `)
      .all(user.id);

    // Get unread notification count
    const notifCount = db
      .prepare("SELECT count(*) as count FROM notifications WHERE user_id = ? AND is_read = 0")
      .get(user.id) as { count: number };

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        totalXp: user.total_xp,
        createdAt: user.created_at,
        solvedChallenges: solves.map((s) => s.challenge_id),
        achievements,
        unreadNotifications: notifCount.count,
      },
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ user: null });
  }
}
