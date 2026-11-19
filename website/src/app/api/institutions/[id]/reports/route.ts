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

    // Role check: Auditor, Department Admin, Admin, or Owner required for institutional reports
    const auth = validateTenantAccess(user.id, id, "auditor");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format"); // 'csv' or 'json'

    // Real analytics calculation
    const totalMembers = (db.prepare("SELECT COUNT(*) as c FROM institution_members WHERE institution_id = ?").get(inst.id) as any).c;
    const totalInstructors = (db.prepare("SELECT COUNT(*) as c FROM institution_members WHERE institution_id = ? AND role IN ('instructor', 'ta', 'admin', 'owner')").get(inst.id) as any).c;
    const totalStudents = (db.prepare("SELECT COUNT(*) as c FROM institution_members WHERE institution_id = ? AND role IN ('student', 'trainee')").get(inst.id) as any).c;
    const totalClasses = (db.prepare("SELECT COUNT(*) as c FROM institution_classes WHERE institution_id = ?").get(inst.id) as any).c;
    const totalCourses = (db.prepare("SELECT COUNT(*) as c FROM institution_courses WHERE institution_id = ?").get(inst.id) as any).c;
    const totalAssignments = (db.prepare("SELECT COUNT(*) as c FROM institution_course_assignments WHERE institution_id = ?").get(inst.id) as any).c;
    const totalSubmissions = (db.prepare("SELECT COUNT(*) as c FROM institution_submissions WHERE institution_id = ?").get(inst.id) as any).c;

    const avgScoreRow = db.prepare("SELECT AVG(score) as avg_score FROM institution_submissions WHERE institution_id = ? AND score IS NOT NULL").get(inst.id) as any;
    const averageScore = avgScoreRow?.avg_score ? Math.round(avgScoreRow.avg_score * 10) / 10 : 0;

    const certCount = (db.prepare("SELECT COUNT(*) as c FROM institution_certificates WHERE institution_id = ? AND is_revoked = 0").get(inst.id) as any).c;

    // Department breakdown
    const departmentStats = db
      .prepare(`
        SELECT d.id, d.name, d.code,
               (SELECT COUNT(*) FROM institution_members WHERE department_id = d.id) as member_count,
               (SELECT COUNT(*) FROM institution_classes WHERE department_id = d.id) as class_count
        FROM institution_departments d
        WHERE d.institution_id = ?
      `)
      .all(inst.id);

    // Class performance summary
    const classPerformance = db
      .prepare(`
        SELECT c.id, c.name, c.academic_term,
               (SELECT COUNT(*) FROM institution_class_students WHERE class_id = c.id) as student_count,
               (SELECT COUNT(*) FROM institution_lab_assignments WHERE class_id = c.id) as lab_count,
               (SELECT COUNT(*) FROM institution_course_assignments WHERE class_id = c.id) as assignment_count
        FROM institution_classes c
        WHERE c.institution_id = ?
      `)
      .all(inst.id);

    logTenantAudit(inst.id, user.id, "REPORT_GENERATED", "analytics", inst.id, { format: format || "json" });

    if (format === "csv") {
      let csv = "Department Code,Department Name,Member Count,Class Count\n";
      departmentStats.forEach((d: any) => {
        csv += `"${d.code}","${d.name}",${d.member_count},${d.class_count}\n`;
      });
      csv += "\nClass Name,Academic Term,Student Count,Assignment Count,Lab Count\n";
      classPerformance.forEach((c: any) => {
        csv += `"${c.name}","${c.academic_term}",${c.student_count},${c.assignment_count},${c.lab_count}\n`;
      });

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="cyberlab_${inst.slug}_report_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      summary: {
        total_members: totalMembers,
        total_students: totalStudents,
        total_instructors: totalInstructors,
        total_classes: totalClasses,
        total_courses: totalCourses,
        total_assignments: totalAssignments,
        total_submissions: totalSubmissions,
        average_assignment_score: averageScore,
        issued_certificates: certCount,
      },
      department_stats: departmentStats,
      class_performance: classPerformance,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("GET /api/institutions/[id]/reports error:", error);
    return NextResponse.json({ error: "Gagal membuat laporan analitik institusi" }, { status: 500 });
  }
}
