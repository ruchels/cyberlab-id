import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Sesi telah berakhir. Silakan login kembali." }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, bio, avatar } = body;

    const cleanDisplayName =
      displayName && typeof displayName === "string" ? displayName.trim().slice(0, 50) : user.display_name;
    const cleanBio = typeof bio === "string" ? bio.trim().slice(0, 300) : user.bio;
    const cleanAvatar = typeof avatar === "string" && avatar.trim().length > 0 ? avatar.trim() : user.avatar;

    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET display_name = ?, bio = ?, avatar = ?, updated_at = ?
      WHERE id = ?
    `).run(cleanDisplayName, cleanBio, cleanAvatar, now, user.id);

    return NextResponse.json({
      message: "Profil Anda berhasil diperbarui.",
      user: {
        ...user,
        display_name: cleanDisplayName,
        bio: cleanBio,
        avatar: cleanAvatar,
        updated_at: now,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil." }, { status: 500 });
  }
}
