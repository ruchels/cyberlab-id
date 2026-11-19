import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { feedback, notes = "" } = body;

    if (feedback !== "up" && feedback !== "down" && feedback !== null) {
      return NextResponse.json({ error: "Invalid feedback value" }, { status: 400 });
    }

    const db = getDb();
    // Verify that the message belongs to a conversation owned by this user
    const msg = db
      .prepare(`
        SELECT m.id
        FROM ai_messages m
        JOIN ai_conversations c ON m.conversation_id = c.id
        WHERE m.id = ? AND c.user_id = ?
      `)
      .get(id, user.id);

    if (!msg) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    db.prepare(`
      UPDATE ai_messages
      SET feedback = ?, feedback_notes = ?
      WHERE id = ?
    `).run(feedback, notes, id);

    return NextResponse.json({
      success: true,
      message: "Terima kasih atas umpan balik Anda untuk meningkatkan kualitas AI Tutor!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit feedback" }, { status: 500 });
  }
}
