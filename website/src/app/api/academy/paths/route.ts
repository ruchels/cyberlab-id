import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const user = await getSessionUser(request);

    const paths = db
      .prepare(`
        SELECT id, title, description, target_audience, prerequisites, learning_objectives,
               difficulty, estimated_hours, category, modules_list, completion_xp, created_at
        FROM academy_paths
        ORDER BY difficulty ASC, estimated_hours ASC
      `)
      .all() as any[];

    // If user is logged in, attach enrollment status
    let enrollmentsMap: Record<string, any> = {};
    if (user) {
      const userEnrollments = db
        .prepare("SELECT path_id, progress_percent, is_completed, enrolled_at, completed_at FROM academy_enrollments WHERE user_id = ?")
        .all(user.id) as any[];
      for (const e of userEnrollments) {
        enrollmentsMap[e.path_id] = e;
      }
    }

    const formattedPaths = paths.map((p) => {
      let modules = [];
      try {
        modules = JSON.parse(p.modules_list);
      } catch {}
      return {
        ...p,
        modules,
        enrollment: enrollmentsMap[p.id] || null,
      };
    });

    return NextResponse.json({
      success: true,
      paths: formattedPaths,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch academy paths" }, { status: 500 });
  }
}
