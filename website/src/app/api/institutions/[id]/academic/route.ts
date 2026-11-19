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

    const auth = validateTenantAccess(user.id, id, "student");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const db = getDb();

    // Fetch departments
    const departments = db
      .prepare(`
        SELECT d.*, u.display_name as head_name,
               (SELECT COUNT(*) FROM institution_classes WHERE department_id = d.id) as class_count,
               (SELECT COUNT(*) FROM institution_members WHERE department_id = d.id) as member_count
        FROM institution_departments d
        LEFT JOIN users u ON d.head_user_id = u.id
        WHERE d.institution_id = ?
        ORDER BY d.name ASC
      `)
      .all(inst.id);

    // Fetch classes
    const classes = db
      .prepare(`
        SELECT c.*, d.name as department_name, d.code as department_code,
               u.display_name as instructor_name,
               (SELECT COUNT(*) FROM institution_class_students WHERE class_id = c.id) as student_count
        FROM institution_classes c
        LEFT JOIN institution_departments d ON c.department_id = d.id
        LEFT JOIN users u ON c.instructor_user_id = u.id
        WHERE c.institution_id = ?
        ORDER BY c.academic_term DESC, c.name ASC
      `)
      .all(inst.id);

    return NextResponse.json({ departments, classes });
  } catch (error: any) {
    console.error("GET /api/institutions/[id]/academic error:", error);
    return NextResponse.json({ error: "Gagal memuat struktur akademik" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const auth = validateTenantAccess(user.id, id, "department_admin");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const body = await req.json();
    const { type } = body; // 'department' | 'class' | 'enroll_student'
    const db = getDb();
    const now = new Date().toISOString();

    if (type === "department") {
      const { name, code, head_user_id } = body;
      if (!name || !code) return NextResponse.json({ error: "Nama dan kode departemen wajib diisi" }, { status: 400 });

      const deptId = `idept_${inst.id.slice(-4)}_${code.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString().slice(-4)}`;
      db.prepare(`
        INSERT INTO institution_departments (id, institution_id, name, code, head_user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(deptId, inst.id, name.trim(), code.toUpperCase().trim(), head_user_id || null, now);

      logTenantAudit(inst.id, user.id, "DEPARTMENT_CREATED", "department", deptId, { name, code });
      return NextResponse.json({ success: true, department_id: deptId, message: "Departemen berhasil dibuat" });
    }

    if (type === "class") {
      const { department_id, name, academic_term, instructor_user_id } = body;
      if (!name || !academic_term) return NextResponse.json({ error: "Nama kelas dan semester/periode akademik wajib diisi" }, { status: 400 });

      const classId = `icls_${inst.id.slice(-4)}_${Date.now().toString().slice(-6)}`;
      db.prepare(`
        INSERT INTO institution_classes (id, institution_id, department_id, name, academic_term, instructor_user_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
      `).run(classId, inst.id, department_id || null, name.trim(), academic_term.trim(), instructor_user_id || user.id, now);

      logTenantAudit(inst.id, user.id, "CLASS_CREATED", "class", classId, { name, academic_term });
      return NextResponse.json({ success: true, class_id: classId, message: "Kelas/kohort berhasil dibuat" });
    }

    if (type === "enroll_student") {
      const { class_id, user_id } = body;
      if (!class_id || !user_id) return NextResponse.json({ error: "class_id dan user_id wajib disertakan" }, { status: 400 });

      // IDOR check: verify class belongs to this institution
      const cls = db.prepare("SELECT id FROM institution_classes WHERE id = ? AND institution_id = ?").get(class_id, inst.id);
      if (!cls) return NextResponse.json({ error: "Kelas tidak ditemukan pada institusi ini" }, { status: 404 });

      db.prepare(`
        INSERT OR IGNORE INTO institution_class_students (class_id, user_id, enrolled_at)
        VALUES (?, ?, ?)
      `).run(class_id, user_id, now);

      logTenantAudit(inst.id, user.id, "STUDENT_ENROLLED", "class_student", `${class_id}:${user_id}`);
      return NextResponse.json({ success: true, message: "Siswa berhasil didaftarkan ke dalam kelas" });
    }

    return NextResponse.json({ error: "Tipe aksi akademik tidak valid" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/institutions/[id]/academic error:", error);
    return NextResponse.json({ error: "Gagal memproses aksi akademik: " + error.message }, { status: 500 });
  }
}
