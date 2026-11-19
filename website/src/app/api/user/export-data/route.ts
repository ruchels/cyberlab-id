import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getDb, logAudit } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Autentikasi diperlukan." }, { status: 401 });
    }

    const db = getDb();

    // 1. User Profile Details
    const profile = db
      .prepare(
        `SELECT id, username, email, display_name, bio, total_xp, role, status,
                preferred_language, preferred_timezone, github_username, created_at
         FROM users WHERE id = ?`
      )
      .get(user.id) as any;

    // 2. Achievements
    const achievements = db
      .prepare(
        `SELECT a.code, a.title, a.description, a.xp_reward, ua.unlocked_at
         FROM user_achievements ua
         JOIN achievements a ON ua.achievement_code = a.code
         WHERE ua.user_id = ?`
      )
      .all(user.id) as any[];

    // 3. CTF Solves
    const solves = db
      .prepare(
        `SELECT cs.challenge_id, cs.points, cs.solved_at, c.title as challenge_title, c.category
         FROM ctf_solves cs
         LEFT JOIN ctf_challenges c ON cs.challenge_id = c.id
         WHERE cs.user_id = ?`
      )
      .all(user.id) as any[];

    // 4. Lab Completions
    const labs = db
      .prepare(
        `SELECT template_id, xp_awarded, completed_at
         FROM lab_completions
         WHERE user_id = ?`
      )
      .all(user.id) as any[];

    // 5. Digital Certificates
    const certs = db
      .prepare(
        `SELECT id, path_id, status, verification_hash, issued_at
         FROM digital_certificates
         WHERE user_id = ?`
      )
      .all(user.id) as any[];

    // 6. Community Posts
    const posts = db
      .prepare(
        `SELECT id, title, category, created_at
         FROM community_posts
         WHERE author_id = ?`
      )
      .all(user.id) as any[];

    const exportBundle = {
      exportMetadata: {
        platform: "CyberLab-ID",
        exportTimestamp: new Date().toISOString(),
        formatVersion: "1.0-GDPR-Compliant",
        disclaimer: "Data ekspor ini berisi seluruh catatan aktivitas akun dan riwayat pembelajaran Anda.",
      },
      userProfile: profile,
      learningProgress: {
        totalXp: profile?.total_xp || 0,
        achievementsCount: achievements.length,
        achievements,
        ctfSolvesCount: solves.length,
        ctfSolves: solves,
        labCompletionsCount: labs.length,
        labCompletions: labs,
        certificatesIssued: certs,
      },
      communityActivity: {
        postsCount: posts.length,
        posts,
      },
    };

    logAudit(user.id, "user_data_exported", "user", user.id);

    return new NextResponse(JSON.stringify(exportBundle, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cyberlab-data-export-${user.username}.json"`,
      },
    });
  } catch (err: any) {
    console.error("Export data error:", err);
    return NextResponse.json({ success: false, error: "Gagal mengekspor data pengguna." }, { status: 500 });
  }
}
