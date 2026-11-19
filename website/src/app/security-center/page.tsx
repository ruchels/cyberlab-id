"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  FileText,
  Network,
  FileCode,
  Terminal,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Shield,
  Activity,
  Upload,
} from "lucide-react";
import { Badge, Card, CardHeader, CardContent } from "@/components/ui";

type TabMode = "log" | "network" | "file";

export default function SecurityCenterPage() {
  const [activeTab, setActiveTab] = useState<TabMode>("log");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pastReports, setPastReports] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  // Form states
  const [logInput, setLogInput] = useState("");
  const [networkInput, setNetworkInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ name: string; base64: string; size: number } | null>(null);

  useEffect(() => {
    fetchPastReports();
  }, []);

  const fetchPastReports = async () => {
    try {
      const res = await fetch("/api/ai/security-center");
      const json = await res.json();
      if (json.success && json.reports) {
        setPastReports(json.reports);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let body: any = { analysisType: activeTab };

      if (activeTab === "log") {
        if (!logInput.trim()) throw new Error("Silakan masukkan teks log untuk dianalisis.");
        body.logText = logInput.trim();
        body.targetName = "Server Authentication & Access Log";
      } else if (activeTab === "network") {
        if (!networkInput.trim()) throw new Error("Silakan masukkan data paket jaringan atau JSON trace.");
        body.packetData = networkInput.trim();
        body.targetName = "Capture Lalu Lintas Jaringan";
      } else if (activeTab === "file") {
        if (!selectedFile) throw new Error("Silakan pilih berkas untuk dianalisis.");
        body.filename = selectedFile.name;
        body.fileBase64 = selectedFile.base64;
      }

      const res = await fetch("/api/ai/security-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analisis keamanan gagal");

      setResult(data);
      fetchPastReports();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran berkas melebihi batas demonstrasi 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      setSelectedFile({
        name: file.name,
        base64,
        size: file.size,
      });
      setError(null);
    };
    reader.readAsArrayBuffer(file);
  };

  // Sample Log Loaders
  const loadSampleSshLog = () => {
    setLogInput(`May 19 03:12:01 server sshd[12401]: Failed password for invalid user admin from 198.51.100.44 port 41202 ssh2
May 19 03:12:03 server sshd[12405]: Failed password for invalid user root from 198.51.100.44 port 41204 ssh2
May 19 03:12:06 server sshd[12408]: Failed password for invalid user test from 198.51.100.44 port 41208 ssh2
May 19 03:12:09 server sshd[12411]: Failed password for invalid user oracle from 198.51.100.44 port 41212 ssh2
May 19 03:12:12 server sshd[12415]: Failed password for invalid user guest from 198.51.100.44 port 41216 ssh2
May 19 03:12:15 server sshd[12419]: Failed password for invalid user deploy from 198.51.100.44 port 41220 ssh2
May 19 03:12:18 server sshd[12423]: Failed password for invalid user support from 198.51.100.44 port 41224 ssh2`);
  };

  const loadSampleWebSqliLog = () => {
    setLogInput(`192.0.2.105 - - [19/May/2026:04:15:21 +0700] "GET /products.php?id=1%20UNION%20SELECT%201,username,password%20FROM%20users-- HTTP/1.1" 200 4521 "sqlmap/1.6"
192.0.2.105 - - [19/May/2026:04:15:23 +0700] "GET /download.php?file=../../../../etc/passwd HTTP/1.1" 404 153 "sqlmap/1.6"
192.0.2.105 - - [19/May/2026:04:15:25 +0700] "GET /login.php?user=admin' OR 1=1 -- HTTP/1.1" 302 214 "sqlmap/1.6"
192.0.2.105 - - [19/May/2026:04:15:28 +0700] "GET /api/v1/search?q=test' AND SLEEP(5)-- HTTP/1.1" 200 321 "sqlmap/1.6"`);
  };

  const loadSampleNetworkData = () => {
    setNetworkInput(`192.168.1.50 -> 10.0.0.5 TCP 80 [SYN] seq=1000
192.168.1.50 -> 10.0.0.5 TCP 81 [SYN] seq=1001
192.168.1.50 -> 10.0.0.5 TCP 82 [SYN] seq=1002
192.168.1.50 -> 10.0.0.5 TCP 83 [SYN] seq=1003
192.168.1.50 -> 10.0.0.5 TCP 84 [SYN] seq=1004
192.168.1.50 -> 10.0.0.5 TCP 85 [SYN] seq=1005
192.168.1.50 -> 10.0.0.5 TCP 86 [SYN] seq=1006
192.168.1.80 -> 10.0.0.5 HTTP 80 Authorization: Basic YWRtaW46UGFzc3dvcmQxMjM=
192.168.1.80 -> 10.0.0.5 FTP 21 USER anonymous PASS secret123`);
  };

  const loadSampleFileSpoof = () => {
    // Generate a tiny PE32 executable mock header (4D 5A ...) declared as a PDF
    const peBytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00]);
    let binary = "";
    for (let i = 0; i < peBytes.byteLength; i++) {
      binary += String.fromCharCode(peBytes[i]);
    }
    const base64 = btoa(binary);

    setSelectedFile({
      name: "laporan_keuangan_resmi.pdf",
      base64,
      size: peBytes.byteLength,
    });
  };

  const handleCopyReport = () => {
    if (!result) return;
    const reportText = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ana = result?.analysis;

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono">
              <ShieldAlert className="w-4 h-4" />
              <span>CyberLab-ID AI Defensive Security Analysis Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Pusat Analisis & <span className="text-[var(--color-accent)]">Investigasi Bukti Digital</span>
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Alat analisis berbantuan AI untuk mendeteksi serangan brute-force, pola eksploitasi web, anomali transmisi PCAP, dan penyamaran ekstensi berkas berbahaya secara aman (zero-execution safe sandbox).
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2 font-mono text-xs">
          {[
            { id: "log", label: "Log Analyzer (Syslog/Nginx/Auth)", icon: FileText },
            { id: "network", label: "Network Traffic Analyzer (PCAP)", icon: Network },
            { id: "file", label: "File Analysis Assistant (Magic Bytes)", icon: FileCode },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabMode);
                setResult(null);
                setError(null);
              }}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[var(--color-accent)] text-black"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="underline">
              Tutup
            </button>
          </div>
        )}

        {/* Tab 1: Log Analyzer Form */}
        {activeTab === "log" && (
          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] bg-[#0c101c] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Input Data Log Server</span>
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Tempelkan baris log autentikasi SSH (/var/log/auth.log) atau web server (/var/log/nginx/access.log)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadSampleSshLog}
                  className="px-3 py-1.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-mono hover:bg-white/5"
                >
                  Muat Contoh SSH Brute-Force
                </button>
                <button
                  onClick={loadSampleWebSqliLog}
                  className="px-3 py-1.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-mono hover:bg-white/5"
                >
                  Muat Contoh Web SQLi
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              placeholder="Tempelkan baris log di sini..."
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              className="w-full p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl font-mono text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />

            <button
              onClick={handleAnalyze}
              disabled={loading || !logInput.trim()}
              className="px-6 py-3 rounded-xl bg-[var(--color-accent)] text-black font-mono font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "Menganalisis Log..." : "Mulai Analisis Keamanan Log"}</span>
            </button>
          </div>
        )}

        {/* Tab 2: Network Traffic Form */}
        {activeTab === "network" && (
          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] bg-[#0c101c] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-blue-400" />
                  <span>Input Metadata Paket Jaringan / PCAP Trace</span>
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Tempelkan ringkasan aliran paket (flow metadata) atau rekaman Wireshark
                </p>
              </div>
              <button
                onClick={loadSampleNetworkData}
                className="px-3 py-1.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-mono hover:bg-white/5"
              >
                Muat Contoh SYN Scan & Plaintext Auth
              </button>
            </div>

            <textarea
              rows={8}
              placeholder="192.168.1.50 -> 10.0.0.5 TCP 80 [SYN]..."
              value={networkInput}
              onChange={(e) => setNetworkInput(e.target.value)}
              className="w-full p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl font-mono text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />

            <button
              onClick={handleAnalyze}
              disabled={loading || !networkInput.trim()}
              className="px-6 py-3 rounded-xl bg-[var(--color-accent)] text-black font-mono font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "Menganalisis Lalu Lintas..." : "Analisis Lalu Lintas Jaringan"}</span>
            </button>
          </div>
        )}

        {/* Tab 3: File Analysis Assistant */}
        {activeTab === "file" && (
          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] bg-[#0c101c] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span>Inspeksi Statis Header Berkas (Zero-Execution Safe)</span>
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Kalkulasi checksum kriptografis, verifikasi Magic Bytes, dan deteksi penyamaran ekstensi
                </p>
              </div>
              <button
                onClick={loadSampleFileSpoof}
                className="px-3 py-1.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-mono hover:bg-white/5"
              >
                Muat Berkas Contoh (Spoofed PE.pdf)
              </button>
            </div>

            <div className="p-6 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-center space-y-3">
              <Upload className="w-8 h-8 text-[var(--color-text-muted)] mx-auto" />
              <div className="space-y-1">
                <span className="font-mono text-xs text-white font-bold block">
                  Unggah Berkas untuk Inspeksi Header Statis
                </span>
                <span className="font-mono text-[11px] text-[var(--color-text-muted)] block">
                  Maksimal 5 MB · Berkas tidak pernah dieksekusi di server
                </span>
              </div>
              <input
                type="file"
                onChange={handleFileUpload}
                className="font-mono text-xs text-[var(--color-text-muted)] mx-auto block"
              />
            </div>

            {selectedFile && (
              <div className="p-4 rounded-xl bg-black/40 border border-[var(--color-border)] font-mono text-xs flex items-center justify-between">
                <div>
                  <span className="text-[var(--color-text-muted)]">Berkas Terpilih: </span>
                  <span className="text-white font-bold">{selectedFile.name}</span>
                  <span className="text-[var(--color-text-muted)] ml-2">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[var(--color-accent)] text-black font-bold hover:opacity-90 cursor-pointer"
                >
                  {loading ? "Menginspeksi..." : "Analisis Berkas"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Card */}
        {result && ana && (
          <div className="p-6 sm:p-8 rounded-2xl border-2 border-[var(--color-accent)]/50 bg-[#0d1222] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      ana.confidence === "high"
                        ? "accent"
                        : ana.confidence === "medium"
                        ? "warning"
                        : "default"
                    }
                    size="sm"
                  >
                    CONFIDENCE: {ana.confidence.toUpperCase()}
                  </Badge>
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">
                    Report ID: {result.reportId}
                  </span>
                </div>
                <h3 className="font-mono text-lg font-bold text-white">
                  Laporan Hasil Investigasi Defensif ({result.targetName})
                </h3>
              </div>

              <button
                onClick={handleCopyReport}
                className="px-4 py-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] font-mono text-xs flex items-center gap-2 hover:bg-white/5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Laporan Tersalin" : "Salin Laporan JSON"}</span>
              </button>
            </div>

            {/* SHA-256 Checksum Card */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-[var(--color-border)] font-mono text-xs flex items-center justify-between">
              <span className="text-[var(--color-text-muted)]">SHA-256 Evidence Hash:</span>
              <span className="text-[var(--color-accent)] font-bold text-[11px] break-all">
                {result.sha256}
              </span>
            </div>

            {/* Executive Summary */}
            <div className="space-y-2">
              <h4 className="font-mono text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
                Ringkasan Eksekutif (AI Summary)
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[var(--color-text)] leading-relaxed bg-[#0c101c] p-4 rounded-xl border border-[var(--color-border)]">
                {ana.summary}
              </p>
            </div>

            {/* Findings List */}
            {ana.findings && ana.findings.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-wider text-rose-400 font-bold">
                  Indikator Anomali & Kerentanan Terdeteksi ({ana.findings.length})
                </h4>
                <div className="space-y-3">
                  {ana.findings.map((f: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">
                          {f.type || f.anomalyType || `Temuan #${idx + 1}`}
                        </span>
                        <Badge variant="destructive" size="sm">
                          {f.severity ? f.severity.toUpperCase() : "ALERT"}
                        </Badge>
                      </div>
                      <p className="text-[var(--color-text-secondary)]">{f.description || f.details}</p>
                      {f.sampleLine && (
                        <div className="p-2.5 rounded bg-black/60 border border-[var(--color-border)] text-[10px] text-amber-300 overflow-x-auto">
                          Sample Evidence: {f.sampleLine}
                        </div>
                      )}
                      {f.mitigation && (
                        <div className="text-[11px] text-emerald-400 pt-1">
                          <strong>Rekomendasi Remediasi: </strong> {f.mitigation}
                        </div>
                      )}
                      {f.snortRuleRecommendation && (
                        <div className="p-2 rounded bg-black/60 text-[10px] text-sky-300 overflow-x-auto">
                          <code>{f.snortRuleRecommendation}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Recommendations */}
            {ana.recommendedActions && ana.recommendedActions.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-bold">
                  Checklist Tindakan Defensif yang Direkomendasikan
                </h4>
                <ul className="space-y-2 font-mono text-xs">
                  {ana.recommendedActions.map((act: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-[#0c101c] border border-[var(--color-border)]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[var(--color-text)]">{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Limitations Notice */}
            <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-black/30 font-mono text-[11px] text-[var(--color-text-muted)] space-y-1">
              <span className="font-bold text-white block">Batasan Analisis & Penafian Legal:</span>
              <p>{ana.limitations}</p>
            </div>
          </div>
        )}

        {/* Past Reports Table */}
        {pastReports.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Riwayat Analisis Defensif Anda ({pastReports.length})</span>
            </h3>

            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[#0d121f]">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                  <tr>
                    <th className="py-2.5 px-4">Tipe</th>
                    <th className="py-2.5 px-4">Target Berkas / Entitas</th>
                    <th className="py-2.5 px-4">Confidence</th>
                    <th className="py-2.5 px-4">Tanggal Analisis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {pastReports.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.01]">
                      <td className="py-2.5 px-4 uppercase text-[10px] text-[var(--color-accent)] font-bold">
                        {r.analysis_type}
                      </td>
                      <td className="py-2.5 px-4 text-white font-semibold">{r.target_name}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant="accent" size="sm">
                          {r.confidence}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-[var(--color-text-muted)]">
                        {new Date(r.created_at).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
