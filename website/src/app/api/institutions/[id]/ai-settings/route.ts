import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { validateTenantAccess, logTenantAudit } from "@/lib/server/tenant-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const auth = validateTenantAccess(user.id, id, "instructor");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const db = getDb();

    let settings = db.prepare("SELECT * FROM institution_ai_settings WHERE institution_id = ?").get(inst.id) as any;
    if (!settings) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO institution_ai_settings (institution_id, ai_enabled, custom_system_prompt, allowed_domains, require_human_grade_approval, monthly_token_usage, updated_at)
        VALUES (?, 1, ?, '["linux","networking","web","crypto","forensics","reverse"]', 1, 0, ?)
      `).run(inst.id, `Anda adalah asisten akademik cybersecurity resmi ${inst.name}.`, now);
      settings = db.prepare("SELECT * FROM institution_ai_settings WHERE institution_id = ?").get(inst.id);
    }

    return NextResponse.json({
      settings: {
        ...settings,
        allowed_domains: typeof settings.allowed_domains === "string" ? JSON.parse(settings.allowed_domains || "[]") : settings.allowed_domains,
      },
      plan_ai_monthly_tokens: inst.plan_ai_monthly_tokens || 2000000,
    });
  } catch (error: any) {
    console.error("GET /api/institutions/[id]/ai-settings error:", error);
    return NextResponse.json({ error: "Gagal memuat pengaturan AI institusi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const auth = validateTenantAccess(user.id, id, "admin");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const body = await req.json();
    const { ai_enabled, custom_system_prompt, allowed_domains = [], require_human_grade_approval = 1 } = body;

    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO institution_ai_settings (
        institution_id, ai_enabled, custom_system_prompt, allowed_domains, require_human_grade_approval, monthly_token_usage, updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, ?)
      ON CONFLICT(institution_id) DO UPDATE SET
        ai_enabled = excluded.ai_enabled,
        custom_system_prompt = excluded.custom_system_prompt,
        allowed_domains = excluded.allowed_domains,
        require_human_grade_approval = excluded.require_human_grade_approval,
        updated_at = excluded.updated_at
    `).run(
      inst.id,
      ai_enabled ? 1 : 0,
      custom_system_prompt || "",
      JSON.stringify(allowed_domains),
      require_human_grade_approval ? 1 : 0,
      now
    );

    logTenantAudit(inst.id, user.id, "AI_SETTINGS_UPDATED", "ai_settings", inst.id, { ai_enabled });

    return NextResponse.json({ success: true, message: "Pengaturan AI institusi berhasil disimpan" });
  } catch (error: any) {
    console.error("POST /api/institutions/[id]/ai-settings error:", error);
    return NextResponse.json({ error: "Gagal memperbarui pengaturan AI: " + error.message }, { status: 500 });
  }
}
