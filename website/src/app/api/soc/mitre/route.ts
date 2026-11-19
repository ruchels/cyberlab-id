import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();

    const rules = db.prepare("SELECT * FROM soc_detection_rules").all() as any[];
    const alerts = db.prepare("SELECT rule_id, COUNT(*) as alert_count FROM soc_alerts GROUP BY rule_id").all() as any[];

    const alertCountMap: Record<string, number> = {};
    alerts.forEach((a) => {
      alertCountMap[a.rule_id] = a.alert_count;
    });

    const tactics = [
      { id: "TA0001", name: "Initial Access", color: "#f87171" },
      { id: "TA0002", name: "Execution", color: "#fb923c" },
      { id: "TA0003", name: "Persistence", color: "#fbbf24" },
      { id: "TA0004", name: "Privilege Escalation", color: "#f43f5e" },
      { id: "TA0005", name: "Defense Evasion", color: "#c084fc" },
      { id: "TA0006", name: "Credential Access", color: "#e879f9" },
      { id: "TA0007", name: "Discovery", color: "#38bdf8" },
      { id: "TA0008", name: "Lateral Movement", color: "#818cf8" },
      { id: "TA0009", name: "Collection", color: "#34d399" },
      { id: "TA0011", name: "Command and Control", color: "#00ff9d" },
      { id: "TA0010", name: "Exfiltration", color: "#a3e635" },
      { id: "TA0040", name: "Impact", color: "#ef4444" },
    ];

    const matrix = tactics.map((tactic) => {
      const matchedRules = rules.filter((r) => r.mitre_tactic.toLowerCase() === tactic.name.toLowerCase());
      return {
        ...tactic,
        techniques_covered: matchedRules.map((r) => ({
          rule_id: r.id,
          technique_id: r.mitre_technique_id,
          rule_name: r.rule_name,
          severity: r.severity,
          alerts_count: alertCountMap[r.id] || 0,
        })),
        rule_count: matchedRules.length,
      };
    });

    return NextResponse.json({
      matrix,
      total_tactics: tactics.length,
      covered_tactics: matrix.filter((m) => m.rule_count > 0).length,
    });
  } catch (error: any) {
    console.error("GET /api/soc/mitre error:", error);
    return NextResponse.json({ error: "Gagal memuat matriks MITRE ATT&CK" }, { status: 500 });
  }
}
