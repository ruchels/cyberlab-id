import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser, createNotification } from "@/lib/server/auth";
import crypto from "node:crypto";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login untuk mengirimkan komentar." }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length < 2 || content.trim().length > 2000) {
      return NextResponse.json({ error: "Komentar harus berisi 2 hingga 2000 karakter." }, { status: 400 });
    }

    const db = getDb();
    const post = db.prepare("SELECT user_id, title FROM community_posts WHERE id = ?").get(postId) as { user_id: string; title: string } | undefined;

    if (!post) {
      return NextResponse.json({ error: "Diskusi tidak ditemukan." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const commentId = `comm_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    db.prepare(`
      INSERT INTO community_comments (id, post_id, user_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(commentId, postId, user.id, content.trim(), now, now);

    // Increment comments count on post
    db.prepare("UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ?").run(postId);

    // Notify post author if commenter is someone else
    if (post.user_id !== user.id) {
      createNotification(
        post.user_id,
        "Komentar Baru pada Diskusi Anda",
        `${user.display_name} mengomentari diskusi "${post.title.slice(0, 40)}..."`,
        "comment",
        `/community#${postId}`
      );
    }

    return NextResponse.json({
      message: "Komentar berhasil dikirimkan.",
      comment: {
        id: commentId,
        content: content.trim(),
        createdAt: now,
        author: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          avatar: user.avatar,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Create Comment Error:", error);
    return NextResponse.json({ error: "Gagal mengirimkan komentar." }, { status: 500 });
  }
}
