import { NextResponse } from "next/server";
import { getDb, logAudit } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const db = getDb();

    // 1. Provider config
    const config = db.prepare("SELECT * FROM ai_provider_config WHERE id = 'default_config'").get() as any;

    // Mask sensitive encrypted key if present
    const safeConfig = config
      ? {
          ...config,
          api_key_encrypted: undefined,
          hasCustomApiKey: Boolean(config.api_key_encrypted || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY),
        }
      : null;

    // 2. Knowledge documents
    const knowledgeDocs = db
      .prepare(`
        SELECT id, title, category, topic, tags, source_url, is_indexed, is_enabled, created_at, updated_at
        FROM ai_knowledge_docs
        ORDER BY updated_at DESC
      `)
      .all();

    // 3. Quiz drafts
    const quizDrafts = db
      .prepare(`
        SELECT * FROM ai_quiz_drafts
        ORDER BY CASE WHEN status = 'draft' THEN 0 ELSE 1 END, created_at DESC
        LIMIT 50
      `)
      .all();

    // 4. Recent analyses
    const recentAnalysesCount = db.prepare("SELECT count(*) as count FROM ai_security_analyses").get() as { count: number };
    const recentConversationsCount = db.prepare("SELECT count(*) as count FROM ai_conversations").get() as { count: number };

    return NextResponse.json({
      success: true,
      data: {
        config: safeConfig,
        knowledgeDocs,
        quizDrafts,
        stats: {
          totalAnalyses: recentAnalysesCount.count,
          totalConversations: recentConversationsCount.count,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load admin AI data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;
    const db = getDb();
    const now = new Date().toISOString();

    if (action === "update_config") {
      const { provider, modelName, apiKey, isEnabled, rateLimit } = body;

      const current = db.prepare("SELECT * FROM ai_provider_config WHERE id = 'default_config'").get() as any;
      let maskedKey = current?.api_key_masked || "AIzaSy*******************************";
      let encryptedKey = current?.api_key_encrypted || "";

      if (apiKey && apiKey.trim().length > 0 && !apiKey.includes("****")) {
        encryptedKey = apiKey.trim();
        maskedKey = apiKey.slice(0, 6) + "*******************************" + apiKey.slice(-4);
      }

      db.prepare(`
        UPDATE ai_provider_config
        SET provider = ?, model_name = ?, api_key_masked = ?, api_key_encrypted = ?, is_enabled = ?, rate_limit_per_minute = ?, updated_at = ?
        WHERE id = 'default_config'
      `).run(
        provider || current.provider,
        modelName || current.model_name,
        maskedKey,
        encryptedKey,
        isEnabled !== undefined ? (isEnabled ? 1 : 0) : current.is_enabled,
        rateLimit ? Number(rateLimit) : current.rate_limit_per_minute,
        now
      );

      logAudit(user.id, "UPDATE_AI_CONFIG", "ai_provider_config", "default_config", `Updated AI provider to ${provider}`);

      return NextResponse.json({
        success: true,
        message: "Konfigurasi AI Provider berhasil diperbarui.",
      });
    }

    if (action === "add_knowledge_doc") {
      const { title, category, topic, content, tags = [], sourceUrl = "" } = body;
      if (!title || !category || !content) {
        return NextResponse.json({ error: "Title, category, and content are required" }, { status: 400 });
      }

      const id = `doc-${Date.now()}`;
      db.prepare(`
        INSERT INTO ai_knowledge_docs (id, title, category, topic, content, tags, source_url, is_indexed, is_enabled, author_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
      `).run(id, title, category, topic || "General", content, JSON.stringify(tags), sourceUrl, user.id, now, now);

      logAudit(user.id, "ADD_KNOWLEDGE_DOC", "ai_knowledge_docs", id, `Added knowledge document: ${title}`);

      return NextResponse.json({
        success: true,
        docId: id,
        message: "Dokumen materi berhasil ditambahkan ke AI Knowledge Base.",
      });
    }

    if (action === "toggle_knowledge_doc") {
      const { docId, isEnabled } = body;
      db.prepare("UPDATE ai_knowledge_docs SET is_enabled = ?, updated_at = ? WHERE id = ?").run(
        isEnabled ? 1 : 0,
        now,
        docId
      );

      return NextResponse.json({
        success: true,
        message: `Status dokumen berhasil diubah.`,
      });
    }

    if (action === "delete_knowledge_doc") {
      const { docId } = body;
      db.prepare("DELETE FROM ai_knowledge_docs WHERE id = ?").run(docId);
      logAudit(user.id, "DELETE_KNOWLEDGE_DOC", "ai_knowledge_docs", docId, `Deleted knowledge document`);

      return NextResponse.json({
        success: true,
        message: "Dokumen berhasil dihapus dari Knowledge Base.",
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process admin AI action" }, { status: 500 });
  }
}
