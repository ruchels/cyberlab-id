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
    const row = db
      .prepare(
        "SELECT id, preferred_language, preferred_timezone, github_username FROM users WHERE id = ?"
      )
      .get(user.id) as any;

    return NextResponse.json({
      success: true,
      data: {
        preferredLanguage: row?.preferred_language || "id",
        preferredTimezone: row?.preferred_timezone || "Asia/Jakarta",
        githubUsername: row?.github_username || "",
      },
    });
  } catch (err: any) {
    console.error("User preferences GET error:", err);
    return NextResponse.json({ success: false, error: "Gagal memuat preferensi pengguna." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Autentikasi diperlukan." }, { status: 401 });
    }

    const { preferredLanguage, preferredTimezone, githubUsername } = await req.json();
    const db = getDb();
    const now = new Date().toISOString();

    const lang = preferredLanguage === "en" ? "en" : "id";
    const tz = preferredTimezone || "Asia/Jakarta";
    const gh = (githubUsername || "").replace(/^@/, "").trim();

    db.prepare(`
      UPDATE users 
      SET preferred_language = ?, preferred_timezone = ?, github_username = ?, updated_at = ?
      WHERE id = ?
    `).run(lang, tz, gh, now, user.id);

    logAudit(user.id, "user_preferences_updated", "user", user.id, `Lang: ${lang}, TZ: ${tz}, GH: ${gh}`);

    return NextResponse.json({
      success: true,
      message: "Preferensi pengguna berhasil diperbarui.",
      data: {
        preferredLanguage: lang,
        preferredTimezone: tz,
        githubUsername: gh,
      },
    });
  } catch (err: any) {
    console.error("User preferences POST error:", err);
    return NextResponse.json({ success: false, error: "Gagal menyimpan preferensi pengguna." }, { status: 500 });
  }
}
