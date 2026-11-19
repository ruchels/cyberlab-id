import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getDb, verifyPassword, hashPassword } from "@/lib/server/db";
import crypto from "node:crypto";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Sesi telah berakhir. Silakan login kembali." }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Kata sandi lama dan baru wajib diisi." }, { status: 400 });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "Kata sandi baru minimal 8 karakter." }, { status: 400 });
    }

    const db = getDb();
    const userRow = db
      .prepare("SELECT password_hash, salt FROM users WHERE id = ?")
      .get(user.id) as { password_hash: string; salt: string } | undefined;

    if (!userRow || !verifyPassword(currentPassword, userRow.password_hash, userRow.salt)) {
      return NextResponse.json({ error: "Kata sandi lama yang Anda masukkan tidak sesuai." }, { status: 400 });
    }

    const newSalt = crypto.randomBytes(16).toString("hex");
    const newHash = hashPassword(newPassword, newSalt);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET password_hash = ?, salt = ?, updated_at = ?
      WHERE id = ?
    `).run(newHash, newSalt, now, user.id);

    return NextResponse.json({ message: "Kata sandi berhasil diperbarui." });
  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json({ error: "Gagal mengganti kata sandi." }, { status: 500 });
  }
}
