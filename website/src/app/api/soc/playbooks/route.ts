import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const playbooks = db.prepare("SELECT * FROM soc_playbooks ORDER BY created_at ASC").all() as any[];

    const parsed = playbooks.map((p) => ({
      ...p,
      required_evidence: typeof p.required_evidence === "string" ? JSON.parse(p.required_evidence || "[]") : p.required_evidence,
      investigation_steps: typeof p.investigation_steps === "string" ? JSON.parse(p.investigation_steps || "[]") : p.investigation_steps,
      containment_steps: typeof p.containment_steps === "string" ? JSON.parse(p.containment_steps || "[]") : p.containment_steps,
      recovery_steps: typeof p.recovery_steps === "string" ? JSON.parse(p.recovery_steps || "[]") : p.recovery_steps,
      checklist: typeof p.checklist === "string" ? JSON.parse(p.checklist || "[]") : p.checklist,
    }));

    return NextResponse.json({ playbooks: parsed });
  } catch (error: any) {
    console.error("GET /api/soc/playbooks error:", error);
    return NextResponse.json({ error: "Gagal memuat playbook keamanan" }, { status: 500 });
  }
}
