import { NextResponse } from "next/server";
import { getDb, logAudit, createNotification, hashString } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const writeupOnly = url.searchParams.get("writeup") === "1";

    let query = `
      SELECT id, author_name, title, slug, abstract, category, keywords,
             is_writeup, has_spoilers, views_count, likes_count, published_at
      FROM research_articles
      WHERE status = 'published'
    `;
    const params: any[] = [];

    if (category && category !== "All") {
      query += " AND category = ?";
      params.push(category);
    }

    if (writeupOnly) {
      query += " AND is_writeup = 1";
    }

    query += " ORDER BY published_at DESC LIMIT 50";

    const articles = db.prepare(query).all(...params) as any[];

    const formattedArticles = articles.map((a) => {
      let keywords = [];
      try {
        keywords = JSON.parse(a.keywords);
      } catch {}
      return {
        ...a,
        keywords,
      };
    });

    return NextResponse.json({
      success: true,
      articles: formattedArticles,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login untuk mempublikasikan artikel riset atau write-up." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { title, abstract, category, keywords, content, references, isWriteup, hasSpoilers } = body;

    if (!title || !abstract || !content) {
      return NextResponse.json({ error: "Judul, abstrak, dan isi artikel riset wajib diisi." }, { status: 400 });
    }

    const db = getDb();

    // Anti-leak check for write-ups: ensure active challenge flags are NOT disclosed in plaintext
    if (isWriteup) {
      const activeChallenges = db.prepare("SELECT flag_hash FROM ctf_challenges WHERE is_published = 1").all() as { flag_hash: string }[];
      // Check for raw flags like CYBERLAB{...}
      const flagMatches = content.match(/CYBERLAB\{[^}]+\}/gi) || [];
      for (const rawFlag of flagMatches) {
        const computed = hashString(rawFlag);
        for (const c of activeChallenges) {
          if (computed === c.flag_hash) {
            return NextResponse.json(
              { error: "Penerbitan ditolak: Konten artikel memuat flag aktif tantangan resmi CyberLab-ID. Sembunyikan atau ganti flag dengan placeholder (misal: CYBERLAB{REDACTED})." },
              { status: 400 }
            );
          }
        }
      }
    }

    const now = new Date().toISOString();
    const articleId = `art_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${crypto.randomBytes(2).toString("hex")}`;

    db.prepare(`
      INSERT INTO research_articles (
        id, user_id, author_name, title, slug, abstract, category, keywords, content,
        references_list, is_writeup, has_spoilers, status, views_count, likes_count, published_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, 0, ?, ?)
    `).run(
      articleId,
      user.id,
      user.display_name,
      title.trim(),
      slug,
      abstract.trim(),
      category || "General Research",
      JSON.stringify(Array.isArray(keywords) ? keywords : ["Cybersecurity"]),
      content.trim(),
      JSON.stringify(Array.isArray(references) ? references : []),
      isWriteup ? 1 : 0,
      hasSpoilers ? 1 : 0,
      now,
      now
    );

    // Award Security Researcher badge
    const achRes = db
      .prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_code = 'security-researcher'")
      .get(user.id);
    if (!achRes) {
      db.prepare(`
        INSERT INTO user_achievements (id, user_id, achievement_code, unlocked_at)
        VALUES (?, ?, 'security-researcher', ?)
      `).run(`uach_${user.id}_res`, user.id, now);
      db.prepare("UPDATE users SET total_xp = total_xp + 90 WHERE id = ?").run(user.id);
    }

    logAudit(user.id, "PUBLISH_RESEARCH", "research_article", articleId, `Published ${title.slice(0, 50)}`);
    createNotification(user.id, "Artikel Riset Dipublikasikan!", `Artikel teknis "${title}" telah tayang di Research Hub (+90 XP).`, "achievement", `/research/${slug}`);

    return NextResponse.json({
      success: true,
      message: "Artikel riset berhasil dipublikasikan di CyberLab Research Hub!",
      slug,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to publish article" }, { status: 500 });
  }
}
