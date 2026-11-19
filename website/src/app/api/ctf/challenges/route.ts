import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const user = await getSessionUser(request);

    // CRITICAL SECURITY: Do NOT select flag_hash! Flag hashes are strictly kept server-side.
    const challenges = db
      .prepare(`
        SELECT id, title, description, category, difficulty, points, hint, instructions, attachment_url, solves_count
        FROM ctf_challenges
        WHERE is_published = 1
        ORDER BY points ASC, title ASC
      `)
      .all() as {
      id: string;
      title: string;
      description: string;
      category: string;
      difficulty: string;
      points: number;
      hint: string;
      instructions: string;
      attachment_url: string;
      solves_count: number;
    }[];

    let userSolvedSet = new Set<string>();
    if (user) {
      const solves = db
        .prepare("SELECT challenge_id FROM ctf_solves WHERE user_id = ?")
        .all(user.id) as { challenge_id: string }[];
      userSolvedSet = new Set(solves.map((s) => s.challenge_id));
    }

    const payload = challenges.map((ch) => ({
      ...ch,
      isSolved: userSolvedSet.has(ch.id),
    }));

    return NextResponse.json({ challenges: payload });
  } catch (error) {
    console.error("Fetch CTF Challenges Error:", error);
    return NextResponse.json({ error: "Gagal memuat tantangan CTF." }, { status: 500 });
  }
}
