"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import {
  Compass,
  Search,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Layers,
  ArrowRight,
  Database,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface KnowledgeItem {
  id: string;
  sourceType: string;
  referenceId: string;
  title: string;
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
  dataPayload: Record<string, any>;
  sourceAttribution: string;
  cachedAt: string;
  isLive?: boolean;
}

interface CveResult {
  cveId: string;
  title: string;
  description: string;
  cvssScore: number;
  severity: string;
  publishedDate: string;
  affectedComponents: string[];
  defensiveMitigation: string;
  sourceUrl: string;
  isFromLiveNvd: boolean;
}

export default function KnowledgeExplorerPage() {
  const [activeTab, setActiveTab] = useState<"mitre" | "nist" | "owasp" | "cve">("mitre");
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);

  // CVE Search State
  const [cveSearchInput, setCveSearchInput] = useState("");
  const [cveResults, setCveResults] = useState<CveResult[]>([]);
  const [searchingCve, setSearchingCve] = useState(false);
  const [searchSearched, setSearchSearched] = useState(false);

  useEffect(() => {
    if (activeTab !== "cve") {
      fetchKnowledge(activeTab === "mitre" ? "mitre_attack" : activeTab === "nist" ? "nist_csf" : "owasp_top10");
    }
  }, [activeTab]);

  const fetchKnowledge = async (sourceType: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/integrations/knowledge?source=${sourceType}`);
      if (res.ok) {
        const json = await res.json();
        setKnowledgeItems(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCveSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cveSearchInput.trim()) return;

    try {
      setSearchingCve(true);
      setSearchSearched(true);
      const res = await fetch(`/api/integrations/knowledge?query=${encodeURIComponent(cveSearchInput.trim())}`);
      if (res.ok) {
        const json = await res.json();
        setCveResults(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingCve(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    const s = sev.toLowerCase();
    if (s === "critical") return <Badge variant="destructive" size="sm">CRITICAL</Badge>;
    if (s === "high") return <Badge variant="destructive" size="sm">HIGH</Badge>;
    if (s === "medium") return <Badge variant="secondary" size="sm">MEDIUM</Badge>;
    return <Badge variant="outline" size="sm">LOW</Badge>;
  };

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#101623] to-[#090d16] border border-[var(--color-border)] p-8 sm:p-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-3.5 h-3.5" />
            Integrasi Basis Pengetahuan & Intelijen Ancaman Terpercaya
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--color-text)]">
            Cybersecurity <span className="text-[var(--color-accent)]">Knowledge Explorer</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            Eksplorasi taktik ancaman siber standar industri yang dipetakan langsung dengan modul praktikum CyberLab-ID: MITRE ATT&CK Framework, NIST Cybersecurity Framework (CSF v2.0), OWASP Top 10, dan basis data kerentanan publik CVE.
          </p>

          <div className="pt-2 flex items-center gap-3 text-xs font-mono text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% Defensive Educational Focus
            </span>
            <span>·</span>
            <span>Zero-Exploit Execution Guarantee</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("mitre")}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "mitre"
              ? "bg-[var(--color-surface)] border-t-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          MITRE ATT&CK Matrix
        </button>
        <button
          onClick={() => setActiveTab("nist")}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "nist"
              ? "bg-[var(--color-surface)] border-t-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] hover:text-white"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          NIST CSF v2.0
        </button>
        <button
          onClick={() => setActiveTab("owasp")}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "owasp"
              ? "bg-[var(--color-surface)] border-t-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          OWASP Top 10:2021
        </button>
        <button
          onClick={() => setActiveTab("cve")}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "cve"
              ? "bg-[var(--color-surface)] border-t-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] hover:text-white"
          }`}
        >
          <Database className="w-4 h-4" />
          Pencarian CVE Publik
        </button>
      </div>

      {/* Tab 1: MITRE ATT&CK, Tab 2: NIST CSF, Tab 3: OWASP */}
      {activeTab !== "cve" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-mono">
            <span>
              Menampilkan entri kurasi resmi ({knowledgeItems.length} teknik/kategori terdaftar)
            </span>
            <span className="text-cyan-400">Terhubung ke kurikulum CyberLab-ID</span>
          </div>

          {loading ? (
            <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
              Memuat data framework keamanan eksternal...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {knowledgeItems.map((item) => (
                <Card
                  key={item.id}
                  className="bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors flex flex-col justify-between p-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
                        {item.referenceId}
                      </span>
                      {getSeverityBadge(item.severity)}
                    </div>

                    <h3 className="text-sm font-bold text-[var(--color-text)] leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {item.summary}
                    </p>

                    {item.dataPayload?.tactic && (
                      <div className="text-[11px] font-mono text-[var(--color-text-muted)]">
                        <span className="text-cyan-400 font-bold">Tactic:</span> {item.dataPayload.tactic}
                      </div>
                    )}
                    {item.dataPayload?.function && (
                      <div className="text-[11px] font-mono text-[var(--color-text-muted)]">
                        <span className="text-cyan-400 font-bold">Function:</span> {item.dataPayload.function}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-[var(--color-border-subtle)] space-y-2">
                    {item.dataPayload?.cyberlabModule && (
                      <Link
                        href={item.dataPayload.cyberlabModule}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-accent)] hover:underline font-bold"
                      >
                        Buka Praktikum Terkait <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                      Sumber: {item.sourceAttribution}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Public CVE Search */}
      {activeTab === "cve" && (
        <div className="space-y-6">
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)] p-6">
            <form onSubmit={handleCveSearch} className="space-y-3">
              <label className="block text-xs font-mono text-[var(--color-text-secondary)]">
                Cari Identifikasi CVE Publik (Format: CVE-YYYY-XXXX atau kata kunci seperti Log4Shell, HTTP/2)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--color-text-muted)]" />
                  <Input
                    value={cveSearchInput}
                    onChange={(e) => setCveSearchInput(e.target.value)}
                    placeholder="Contoh: CVE-2023-44487 atau CVE-2021-44228"
                    className="pl-9 text-xs"
                  />
                </div>
                <Button type="submit" variant="primary" disabled={searchingCve}>
                  {searchingCve ? "Mencari NVD..." : "Cari Kerentanan"}
                </Button>
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Data diambil langsung dari National Vulnerability Database (NIST NVD) dan basis data terverifikasi CyberLab-ID untuk analisis defensif.
              </div>
            </form>
          </Card>

          {searchingCve ? (
            <div className="py-12 text-center text-xs font-mono text-[var(--color-text-muted)]">
              Melakukan query ke NIST NVD API dan cache lokal...
            </div>
          ) : searchSearched && cveResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
              Tidak ditemukan catatan CVE untuk pencarian tersebut. Pastikan format penulisan benar (misal: CVE-2024-3094).
            </div>
          ) : (
            <div className="space-y-4">
              {cveResults.map((cve) => (
                <Card key={cve.cveId} className="bg-[var(--color-surface)] border-[var(--color-border)] p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-rose-400">{cve.cveId}</span>
                        {getSeverityBadge(cve.severity)}
                        <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                          CVSS: {cve.cvssScore} · Dirilis: {cve.publishedDate}
                        </span>
                        {cve.isFromLiveNvd && (
                          <Badge variant="secondary" size="sm" className="text-[10px]">
                            Live NVD
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[var(--color-text)]">{cve.title}</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                        {cve.description}
                      </p>

                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs space-y-1">
                        <div className="font-bold text-emerald-400 font-mono text-[11px]">
                          ✓ Langkah Mitigasi Defensif:
                        </div>
                        <div className="text-emerald-300 text-[11px] leading-relaxed">
                          {cve.defensiveMitigation}
                        </div>
                      </div>
                    </div>

                    <a
                      href={cve.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:underline shrink-0"
                    >
                      Detail NVD <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

