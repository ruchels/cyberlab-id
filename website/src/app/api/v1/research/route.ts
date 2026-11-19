import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/server/api-v1-auth";
import { getDb } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const auth = authenticateApiKey(req, "read:research");
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const db = getDb();
    const articles = db
      .prepare(
        `SELECT a.id, a.slug, a.title, a.summary, a.category, a.tags,
                a.likes_count, a.is_published, a.created_at,
                u.display_name as author_name
         FROM research_articles a
         LEFT JOIN users u ON a.author_id = u.id
         WHERE a.is_published = 1
         ORDER BY a.created_at DESC`
      )
      .all() as any[];

    const data = articles.map((a) => {
      let tags = [];
      try {
        tags = JSON.parse(a.tags);
      } catch {
        tags = [];
      }
      return {
        id: a.id,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        category: a.category,
        tags,
        author: a.author_name || "CyberLab Researcher",
        likesCount: a.likes_count,
        publishedAt: a.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      apiVersion: "1.0",
      timestamp: new Date().toISOString(),
      count: data.length,
      data,
    });
  } catch (err: any) {
    console.error("API v1 research error:", err);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
