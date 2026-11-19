import { NextResponse } from "next/server";
import { getDb, hashString, runTransaction } from "@/lib/server/db";
import { getSessionUser, checkRateLimit, createNotification, logAudit } from "@/lib/server/auth";
import crypto from "node:crypto";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Silakan masuk (login) ke akun Anda untuk menyerahkan flag dan mengklaim poin XP." },
        { status: 401 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`ctf_${user.id}_${ip}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak submission flag dalam waktu singkat. Harap tunggu 1 menit." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { challengeId, flag } = body;

    if (!challengeId || !flag || typeof flag !== "string") {
      return NextResponse.json({ error: "ID tantangan dan format flag wajib disertakan." }, { status: 400 });
    }

    const db = getDb();

    // 1. Check challenge existence
    const challenge = db
      .prepare("SELECT id, title, points, flag_hash, is_published FROM ctf_challenges WHERE id = ?")
      .get(challengeId) as {
      id: string;
      title: string;
      points: number;
      flag_hash: string;
      is_published: number;
    } | undefined;

    if (!challenge || challenge.is_published !== 1) {
      return NextResponse.json({ error: "Tantangan tidak ditemukan atau belum dipublikasikan." }, { status: 404 });
    }

    // 2. Check if already solved
    const existingSolve = db
      .prepare("SELECT id FROM ctf_solves WHERE user_id = ? AND challenge_id = ?")
      .get(user.id, challengeId);

    if (existingSolve) {
      return NextResponse.json(
        { error: "Anda telah menyelesaikan tantangan ini sebelumnya. Poin tidak dapat diklaim ulang." },
        { status: 400 }
      );
    }

    // 3. Verify flag using constant-time hash comparison
    const cleanFlag = flag.trim().toLowerCase();
    const submittedHash = hashString(cleanFlag);

    const submittedBuf = Buffer.from(submittedHash, "hex");
    const expectedBuf = Buffer.from(challenge.flag_hash, "hex");

    let isMatch = false;
    if (submittedBuf.length === expectedBuf.length) {
      isMatch = crypto.timingSafeEqual(submittedBuf, expectedBuf);
    }

    // If initial doesn't match, check if user submitted without CYBERLAB{...} prefix or vice versa
    if (!isMatch) {
      let alternateFlag = cleanFlag;
      if (!alternateFlag.startsWith("cyberlab{") && alternateFlag.endsWith("}")) {
        alternateFlag = `cyberlab{${cleanFlag}}`;
      } else if (alternateFlag.startsWith("cyberlab{") && alternateFlag.endsWith("}")) {
        alternateFlag = alternateFlag.slice(9, -1);
      }
      const altHash = hashString(alternateFlag);
      const altBuf = Buffer.from(altHash, "hex");
      if (altBuf.length === expectedBuf.length) {
        isMatch = crypto.timingSafeEqual(altBuf, expectedBuf);
      }
    }

    if (!isMatch) {
      logAudit(user.id, "CTF_INCORRECT", "ctf_challenge", challenge.id, `Incorrect flag submitted: ${flag.slice(0, 30)}`);
      return NextResponse.json(
        { success: false, message: "Flag salah! Periksa kembali instruksi, cipher/encoding, dan petunjuk tantangan." },
        { status: 400 }
      );
    }

    // 4. Award points & record solve atomically
    const now = new Date().toISOString();
    const solveId = `sol_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const unlockedBadges: string[] = [];

    runTransaction((txDb) => {
      txDb.prepare(`
        INSERT INTO ctf_solves (id, user_id, challenge_id, points_awarded, solved_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(solveId, user.id, challenge.id, challenge.points, now);

      // Update challenge solves count
      txDb.prepare("UPDATE ctf_challenges SET solves_count = solves_count + 1 WHERE id = ?").run(challenge.id);

      // Update user total XP
      txDb.prepare("UPDATE users SET total_xp = total_xp + ?, updated_at = ? WHERE id = ?").run(
        challenge.points,
        now,
        user.id
      );

      // 5. Check and unlock achievements
      const solvesCountRow = txDb
        .prepare("SELECT count(*) as count FROM ctf_solves WHERE user_id = ?")
        .get(user.id) as { count: number };
      const totalSolves = solvesCountRow.count;

      // Check CTF Rookie
      if (totalSolves >= 1) {
        const achRookie = txDb
          .prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_code = 'ctf-rookie'")
          .get(user.id);
        if (!achRookie) {
          txDb.prepare(`
            INSERT INTO user_achievements (id, user_id, achievement_code, unlocked_at)
            VALUES (?, ?, 'ctf-rookie', ?)
          `).run(`uach_${user.id}_rookie`, user.id, now);
          txDb.prepare("UPDATE users SET total_xp = total_xp + 50 WHERE id = ?").run(user.id);
          unlockedBadges.push("CTF Rookie (+50 XP)");
        }
      }

      // Check CTF Specialist
      if (totalSolves >= 5) {
        const achSpec = txDb
          .prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_code = 'ctf-specialist'")
          .get(user.id);
        if (!achSpec) {
          txDb.prepare(`
            INSERT INTO user_achievements (id, user_id, achievement_code, unlocked_at)
            VALUES (?, ?, 'ctf-specialist', ?)
          `).run(`uach_${user.id}_specialist`, user.id, now);
          txDb.prepare("UPDATE users SET total_xp = total_xp + 100 WHERE id = ?").run(user.id);
          unlockedBadges.push("CTF Specialist (+100 XP)");
        }
      }
    });

    logAudit(user.id, "CTF_SOLVED", "ctf_challenge", challenge.id, `Solved for +${challenge.points} XP`);

    // Notification
    let notifMsg = `Selamat! Anda berhasil menyelesaikan tantangan "${challenge.title}" dan mendapatkan +${challenge.points} XP.`;
    if (unlockedBadges.length > 0) {
      notifMsg += ` Lencana baru dibuka: ${unlockedBadges.join(", ")}!`;
    }

    createNotification(user.id, "Tantangan CTF Terpecahkan!", notifMsg, "ctf", "/challenges");

    return NextResponse.json({
      success: true,
      message: "FLAG VALID! Jawaban Anda benar.",
      pointsAwarded: challenge.points,
      unlockedBadges,
    });
  } catch (error) {
    console.error("CTF Submission Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal saat memeriksa flag." }, { status: 500 });
  }
}
