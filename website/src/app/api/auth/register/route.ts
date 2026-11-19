import { NextResponse } from "next/server";
import { getDb, hashPassword } from "@/lib/server/db";
import { createSession, checkRateLimit, createNotification, SESSION_COOKIE_NAME } from "@/lib/server/auth";
import crypto from "node:crypto";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`register_${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan registrasi. Silakan coba 1 menit lagi." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, email, password, displayName } = body;

    // Validation
    if (!username || typeof username !== "string" || username.trim().length < 3 || username.trim().length > 24) {
      return NextResponse.json(
        { error: "Username harus terdiri dari 3 hingga 24 karakter." },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return NextResponse.json(
        { error: "Username hanya boleh mengandung huruf, angka, dan garis bawah (_)." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: "Format alamat email tidak valid." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Kata sandi minimal harus 8 karakter." },
        { status: 400 }
      );
    }

    const db = getDb();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = db
      .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
      .get(cleanUsername, cleanEmail);

    if (existing) {
      return NextResponse.json(
        { error: "Username atau alamat email sudah terdaftar di CyberLab-ID." },
        { status: 409 }
      );
    }

    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);
    const now = new Date().toISOString();
    const finalDisplayName = (displayName && typeof displayName === "string" && displayName.trim().length > 0)
      ? displayName.trim().slice(0, 50)
      : username.trim();

    // Insert user
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, salt, display_name, avatar, bio, role, status, total_xp, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'Shield', '', 'user', 'active', 15, ?, ?)
    `).run(userId, cleanUsername, cleanEmail, passwordHash, salt, finalDisplayName, now, now);

    // Award "first-steps" achievement
    db.prepare(`
      INSERT OR IGNORE INTO user_achievements (id, user_id, achievement_code, unlocked_at)
      VALUES (?, ?, 'first-steps', ?)
    `).run(`uach_${userId}_first_steps`, userId, now);

    createNotification(
      userId,
      "Selamat Datang di CyberLab-ID!",
      "Akun Anda berhasil dibuat. Anda mendapatkan lencana prestasi 'First Steps' dan +15 XP!",
      "achievement",
      "/profile"
    );

    // Create session
    const { token, expiresAt } = createSession(userId);

    const userResponse = {
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      displayName: finalDisplayName,
      avatar: "Shield",
      bio: "",
      role: "user",
      totalXp: 15,
    };

    const response = NextResponse.json({
      message: "Pendaftaran akun berhasil!",
      user: userResponse,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(expiresAt),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal pada server." }, { status: 500 });
  }
}
