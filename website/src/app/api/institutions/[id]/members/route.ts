import { NextRequest, NextResponse } from "next/server";
import { getDb, createNotification } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { validateTenantAccess, checkTenantQuota, logTenantAudit } from "@/lib/server/tenant-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }

    // Tenant isolation: User must belong to this institution
    const auth = validateTenantAccess(user.id, id, "student");
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const inst = auth.institution;
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");
    const search = searchParams.get("q")?.toLowerCase();

    let query = `
      SELECT m.id, m.role, m.status, m.student_id_number, m.joined_at,
             u.id as user_id, u.username, u.display_name, u.email, u.avatar,
             d.name as department_name, d.code as department_code
      FROM institution_members m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN institution_departments d ON m.department_id = d.id
      WHERE m.institution_id = ?
    `;
    const queryParams: any[] = [inst.id];

    if (roleFilter) {
      query += ` AND m.role = ?`;
      queryParams.push(roleFilter);
    }

    if (search) {
      query += ` AND (LOWER(u.display_name) LIKE ? OR LOWER(u.username) LIKE ? OR LOWER(m.student_id_number) LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY m.joined_at DESC`;
    const members = db.prepare(query).all(...queryParams);

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error("GET /api/institutions/[id]/members error:", error);
    return NextResponse.json({ error: "Gagal memuat anggota institusi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }

    // Role check: Department admin, Admin, or Owner required
    const auth = validateTenantAccess(user.id, id, "department_admin");
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const inst = auth.institution;
    const body = await req.json();
    const { identifier, role = "student", department_id, student_id_number } = body;

    if (!identifier) {
      return NextResponse.json({ error: "Email atau username pengguna wajib diisi" }, { status: 400 });
    }

    // Check plan quota
    const quota = checkTenantQuota(inst.id, "users");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: 403 });
    }

    const db = getDb();
    const targetUser = db
      .prepare("SELECT id, display_name, email FROM users WHERE email = ? OR username = ?")
      .get(identifier.trim(), identifier.trim()) as any;

    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna dengan email/username tersebut tidak ditemukan di platform" }, { status: 404 });
    }

    // Check if already member
    const existing = db
      .prepare("SELECT id, status FROM institution_members WHERE institution_id = ? AND user_id = ?")
      .get(inst.id, targetUser.id) as any;

    if (existing) {
      return NextResponse.json({ error: "Pengguna sudah menjadi anggota institusi ini" }, { status: 409 });
    }

    const memberId = `imem_${inst.id.slice(-4)}_${targetUser.id.slice(-6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO institution_members (
        id, institution_id, user_id, role, department_id, student_id_number, status, joined_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(
      memberId,
      inst.id,
      targetUser.id,
      role,
      department_id || null,
      student_id_number || "",
      now,
      now
    );

    logTenantAudit(inst.id, user.id, "MEMBER_ADDED", "user", targetUser.id, { role, department_id });

    createNotification(
      targetUser.id,
      `Anda telah bergabung dengan ${inst.name}!`,
      `Peran Anda: ${role}. Kunjungi portal institusi untuk melihat kelas dan materi.`,
      "info",
      `/institutions/${inst.slug}`
    );

    return NextResponse.json({ success: true, message: `Berhasil menambahkan ${targetUser.display_name} ke institusi.` });
  } catch (error: any) {
    console.error("POST /api/institutions/[id]/members error:", error);
    return NextResponse.json({ error: "Gagal menambahkan anggota: " + error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const auth = validateTenantAccess(user.id, id, "admin");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const body = await req.json();
    const { member_id, role, department_id, status } = body;

    if (!member_id) {
      return NextResponse.json({ error: "ID anggota wajib disertakan" }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      UPDATE institution_members
      SET role = COALESCE(?, role),
          department_id = COALESCE(?, department_id),
          status = COALESCE(?, status)
      WHERE id = ? AND institution_id = ?
    `).run(role, department_id, status, member_id, inst.id);

    logTenantAudit(inst.id, user.id, "MEMBER_UPDATED", "member", member_id, { role, status });

    return NextResponse.json({ success: true, message: "Peran anggota berhasil diperbarui" });
  } catch (error: any) {
    console.error("PATCH /api/institutions/[id]/members error:", error);
    return NextResponse.json({ error: "Gagal memperbarui anggota: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const auth = validateTenantAccess(user.id, id, "admin");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "Parameter memberId wajib disertakan" }, { status: 400 });
    }

    const db = getDb();
    db.prepare("DELETE FROM institution_members WHERE id = ? AND institution_id = ?").run(memberId, inst.id);

    logTenantAudit(inst.id, user.id, "MEMBER_REMOVED", "member", memberId);

    return NextResponse.json({ success: true, message: "Anggota berhasil dihapus dari institusi" });
  } catch (error: any) {
    console.error("DELETE /api/institutions/[id]/members error:", error);
    return NextResponse.json({ error: "Gagal menghapus anggota: " + error.message }, { status: 500 });
  }
}
