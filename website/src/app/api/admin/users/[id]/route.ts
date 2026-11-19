import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { requireAdmin, logAudit } from "@/lib/server/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id: targetUserId } = await params;
    const body = await request.json();
    const { role, status } = body;

    const db = getDb();
    const targetUser = db.prepare("SELECT id, username, role, status FROM users WHERE id = ?").get(targetUserId) as any;

    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    // Prevent admin from demoting or suspending themselves
    if (targetUser.id === admin.id && (status === "suspended" || role !== "admin")) {
      return NextResponse.json({ error: "Anda tidak dapat menonaktifkan atau menurunkan role akun Anda sendiri." }, { status: 400 });
    }

    const newRole = role && ["user", "moderator", "admin"].includes(role) ? role : targetUser.role;
    const newStatus = status && ["active", "suspended"].includes(status) ? status : targetUser.status;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET role = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(newRole, newStatus, now, targetUserId);

    // If suspended, terminate all sessions
    if (newStatus === "suspended") {
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(targetUserId);
    }

    logAudit(
      admin.id,
      "UPDATE_USER",
      "user",
      targetUserId,
      `Updated user ${targetUser.username}: role=${newRole}, status=${newStatus}`
    );

    return NextResponse.json({ message: "Status dan role pengguna berhasil diperbarui." });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error?.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    console.error("Admin Update User Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui pengguna." }, { status: 500 });
  }
}
