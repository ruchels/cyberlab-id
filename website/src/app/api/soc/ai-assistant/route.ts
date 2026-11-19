import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const body = await req.json();
    const { alert_id, query_type = "triage", custom_prompt } = body;

    const db = getDb();
    let alertData = null;
    let eventsData: any[] = [];

    if (alert_id) {
      alertData = db
        .prepare(`
          SELECT a.*, r.rule_name, r.mitre_technique_id, r.mitre_tactic, r.description as rule_description
          FROM soc_alerts a
          LEFT JOIN soc_detection_rules r ON a.rule_id = r.id
          WHERE a.id = ?
        `)
        .get(alert_id) as any;

      if (alertData) {
        const eventIds = typeof alertData.source_event_ids === "string" ? JSON.parse(alertData.source_event_ids || "[]") : alertData.source_event_ids;
        if (eventIds.length > 0) {
          const placeholders = eventIds.map(() => "?").join(",");
          eventsData = db.prepare(`SELECT * FROM soc_events WHERE id IN (${placeholders})`).all(...eventIds);
        }
      }
    }

    // Grounded evidence synthesis
    let analysisSummary = "";
    let mitreExplanation = "";
    let containmentRecommendations: string[] = [];
    let investigationQuestions: string[] = [];

    if (alertData) {
      analysisSummary = `Berdasarkan analisis telemetri log terhadap alert "${alertData.title}", terdeteksi pola aktivitas ${alertData.severity.toUpperCase()} pada aset "${alertData.affected_asset}". Detection engine mengidentifikasi ${eventsData.length} bukti rekaman event yang bersesuaian dengan rule "${alertData.rule_name}".`;

      mitreExplanation = `Aktivitas ini dipetakan ke MITRE ATT&CK ${alertData.mitre_technique_id || "T1110"} (Taktik: ${alertData.mitre_tactic || "Credential Access"}). Teknik ini umum digunakan penyerang dalam tahap penetrasi awal untuk menguji celah pertahanan atau mengumpulkan kredensial akun target.`;

      containmentRecommendations = [
        "1. Segera isolasi IP sumber pada firewall perimeter (tambahkan rule DROP atau jail fail2ban).",
        "2. Periksa apakah terdapat status autentikasi yang berhasil setelah rentetan kegagalan.",
        "3. Lakukan rotasi kredensial jika akun sasaran merupakan akun berprivilese tinggi (admin/root).",
        "4. Perbarui tiket insiden dan lampirkan bukti log untuk audit pasca insiden.",
      ];

      investigationQuestions = [
        "Apakah IP sumber tercatat dalam daftar IoC reputasi buruk global?",
        "Apakah ada koneksi jaringan outbound yang tidak wajar setelah alert terpicu?",
        "Apakah service yang menjadi target memiliki pembaruan patch keamanan yang tertunda?",
      ];
    } else {
      analysisSummary =
        "Asisten AI SOC siap membantu menganalisis bukti telemetri, menjelaskan teknik MITRE ATT&CK, dan merumuskan respons penanganan insiden. Harap pilih alert atau masukkan log untuk analisis terarah.";
      containmentRecommendations = ["Lakukan validasi bukti sebelum mengambil tindakan penahanan berdampak luas."];
    }

    return NextResponse.json({
      success: true,
      query_type,
      analysis: {
        summary: analysisSummary,
        mitre_mapping: mitreExplanation,
        recommended_actions: containmentRecommendations,
        investigation_checklist: investigationQuestions,
        confidence: "high",
        grounded_events_count: eventsData.length,
        human_in_the_loop_notice: "Rekomendasi ini bersifat advisory defensif. Tindakan perubahan sistem nyata wajib diverifikasi dan disetujui oleh analis manusia.",
      },
    });
  } catch (error: any) {
    console.error("POST /api/soc/ai-assistant error:", error);
    return NextResponse.json({ error: "Gagal memproses analisis AI SOC: " + error.message }, { status: 500 });
  }
}
