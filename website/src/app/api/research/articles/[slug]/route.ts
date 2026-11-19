import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getDb();

    // Increment view count
    db.prepare("UPDATE research_articles SET views_count = views_count + 1 WHERE slug = ?").run(slug);

    const article = db
      .prepare(`
        SELECT a.*, u.username as author_username, u.avatar as author_avatar, u.role as author_role
        FROM research_articles a
        JOIN users u ON a.user_id = u.id
        WHERE a.slug = ? AND a.status = 'published'
      `)
      .get(slug) as any;

    if (!article) {
      return NextResponse.json({ error: "Artikel penelitian tidak ditemukan." }, { status: 404 });
    }

    let keywords = [];
    let references = [];
    try {
      keywords = JSON.parse(article.keywords);
    } catch {}
    try {
      references = JSON.parse(article.references_list);
    } catch {}

    return NextResponse.json({
      success: true,
      article: {
        ...article,
        keywords,
        references,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch article" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    db.prepare("UPDATE research_articles SET likes_count = likes_count + 1 WHERE slug = ?").run(slug);
    const updated = db.prepare("SELECT likes_count FROM research_articles WHERE slug = ?").get(slug) as any;

    return NextResponse.json({
      success: true,
      likesCount: updated?.likes_count || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to like article" }, { status: 500 });
  }
}
