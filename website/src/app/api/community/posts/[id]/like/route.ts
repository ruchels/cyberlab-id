import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import crypto from "node:crypto";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login untuk memberikan like." }, { status: 401 });
    }

    const db = getDb();
    const existing = db
      .prepare("SELECT id FROM community_likes WHERE post_id = ? AND user_id = ?")
      .get(postId, user.id);

    let isLiked = false;
    if (existing) {
      // Unlike
      db.prepare("DELETE FROM community_likes WHERE post_id = ? AND user_id = ?").run(postId, user.id);
      db.prepare("UPDATE community_posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?").run(postId);
      isLiked = false;
    } else {
      // Like
      const likeId = `like_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO community_likes (id, post_id, user_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run(likeId, postId, user.id, now);
      db.prepare("UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?").run(postId);
      isLiked = true;
    }

    const updatedPost = db
      .prepare("SELECT likes_count FROM community_posts WHERE id = ?")
      .get(postId) as { likes_count: number } | undefined;

    return NextResponse.json({
      isLiked,
      likesCount: updatedPost?.likes_count ?? 0,
    });
  } catch (error) {
    console.error("Toggle Like Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status like." }, { status: 500 });
  }
}
