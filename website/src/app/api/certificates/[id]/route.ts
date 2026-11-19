import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const cert = db
      .prepare(`
        SELECT c.id, c.user_display_name, c.path_title, c.issue_date, c.status,
               c.revocation_reason, c.verification_hash, c.created_at,
               p.difficulty, p.estimated_hours, p.category
        FROM certificates c
        JOIN academy_paths p ON c.path_id = p.id
        WHERE c.id = ?
      `)
      .get(id) as any;

    if (!cert) {
      return NextResponse.json(
        {
          success: false,
          error: "Sertifikat dengan nomor identifikasi ini tidak ditemukan dalam catatan sistem CyberLab-ID.",
          valid: false,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: cert.status === "valid",
      certificate: cert,
      disclaimer: "Sertifikat ini merupakan bukti kelulusan kurikulum edukasi internal CyberLab-ID dan tidak dimaksudkan sebagai lisensi industri, akreditasi universitas, atau sertifikasi kedinasan resmi.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to verify certificate" }, { status: 500 });
  }
}
