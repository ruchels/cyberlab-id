import { NextResponse } from "next/server";
import { getDb, logAudit } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { generatePersonalizedPath } from "@/lib/server/ai/personalization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const pathData = generatePersonalizedPath(user.id);

    return NextResponse.json({
      success: true,
      data: pathData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate personalized path" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { isPersonalizationEnabled, weeklyTargetHours, preferredDomains } = body;

    const db = getDb();
    const now = new Date().toISOString();

    const existing = db.prepare("SELECT user_id FROM ai_user_preferences WHERE user_id = ?").get(user.id);

    const isEnabledVal = isPersonalizationEnabled !== undefined ? (isPersonalizationEnabled ? 1 : 0) : 1;
    const targetHours = weeklyTargetHours ? Number(weeklyTargetHours) : 5;
    const domainsJson = Array.isArray(preferredDomains) ? JSON.stringify(preferredDomains) : "[]";

    if (existing) {
      db.prepare(`
        UPDATE ai_user_preferences
        SET is_personalization_enabled = ?, weekly_target_hours = ?, preferred_domains = ?, updated_at = ?
        WHERE user_id = ?
      `).run(isEnabledVal, targetHours, domainsJson, now, user.id);
    } else {
      db.prepare(`
        INSERT INTO ai_user_preferences (
          user_id, is_personalization_enabled, preferred_domains, weekly_target_hours, consent_given, consent_updated_at, updated_at
        ) VALUES (?, ?, ?, ?, 1, ?, ?)
      `).run(user.id, isEnabledVal, domainsJson, targetHours, now, now);
    }

    logAudit(user.id, "UPDATE_AI_PREFERENCES", "ai_user_preferences", user.id, `Personalization set to ${isEnabledVal}`);

    return NextResponse.json({
      success: true,
      message: "Preferensi personalisasi AI berhasil diperbarui.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update preferences" }, { status: 500 });
  }
}
