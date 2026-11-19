import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeBySource, searchCveKnowledge } from "@/lib/server/integrations/knowledge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get("source") as any;
    const query = searchParams.get("query") || searchParams.get("search");

    if (query) {
      const cveResults = await searchCveKnowledge(query);
      return NextResponse.json({
        success: true,
        type: "cve_search",
        query,
        count: cveResults.length,
        data: cveResults,
      });
    }

    const items = getKnowledgeBySource(source || undefined);

    return NextResponse.json({
      success: true,
      type: "knowledge_items",
      source: source || "all",
      count: items.length,
      data: items,
    });
  } catch (err: any) {
    console.error("Knowledge integration API error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data integrasi pengetahuan eksternal." },
      { status: 500 }
    );
  }
}
