import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { calculateSocMetrics } from "@/lib/server/soc-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const user = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get("institutionId");

    let whereClause = "";
    const params: any[] = [];
    if (institutionId) {
      whereClause = "WHERE institution_id = ?";
      params.push(institutionId);
    }

    const totalEvents = (db.prepare(`SELECT COUNT(*) as c FROM soc_events ${whereClause}`).get(...params) as any).c;
    const totalAlerts = (db.prepare(`SELECT COUNT(*) as c FROM soc_alerts ${whereClause}`).get(...params) as any).c;
    
    const activeAlerts = (
      db.prepare(`SELECT COUNT(*) as c FROM soc_alerts ${whereClause ? whereClause + " AND" : "WHERE"} status IN ('new', 'acknowledged', 'investigating', 'escalated')`).get(...params) as any
    ).c;

    const criticalAlerts = (
      db.prepare(`SELECT COUNT(*) as c FROM soc_alerts ${whereClause ? whereClause + " AND" : "WHERE"} severity = 'critical' AND status NOT IN ('resolved', 'closed', 'false_positive')`).get(...params) as any
    ).c;

    const highAlerts = (
      db.prepare(`SELECT COUNT(*) as c FROM soc_alerts ${whereClause ? whereClause + " AND" : "WHERE"} severity = 'high' AND status NOT IN ('resolved', 'closed', 'false_positive')`).get(...params) as any
    ).c;

    const openIncidents = (
      db.prepare(`SELECT COUNT(*) as c FROM soc_incidents ${whereClause ? whereClause + " AND" : "WHERE"} status NOT IN ('closure', 'post_review')`).get(...params) as any
    ).c;

    const resolvedIncidents = (
      db.prepare(`SELECT COUNT(*) as c FROM soc_incidents ${whereClause ? whereClause + " AND" : "WHERE"} status IN ('closure', 'post_review')`).get(...params) as any
    ).c;

    const totalForensicCases = (db.prepare(`SELECT COUNT(*) as c FROM soc_forensic_cases ${whereClause}`).get(...params) as any).c;
    const totalAssets = (db.prepare(`SELECT COUNT(*) as c FROM soc_assets ${whereClause}`).get(...params) as any).c;

    // Severity Breakdown
    const severityStats = {
      critical: criticalAlerts,
      high: highAlerts,
      medium: (db.prepare(`SELECT COUNT(*) as c FROM soc_alerts ${whereClause ? whereClause + " AND" : "WHERE"} severity = 'medium' AND status NOT IN ('resolved', 'closed')`).get(...params) as any).c,
      low: (db.prepare(`SELECT COUNT(*) as c FROM soc_alerts ${whereClause ? whereClause + " AND" : "WHERE"} severity = 'low' AND status NOT IN ('resolved', 'closed')`).get(...params) as any).c,
    };

    // Calculate MTTD & MTTR
    const metrics = calculateSocMetrics(institutionId);

    return NextResponse.json({
      summary: {
        total_events: totalEvents,
        total_alerts: totalAlerts,
        active_alerts: activeAlerts,
        critical_alerts: criticalAlerts,
        high_alerts: highAlerts,
        open_incidents: openIncidents,
        resolved_incidents: resolvedIncidents,
        forensic_cases: totalForensicCases,
        monitored_assets: totalAssets,
        mttd_minutes: metrics.mttd_minutes,
        mttr_minutes: metrics.mttr_minutes,
        mttd_mttr_measurable: metrics.measurable,
        is_simulation_mode: true,
      },
      severity_distribution: severityStats,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("GET /api/soc/overview error:", error);
    return NextResponse.json({ error: "Gagal memuat metrik SOC" }, { status: 500 });
  }
}
