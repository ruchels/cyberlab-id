/**
 * CyberLab-ID External Knowledge Integration Framework
 * Trusted External Security Knowledge Connectors:
 * - MITRE ATT&CK Framework
 * - NIST Cybersecurity Framework (CSF v2.0)
 * - OWASP Top 10 Security Risks
 * - Public CVE Vulnerability Database (NIST NVD / MITRE)
 *
 * All external data is retrieved with source attribution, freshness timestamps,
 * caching, and graceful fallback. Strictly for educational & defensive context.
 */

import { getDb } from "../db.ts";

export interface KnowledgeItem {
  id: string;
  sourceType: "mitre_attack" | "nist_csf" | "owasp_top10" | "cve_nvd";
  referenceId: string;
  title: string;
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
  dataPayload: Record<string, any>;
  sourceAttribution: string;
  cachedAt: string;
  isLive: boolean;
}

export interface CveSearchResult {
  cveId: string;
  title: string;
  description: string;
  cvssScore: number;
  severity: "low" | "medium" | "high" | "critical";
  publishedDate: string;
  affectedComponents: string[];
  defensiveMitigation: string;
  sourceUrl: string;
  isFromLiveNvd: boolean;
}

/**
 * Fetch cached external knowledge records by source type.
 */
export function getKnowledgeBySource(
  sourceType?: "mitre_attack" | "nist_csf" | "owasp_top10" | "cve_nvd"
): KnowledgeItem[] {
  const db = getDb();
  let query = "SELECT * FROM external_knowledge_cache";
  const params: any[] = [];

  if (sourceType) {
    query += " WHERE source_type = ?";
    params.push(sourceType);
  }
  query += " ORDER BY reference_id ASC";

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map((r) => {
    let payload = {};
    try {
      payload = JSON.parse(r.data_payload);
    } catch {
      payload = {};
    }

    return {
      id: r.id,
      sourceType: r.source_type,
      referenceId: r.reference_id,
      title: r.title,
      summary: r.summary,
      severity: r.severity,
      dataPayload: payload,
      sourceAttribution: r.source_attribution,
      cachedAt: r.cached_at,
      isLive: false,
    };
  });
}

/**
 * Searches CVE records. First checks local high-authority cache,
 * and if not found, attempts live query against NIST NVD public API (with 3s timeout)
 * and caches results. Falls back gracefully on network or rate limit errors.
 */
export async function searchCveKnowledge(query: string): Promise<CveSearchResult[]> {
  const db = getDb();
  const trimmed = query.trim().toUpperCase();

  // 1. Search local cached CVE entries
  const localRows = db
    .prepare(
      `SELECT * FROM external_knowledge_cache 
       WHERE source_type = 'cve_nvd' 
       AND (reference_id LIKE ? OR title LIKE ? OR summary LIKE ?)`
    )
    .all(`%${trimmed}%`, `%${trimmed}%`, `%${trimmed}%`) as any[];

  const results: CveSearchResult[] = localRows.map((r) => {
    let payload: any = {};
    try {
      payload = JSON.parse(r.data_payload);
    } catch {}

    return {
      cveId: r.reference_id,
      title: r.title,
      description: r.summary,
      cvssScore: payload.cvssScore || 7.0,
      severity: r.severity || "high",
      publishedDate: payload.publishedDate || r.cached_at.split("T")[0],
      affectedComponents: payload.affectedComponents || ["General Infrastructure"],
      defensiveMitigation: payload.mitigation || "Terapkan update keamanan resmi dari vendor terkait.",
      sourceUrl: `https://nvd.nist.gov/vuln/detail/${r.reference_id}`,
      isFromLiveNvd: false,
    };
  });

  // If local match found, return immediately
  if (results.length > 0) {
    return results;
  }

  // 2. If user searched a specific CVE format like CVE-YYYY-NNNN, attempt live NIST NVD API lookup
  const isCveFormat = /^CVE-\d{4}-\d{4,7}$/i.test(trimmed);
  if (isCveFormat) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${trimmed}`;
      const res = await fetch(nvdUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "CyberLab-ID-Educational-Agent/2.8" },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const vulnerabilities = json?.vulnerabilities || [];
        if (vulnerabilities.length > 0) {
          const cveObj = vulnerabilities[0].cve;
          const desc =
            cveObj.descriptions?.find((d: any) => d.lang === "en")?.value ||
            "Deskripsi kerentanan tidak tersedia.";
          const cvssData =
            cveObj.metrics?.cvssMetricV31?.[0]?.cvssData ||
            cveObj.metrics?.cvssMetricV30?.[0]?.cvssData ||
            cveObj.metrics?.cvssMetricV2?.[0]?.cvssData;
          const cvssScore = cvssData?.baseScore || 6.5;
          const severity =
            cvssScore >= 9.0 ? "critical" : cvssScore >= 7.0 ? "high" : cvssScore >= 4.0 ? "medium" : "low";

          const liveResult: CveSearchResult = {
            cveId: cveObj.id,
            title: `Kerentanan Terpublikasi: ${cveObj.id}`,
            description: desc.slice(0, 300) + (desc.length > 300 ? "..." : ""),
            cvssScore,
            severity,
            publishedDate: (cveObj.published || "").split("T")[0] || new Date().toISOString().split("T")[0],
            affectedComponents: ["Perangkat Lunak Terkait (NVD Registry)"],
            defensiveMitigation:
              "Periksa advisory vendor resmi dan terapkan patch keamanan terkini untuk memitigasi eksploitasi.",
            sourceUrl: `https://nvd.nist.gov/vuln/detail/${cveObj.id}`,
            isFromLiveNvd: true,
          };

          // Cache locally for future educational fast lookup
          const now = new Date().toISOString();
          const expires = new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString();
          db.prepare(`
            INSERT OR REPLACE INTO external_knowledge_cache (
              id, source_type, reference_id, title, summary, severity,
              data_payload, source_attribution, cached_at, expires_at
            ) VALUES (?, 'cve_nvd', ?, ?, ?, ?, ?, 'NIST NVD Live API', ?, ?)
          `).run(
            `cve_${cveObj.id.toLowerCase()}`,
            cveObj.id,
            liveResult.title,
            liveResult.description,
            severity,
            JSON.stringify({
              cvssScore,
              publishedDate: liveResult.publishedDate,
              mitigation: liveResult.defensiveMitigation,
            }),
            now,
            expires
          );

          return [liveResult];
        }
      }
    } catch {
      // Graceful fallback on network timeout or offline environments
    }
  }

  return results;
}
