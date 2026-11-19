import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser, logAudit } from "@/lib/server/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const db = getDb();
    const user = await getSessionUser(request);

    const post = db
      .prepare(`
        SELECT 
          p.id, p.title, p.content, p.category, p.likes_count, p.comments_count, p.is_pinned, p.created_at, p.updated_at,
          u.id as author_id, u.username as author_username, u.display_name as author_display_name, u.avatar as author_avatar, u.role as author_role
        FROM community_posts p
        JOIN users u ON u.id = p.user_id
        WHERE p.id = ?
      `)
      .get(postId) as any;

    if (!post) {
      return NextResponse.json({ error: "Diskusi tidak ditemukan." }, { status: 404 });
    }

    // Get comments
    const comments = db
      .prepare(`
        SELECT 
          c.id, c.content, c.created_at, c.updated_at,
          u.id as author_id, u.username as author_username, u.display_name as author_display_name, u.avatar as author_avatar, u.role as author_role
        FROM community_comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
      `)
      .all(postId) as any[];

    let isLiked = false;
    if (user) {
      const like = db
        .prepare("SELECT id FROM community_likes WHERE post_id = ? AND user_id = ?")
        .get(postId, user.id);
      isLiked = Boolean(like);
    }

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        likesCount: post.likes_count,
        commentsCount: post.comments_count,
        isPinned: Boolean(post.is_pinned),
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        isLiked,
        author: {
          id: post.author_id,
          username: post.author_username,
          displayName: post.author_display_name,
          avatar: post.author_avatar,
          role: post.author_role,
        },
        comments: comments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.created_at,
          author: {
            id: c.author_id,
            username: c.author_username,
            displayName: c.author_display_name,
            avatar: c.author_avatar,
            role: c.author_role,
          },
        })),
      },
    });
  } catch (error) {
    console.error("Fetch Post Detail Error:", error);
    return NextResponse.json({ error: "Gagal memuat diskusi." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const db = getDb();
    const post = db.prepare("SELECT user_id FROM community_posts WHERE id = ?").get(postId) as { user_id: string } | undefined;

    if (!post) {
      return NextResponse.json({ error: "Diskusi tidak ditemukan." }, { status: 404 });
    }

    // Authorization check: only author or admin
    if (post.user_id !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Anda tidak memiliki wewenang untuk mengedit diskusi ini." }, { status: 403 });
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title || !content || title.trim().length < 5 || content.trim().length < 10) {
      return NextResponse.json({ error: "Judul dan isi diskusi tidak memenuhi syarat panjang minimal." }, { status: 400 });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE community_posts
      SET title = ?, content = ?, updated_at = ?
      WHERE id = ?
    `).run(title.trim(), content.trim(), now, postId);

    return NextResponse.json({ message: "Diskusi berhasil diperbarui." });
  } catch (error) {
    console.error("Edit Post Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui diskusi." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const db = getDb();
    const post = db.prepare("SELECT user_id, title FROM community_posts WHERE id = ?").get(postId) as { user_id: string; title: string } | undefined;

    if (!post) {
      return NextResponse.json({ error: "Diskusi tidak ditemukan." }, { status: 404 });
    }

    // Authorization check: only author, moderator, or admin
    if (post.user_id !== user.id && user.role !== "admin" && user.role !== "moderator") {
      return NextResponse.json({ error: "Anda tidak berhak menghapus diskusi ini." }, { status: 403 });
    }

    db.prepare("DELETE FROM community_posts WHERE id = ?").run(postId);
    logAudit(user.id, "DELETE_POST", "community_post", postId, `Deleted post: ${post.title}`);

    return NextResponse.json({ message: "Diskusi berhasil dihapus." });
  } catch (error) {
    console.error("Delete Post Error:", error);
    return NextResponse.json({ error: "Gagal menghapus diskusi." }, { status: 500 });
  }
}
