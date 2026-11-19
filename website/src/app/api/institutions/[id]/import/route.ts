import { NextRequest, NextResponse } from "next/server";
import { getDb, runTransaction } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { validateTenantAccess, checkTenantQuota, logTenantAudit } from "@/lib/server/tenant-guard";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const auth = validateTenantAccess(user.id, id, "admin");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const body = await req.json();
    const { rows = [] } = body; // Array of { email_or_username, role, student_id_number, department_code }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Data impor kosong. Harap kirimkan array baris data CSV." }, { status: 400 });
    }

    const quota = checkTenantQuota(inst.id, "users");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: 403 });
    }

    const db = getDb();
    const now = new Date().toISOString();
    const results = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    runTransaction(() => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const identifier = (row.email_or_username || row.email || row.username || "").trim();
        if (!identifier) {
          results.skipped++;
          results.errors.push(`Baris ${i + 1}: Email/Username kosong`);
          continue;
        }

        const targetUser = db
          .prepare("SELECT id, display_name FROM users WHERE email = ? OR username = ?")
          .get(identifier, identifier) as any;

        if (!targetUser) {
          results.skipped++;
          results.errors.push(`Baris ${i + 1}: Pengguna "${identifier}" belum terdaftar di platform`);
          continue;
        }

        // Check if already in institution
        const existing = db
          .prepare("SELECT id FROM institution_members WHERE institution_id = ? AND user_id = ?")
          .get(inst.id, targetUser.id);

        if (existing) {
          results.skipped++;
          results.errors.push(`Baris ${i + 1}: ${targetUser.display_name} sudah menjadi anggota`);
          continue;
        }

        // Department lookup if provided
        let deptId = null;
        if (row.department_code) {
          const dept = db
            .prepare("SELECT id FROM institution_departments WHERE institution_id = ? AND (code = ? OR name = ?)")
            .get(inst.id, row.department_code.toUpperCase(), row.department_code) as any;
          if (dept) deptId = dept.id;
        }

        const memberId = `imem_${inst.id.slice(-4)}_${targetUser.id.slice(-6)}`;
        const role = ["student", "instructor", "ta", "auditor", "trainee"].includes(row.role) ? row.role : "student";

        db.prepare(`
          INSERT INTO institution_members (
            id, institution_id, user_id, role, department_id, student_id_number, status, joined_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
        `).run(memberId, inst.id, targetUser.id, role, deptId, row.student_id_number || "", now, now);

        results.imported++;
      }
    });

    logTenantAudit(inst.id, user.id, "BULK_IMPORT_COMPLETED", "import", inst.id, {
      total: results.total,
      imported: results.imported,
      skipped: results.skipped,
    });

    return NextResponse.json({
      success: true,
      summary: results,
      message: `Impor selesai: ${results.imported} anggota berhasil ditambahkan, ${results.skipped} dilewati.`,
    });
  } catch (error: any) {
    console.error("POST /api/institutions/[id]/import error:", error);
    return NextResponse.json({ error: "Gagal memproses impor: " + error.message }, { status: 500 });
  }
}
