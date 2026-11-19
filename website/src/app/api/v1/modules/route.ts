import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/server/api-v1-auth";
import { getDb } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const auth = authenticateApiKey(req, "read:modules");
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const db = getDb();
    const paths = db
      .prepare(
        `SELECT id, title, description, target_audience, difficulty, estimated_hours,
                category, modules_list, completion_xp, created_at
         FROM academy_paths
         ORDER BY id ASC`
      )
      .all() as any[];

    const modulesData = paths.map((p) => {
      let modulesList = [];
      try {
        modulesList = JSON.parse(p.modules_list);
      } catch {
        modulesList = [];
      }
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        estimatedHours: p.estimated_hours,
        category: p.category,
        totalModules: modulesList.length,
        completionXp: p.completion_xp,
      };
    });

    return NextResponse.json({
      success: true,
      apiVersion: "1.0",
      timestamp: new Date().toISOString(),
      count: modulesData.length,
      data: modulesData,
    });
  } catch (err: any) {
    console.error("API v1 modules error:", err);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
