import { NextResponse } from "next/server";
import { getDb, logAudit, createNotification, awardAchievement } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { generateAiResponse } from "@/lib/server/ai/provider";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const db = getDb();

    if (conversationId) {
      // Fetch messages for a specific conversation
      const conversation = db
        .prepare("SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?")
        .get(conversationId, user.id);

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      const rawMessages = db
        .prepare(`
          SELECT id, role, content, sources, feedback, created_at
          FROM ai_messages
          WHERE conversation_id = ?
          ORDER BY created_at ASC
        `)
        .all(conversationId) as any[];

      const messages = rawMessages.map((m) => {
        let sources = [];
        try {
          sources = JSON.parse(m.sources);
        } catch {}
        return {
          ...m,
          sources,
        };
      });

      return NextResponse.json({
        success: true,
        conversation,
        messages,
      });
    }

    // Otherwise list user's conversations
    const conversations = db
      .prepare(`
        SELECT c.*, count(m.id) as message_count
        FROM ai_conversations c
        LEFT JOIN ai_messages m ON c.id = m.conversation_id
        WHERE c.user_id = ?
        GROUP BY c.id
        ORDER BY c.updated_at DESC
        LIMIT 50
      `)
      .all(user.id);

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, conversationId, locale = "id", contextType = "general", contextId, hintLevel } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();
    let currentConvId = conversationId;

    // Create or retrieve conversation
    if (!currentConvId) {
      currentConvId = `conv_${crypto.randomUUID()}`;
      const title = prompt.trim().slice(0, 40) + (prompt.length > 40 ? "..." : "");
      db.prepare(`
        INSERT INTO ai_conversations (id, user_id, title, context_type, context_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(currentConvId, user.id, title, contextType, contextId || null, now, now);
    } else {
      const existing = db
        .prepare("SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?")
        .get(currentConvId, user.id);
      if (!existing) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
      db.prepare("UPDATE ai_conversations SET updated_at = ? WHERE id = ?").run(now, currentConvId);
    }

    // Save user message
    const userMsgId = `msg_${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO ai_messages (id, conversation_id, role, content, sources, created_at)
      VALUES (?, ?, 'user', ?, '[]', ?)
    `).run(userMsgId, currentConvId, prompt.trim(), now);

    // Fetch conversation history for context
    const previousMessages = db
      .prepare(`
        SELECT role, content FROM ai_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        LIMIT 10
      `)
      .all(currentConvId) as any[];

    // Generate response using provider & RAG engine
    const aiResult = await generateAiResponse({
      messages: previousMessages,
      locale,
      contextType,
      hintLevel,
    });

    // Save assistant message
    const assistantMsgId = `msg_${crypto.randomUUID()}`;
    const assistantNow = new Date().toISOString();
    db.prepare(`
      INSERT INTO ai_messages (id, conversation_id, role, content, sources, created_at)
      VALUES (?, ?, 'assistant', ?, ?, ?)
    `).run(assistantMsgId, currentConvId, aiResult.reply, JSON.stringify(aiResult.sources), assistantNow);

    // Award AI Scholar achievement on successful engagement
    awardAchievement(user.id, "ai-scholar");

    return NextResponse.json({
      success: true,
      conversationId: currentConvId,
      messageId: assistantMsgId,
      reply: aiResult.reply,
      sources: aiResult.sources,
      engine: aiResult.engine,
      provider: aiResult.provider,
      model: aiResult.model,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process AI chat" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const action = searchParams.get("action");
    const db = getDb();

    if (action === "clear_all") {
      db.prepare("DELETE FROM ai_conversations WHERE user_id = ?").run(user.id);
      logAudit(user.id, "AI_CONV_CLEAR_ALL", "ai_conversations", "all", "User cleared all AI chat history");
      return NextResponse.json({ success: true, message: "Semua riwayat percakapan berhasil dihapus." });
    }

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const conv = db
      .prepare("SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?")
      .get(conversationId, user.id);

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM ai_conversations WHERE id = ?").run(conversationId);
    logAudit(user.id, "AI_CONV_DELETE", "ai_conversations", conversationId, "User deleted AI conversation");

    return NextResponse.json({ success: true, message: "Percakapan berhasil dihapus." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete conversation" }, { status: 500 });
  }
}
