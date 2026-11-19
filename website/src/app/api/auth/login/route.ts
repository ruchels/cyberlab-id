import { NextResponse } from "next/server";
import { getDb, verifyPassword } from "@/lib/server/db";
import { createSession, checkRateLimit, SESSION_COOKIE_NAME, logAudit } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`login_${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login gagal. Harap tunggu 1 menit sebelum mencoba kembali." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || typeof identifier !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Username/Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const db = getDb();
    const cleanId = identifier.trim().toLowerCase();

    const user = db
      .prepare(
        "SELECT id, username, email, password_hash, salt, display_name, avatar, bio, role, status, total_xp FROM users WHERE username = ? OR email = ?"
      )
      .get(cleanId, cleanId) as {
      id: string;
      username: string;
      email: string;
      password_hash: string;
      salt: string;
      display_name: string;
      avatar: string;
      bio: string;
      role: string;
      status: string;
      total_xp: number;
    } | undefined;

    if (!user) {
      return NextResponse.json(
        { error: "Kombinasi akun atau kata sandi tidak sesuai." },
        { status: 401 }
      );
    }

    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Akun Anda telah dinonaktifkan oleh administrator. Hubungi support untuk informasi lebih lanjut." },
        { status: 403 }
      );
    }

    // Verify password with constant-time comparison
    const isPasswordValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Kombinasi akun atau kata sandi tidak sesuai." },
        { status: 401 }
      );
    }

    // Create session
    const { token, expiresAt } = createSession(user.id);
    logAudit(user.id, "LOGIN", "user", user.id, `User logged in from ${ip}`);

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      totalXp: user.total_xp,
    };

    const response = NextResponse.json({
      message: "Login berhasil! Selamat datang kembali.",
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
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal pada server." }, { status: 500 });
  }
}
