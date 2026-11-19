import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const db = getDb();
    const rows = db
      .prepare(`
        SELECT id, title, message, type, link, is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 30
      `)
      .all(user.id) as any[];

    const unreadCount = rows.filter((r) => !Boolean(r.is_read)).length;

    return NextResponse.json({
      notifications: rows.map((r) => ({
        id: r.id,
        title: r.title,
        message: r.message,
        type: r.type,
        link: r.link,
        isRead: Boolean(r.is_read),
        createdAt: r.created_at,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications Error:", error);
    return NextResponse.json({ error: "Gagal memuat notifikasi." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { notificationId } = body;
    const db = getDb();

    if (notificationId) {
      db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?").run(
        notificationId,
        user.id
      );
    } else {
      // Mark all as read
      db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(user.id);
    }

    return NextResponse.json({ message: "Notifikasi telah ditandai dibaca." });
  } catch (error) {
    console.error("Mark Read Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui notifikasi." }, { status: 500 });
  }
}
