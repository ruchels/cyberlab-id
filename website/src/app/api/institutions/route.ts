import { NextRequest, NextResponse } from "next/server";
import { getDb, logAudit, awardAchievement } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { logTenantAudit } from "@/lib/server/tenant-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const user = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const myOnly = searchParams.get("my") === "true";

    if (myOnly && user) {
      const myInstitutions = db
        .prepare(`
          SELECT i.*, m.role as my_role, m.status as my_status
          FROM institutions i
          JOIN institution_members m ON i.id = m.institution_id
          WHERE m.user_id = ? AND m.status = 'active'
          ORDER BY i.name ASC
        `)
        .all(user.id);
      return NextResponse.json({ institutions: myInstitutions });
    }

    // Public listing of active verified institutions
    const institutions = db
      .prepare(`
        SELECT id, slug, name, org_type, description, logo_url, brand_color,
               website_url, plan_tier, is_verified, created_at,
               (SELECT COUNT(*) FROM institution_members WHERE institution_id = institutions.id) as member_count,
               (SELECT COUNT(*) FROM institution_courses WHERE institution_id = institutions.id) as course_count
        FROM institutions
        WHERE status = 'active'
        ORDER BY is_verified DESC, name ASC
      `)
      .all();

    return NextResponse.json({ institutions });
  } catch (error: any) {
    console.error("GET /api/institutions error:", error);
    return NextResponse.json({ error: "Gagal memuat daftar institusi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Autentikasi diperlukan untuk mendaftarkan institusi" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, org_type, description, website_url, contact_email, brand_color, welcome_message } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Nama institusi dan slug URL wajib diisi" }, { status: 400 });
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    const db = getDb();

    // Check slug uniqueness
    const existing = db.prepare("SELECT id FROM institutions WHERE slug = ?").get(cleanSlug);
    if (existing) {
      return NextResponse.json({ error: "Slug URL institusi telah digunakan" }, { status: 409 });
    }

    const id = `inst_${cleanSlug.replace(/-/g, "_")}_${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO institutions (
        id, slug, name, org_type, description, logo_url, brand_color,
        welcome_message, website_url, contact_email, status, plan_tier,
        plan_max_users, plan_max_storage_mb, plan_max_lab_concurrency,
        plan_ai_monthly_tokens, is_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'education', 500, 20480, 25, 2000000, 0, ?, ?)
    `).run(
      id,
      cleanSlug,
      name.trim(),
      org_type || "university",
      description || "",
      body.logo_url || "",
      brand_color || "#00ff9d",
      welcome_message || `Selamat datang di portal pembelajaran ${name.trim()}`,
      website_url || "",
      contact_email || user.email,
      now,
      now
    );

    // Assign creating user as Owner of the new tenant
    const memberId = `imem_${id}_${user.id.slice(-6)}`;
    db.prepare(`
      INSERT INTO institution_members (id, institution_id, user_id, role, status, joined_at, created_at)
      VALUES (?, ?, ?, 'owner', 'active', ?, ?)
    `).run(memberId, id, user.id, now, now);

    // Initialize default AI settings for the institution
    db.prepare(`
      INSERT OR IGNORE INTO institution_ai_settings (institution_id, ai_enabled, custom_system_prompt, allowed_domains, require_human_grade_approval, monthly_token_usage, updated_at)
      VALUES (?, 1, ?, '["linux","networking","web","crypto","forensics","reverse"]', 1, 0, ?)
    `).run(id, `Anda adalah asisten akademik resmi ${name.trim()}.`, now);

    // Log institutional audit
    logTenantAudit(id, user.id, "INSTITUTION_REGISTERED", "institution", id, { name, org_type });
    logAudit(user.id, "INSTITUTION_CREATED", "institution", id, `Registered institution ${name}`);

    // Award enterprise admin achievement
    awardAchievement(user.id, "ach_enterprise-admin");

    return NextResponse.json({
      success: true,
      institution: {
        id,
        slug: cleanSlug,
        name,
        role: "owner",
      },
    });
  } catch (error: any) {
    console.error("POST /api/institutions error:", error);
    return NextResponse.json({ error: "Gagal mendaftarkan institusi: " + error.message }, { status: 500 });
  }
}
