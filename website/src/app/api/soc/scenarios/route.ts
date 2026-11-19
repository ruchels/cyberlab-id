import { NextRequest, NextResponse } from "next/server";
import { getDb, awardAchievement, logAudit } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { ingestAndEvaluateEvent } from "@/lib/server/soc-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const scenarios = db.prepare("SELECT * FROM soc_scenarios ORDER BY created_at ASC").all() as any[];

    const parsed = scenarios.map((s) => ({
      ...s,
      objectives: typeof s.objectives === "string" ? JSON.parse(s.objectives || "[]") : s.objectives,
      telemetry_data: typeof s.telemetry_data === "string" ? JSON.parse(s.telemetry_data || "[]") : s.telemetry_data,
      scoring_criteria: typeof s.scoring_criteria === "string" ? JSON.parse(s.scoring_criteria || "{}") : s.scoring_criteria,
    }));

    return NextResponse.json({ scenarios: parsed });
  } catch (error: any) {
    console.error("GET /api/soc/scenarios error:", error);
    return NextResponse.json({ error: "Gagal memuat skenario pelatihan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const body = await req.json();
    const { scenario_id, institution_id = null } = body;

    if (!scenario_id) {
      return NextResponse.json({ error: "scenario_id wajib disertakan" }, { status: 400 });
    }

    const db = getDb();
    const scenario = db.prepare("SELECT * FROM soc_scenarios WHERE id = ?").get(scenario_id) as any;
    if (!scenario) {
      return NextResponse.json({ error: "Skenario tidak ditemukan" }, { status: 404 });
    }

    const telemetry = typeof scenario.telemetry_data === "string" ? JSON.parse(scenario.telemetry_data || "[]") : scenario.telemetry_data;

    let totalAlertsGenerated = 0;
    const injectedEvents = [];

    // Ingest each synthetic telemetry item
    for (const item of telemetry) {
      const raw = typeof item === "string" ? item : item.msg || JSON.stringify(item);
      const res = ingestAndEvaluateEvent(raw, scenario.category, institution_id, true);
      injectedEvents.push(res.event);
      totalAlertsGenerated += res.triggeredAlerts.length;
    }

    // Award initial analyst XP
    awardAchievement(user.id, "ach_soc-analyst-tier1");
    logAudit(user.id, "SOC_SCENARIO_LAUNCHED", "soc_scenario", scenario_id, `Launched scenario ${scenario.title}`);

    return NextResponse.json({
      success: true,
      scenario_title: scenario.title,
      injected_events_count: injectedEvents.length,
      alerts_generated_count: totalAlertsGenerated,
      message: `Skenario "${scenario.title}" berhasil diinjeksikan ke stream telemetri simulasi SOC. ${totalAlertsGenerated} alert baru siap diinvestigasi.`,
    });
  } catch (error: any) {
    console.error("POST /api/soc/scenarios error:", error);
    return NextResponse.json({ error: "Gagal meluncurkan skenario: " + error.message }, { status: 500 });
  }
}
