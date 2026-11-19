import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getDb, logAudit } from "@/lib/server/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Autentikasi diperlukan." }, { status: 401 });
    }

    const { password, confirmText } = await req.json();

    if (confirmText !== "DELETE MY ACCOUNT") {
      return NextResponse.json(
        { success: false, error: "Konfirmasi teks harus tepat 'DELETE MY ACCOUNT'." },
        { status: 400 }
      );
    }

    const db = getDb();
    const userRow = db.prepare("SELECT password_hash, salt FROM users WHERE id = ?").get(user.id) as any;
    if (!userRow) {
      return NextResponse.json({ success: false, error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    // Verify password with PBKDF2
    const verifyHash = crypto
      .pbkdf2Sync(password, userRow.salt, 100000, 64, "sha512")
      .toString("hex");

    if (verifyHash !== userRow.password_hash) {
      return NextResponse.json({ success: false, error: "Kata sandi salah. Penghapusan akun dibatalkan." }, { status: 403 });
    }

    // Audit before deletion
    logAudit(user.id, "user_account_deleted", "user", user.id, `Username ${user.username} permanently deleted`);

    // Delete user (cascade handles foreign keys)
    db.prepare("DELETE FROM users WHERE id = ?").run(user.id);

    const response = NextResponse.json({
      success: true,
      message: "Akun dan seluruh riwayat data terkait telah dihapus permanen dari platform CyberLab-ID.",
    });

    // Clear session cookies
    response.cookies.delete("token");
    response.cookies.delete("session_id");

    return response;
  } catch (err: any) {
    console.error("Delete account error:", err);
    return NextResponse.json({ success: false, error: "Gagal memproses penghapusan akun." }, { status: 500 });
  }
}
