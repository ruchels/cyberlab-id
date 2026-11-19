import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const user = await getSessionUser(request);

    const templates = db
      .prepare(`
        SELECT 
          id, title, description, category, difficulty, duration_minutes, xp_reward,
          cpu_limit, memory_limit, storage_limit, image_name, instructions, version, created_at
        FROM lab_templates
        WHERE is_published = 1
        ORDER BY xp_reward ASC, title ASC
      `)
      .all() as any[];

    let completedTemplateIds = new Set<string>();
    if (user) {
      const completions = db
        .prepare("SELECT template_id FROM lab_completions WHERE user_id = ?")
        .all(user.id) as { template_id: string }[];
      completedTemplateIds = new Set(completions.map((c) => c.template_id));
    }

    const payload = templates.map((t) => ({
      ...t,
      isCompleted: completedTemplateIds.has(t.id),
    }));

    return NextResponse.json({ templates: payload });
  } catch (error) {
    console.error("Fetch Templates Error:", error);
    return NextResponse.json({ error: "Gagal memuat template Cyber Range." }, { status: 500 });
  }
}
