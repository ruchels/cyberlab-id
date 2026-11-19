import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import crypto from "node:crypto";

const VALID_CATEGORIES = [
  "General Discussion",
  "Linux & System Administration",
  "Networking",
  "Web Security",
  "Cryptography",
  "Digital Forensics",
  "Reverse Engineering",
  "CTF & Challenges",
  "Career & Certifications",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest"; // 'newest' | 'popular'

    const user = await getSessionUser(request);
    const db = getDb();

    let query = `
      SELECT 
        p.id, p.title, p.content, p.category, p.likes_count, p.comments_count, p.is_pinned, p.created_at, p.updated_at,
        u.id as author_id, u.username as author_username, u.display_name as author_display_name, u.avatar as author_avatar, u.role as author_role
      FROM community_posts p
      JOIN users u ON u.id = p.user_id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (category && category !== "all" && VALID_CATEGORIES.includes(category)) {
      query += " AND p.category = ?";
      params.push(category);
    }

    if (search && search.trim().length > 0) {
      query += " AND (p.title LIKE ? OR p.content LIKE ?)";
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (sort === "popular") {
      query += " ORDER BY p.is_pinned DESC, p.likes_count DESC, p.created_at DESC";
    } else {
      query += " ORDER BY p.is_pinned DESC, p.created_at DESC";
    }

    query += " LIMIT 50";

    const rows = db.prepare(query).all(...params) as any[];

    // Check user liked posts
    let likedPostIds = new Set<string>();
    if (user) {
      const likes = db
        .prepare("SELECT post_id FROM community_likes WHERE user_id = ?")
        .all(user.id) as { post_id: string }[];
      likedPostIds = new Set(likes.map((l) => l.post_id));
    }

    const posts = rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      category: r.category,
      likesCount: r.likes_count,
      commentsCount: r.comments_count,
      isPinned: Boolean(r.is_pinned),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      isLiked: likedPostIds.has(r.id),
      author: {
        id: r.author_id,
        username: r.author_username,
        displayName: r.author_display_name,
        avatar: r.author_avatar,
        role: r.author_role,
      },
    }));

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Fetch Community Posts Error:", error);
    return NextResponse.json({ error: "Gagal memuat daftar diskusi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Silakan masuk (login) terlebih dahulu untuk membuat diskusi." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, category } = body;

    if (!title || typeof title !== "string" || title.trim().length < 5 || title.trim().length > 150) {
      return NextResponse.json(
        { error: "Judul diskusi harus terdiri dari 5 hingga 150 karakter." },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length < 10 || content.trim().length > 5000) {
      return NextResponse.json(
        { error: "Isi diskusi harus terdiri dari 10 hingga 5000 karakter." },
        { status: 400 }
      );
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Kategori diskusi yang dipilih tidak valid." },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();
    const postId = `post_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    db.prepare(`
      INSERT INTO community_posts (id, user_id, title, content, category, likes_count, comments_count, is_pinned, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
    `).run(postId, user.id, title.trim(), content.trim(), category, now, now);

    return NextResponse.json({
      message: "Diskusi Anda berhasil dipublikasikan!",
      postId,
    });
  } catch (error) {
    console.error("Create Post Error:", error);
    return NextResponse.json({ error: "Gagal mempublikasikan diskusi." }, { status: 500 });
  }
}
