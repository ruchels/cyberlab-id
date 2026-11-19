"use client";

import React, { useState } from "react";
import { Badge, Button, Input } from "@/components/ui";
import {
  Binary,
  ShieldCheck,
  Search,
  FileCheck,
  Clock,
  Sparkles,
  FileCode,
  FileSearch,
  CheckCircle2,
} from "lucide-react";

interface ForensicsRangeProps {
  sessionId: string;
  template: any;
  onComplete: (evidenceToken?: string) => Promise<void>;
  onStop: () => Promise<void>;
}

export function ForensicsRangeView({
  sessionId,
  template,
  onComplete,
  onStop,
}: ForensicsRangeProps) {
  const [activeTool, setActiveTool] = useState<"hash" | "hex" | "logs">("hash");

  // Hash verification state
  const [evidenceHashInput, setEvidenceHashInput] = useState(
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  );
  const [isHashVerified, setIsHashVerified] = useState(false);

  // Hex magic bytes state
  const [selectedArtifact, setSelectedArtifact] = useState("evidence_doc.pdf");
  const [detectedType, setDetectedType] = useState<string | null>(null);

  // Log analysis filter
  const [logSearch, setLogSearch] = useState("192.168.1.100");

  const completionToken = "RANGE{forensic_chain_of_custody_intact}";

  const sampleLogs = [
    "10.0.0.12 - - [19/Nov/2026:10:14:02 +0700] \"GET /index.html HTTP/1.1\" 200 4820",
    "192.168.1.100 - - [19/Nov/2026:10:15:10 +0700] \"GET /login.php HTTP/1.1\" 200 2140",
    "192.168.1.100 - - [19/Nov/2026:10:15:14 +0700] \"POST /login.php HTTP/1.1\" 401 104 [User: admin]",
    "192.168.1.100 - - [19/Nov/2026:10:15:22 +0700] \"POST /login.php HTTP/1.1\" 200 4120 [User: ' OR '1'='1 -- Auth Bypass]",
    "192.168.1.100 - - [19/Nov/2026:10:16:01 +0700] \"GET /admin/export.php?file=../../../../etc/passwd HTTP/1.1\" 200 1840",
    "10.0.0.25 - - [19/Nov/2026:10:16:45 +0700] \"GET /styles.css HTTP/1.1\" 304 0",
  ];

  const handleVerifyHash = (e: React.FormEvent) => {
    e.preventDefault();
    if (evidenceHashInput.length === 64) {
      setIsHashVerified(true);
    }
  };

  const handleInspectHex = () => {
    if (selectedArtifact === "evidence_doc.pdf") {
      setDetectedType("ANOMALI DITEMUKAN: Magic Bytes '4D 5A 90 00' terdeteksi (Windows Portable Executable / PE32 binary). Berkas telah disamarkan dengan ekstensi .pdf palsu!");
    } else {
      setDetectedType("Magic Bytes '89 50 4E 47' (PNG Image format valid).");
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Bar */}
      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Binary className="w-5 h-5 text-[var(--color-accent)]" />
          <span className="font-bold text-sm text-[var(--color-text)]">
            Digital Forensics &amp; Artifact Investigation Suite
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveTool("hash")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTool === "hash"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            1. Hash Integrity
          </button>
          <button
            onClick={() => setActiveTool("hex")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTool === "hex"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            2. Hex / Signature
          </button>
          <button
            onClick={() => setActiveTool("logs")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTool === "logs"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            3. Log Timeline
          </button>
        </div>
      </div>

      {/* Tool 1: Hash Integrity */}
      {activeTool === "hash" && (
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verifikasi Integritas SHA-256 (Chain of Custody)
            </h3>
            <p className="text-[var(--color-text-muted)]">
              Pastikan nilai hash berkas barang bukti disk image identik dengan catatan berita acara penyitaan awal.
            </p>
          </div>

          <form onSubmit={handleVerifyHash} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[var(--color-text-muted)] block text-[11px]">Nilai SHA-256 Hash Bukti:</label>
              <Input
                value={evidenceHashInput}
                onChange={(e) => setEvidenceHashInput(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="text-xs font-mono">
              Verifikasi Checksum
            </Button>
          </form>

          {isHashVerified && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Integritas Terverifikasi Sah!
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Barang bukti digital tidak mengalami manipulasi atau kerusakan byte.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tool 2: Hex Magic Bytes */}
      {activeTool === "hex" && (
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
          <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
            <Binary className="w-4 h-4 text-purple-400" />
            Hex Header Inspection &amp; Anti-Forensic Extension Spoofing
          </h3>

          <div className="flex items-center gap-3">
            <select
              value={selectedArtifact}
              onChange={(e) => {
                setSelectedArtifact(e.target.value);
                setDetectedType(null);
              }}
              className="rounded bg-[var(--color-background)] border border-[var(--color-border)] p-2 text-xs font-mono"
            >
              <option value="evidence_doc.pdf">evidence_doc.pdf (Tersangka: Dokumen Pajak)</option>
              <option value="company_logo.png">company_logo.png (Logo Perusahaan)</option>
            </select>
            <Button onClick={handleInspectHex} variant="primary" size="sm" className="text-xs font-mono">
              Inspeksi Magic Bytes
            </Button>
          </div>

          {detectedType && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 space-y-1">
              <div className="font-bold text-xs">Hasil Analisis Forensik:</div>
              <p className="text-[11px] leading-relaxed">{detectedType}</p>
            </div>
          )}
        </div>
      )}

      {/* Tool 3: Log Timeline */}
      {activeTool === "logs" && (
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-sky-400" />
              Web Server Access Log Timeline Reconstruction
            </h3>
            <Input
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Filter IP atau path..."
              className="max-w-xs font-mono text-xs"
            />
          </div>

          <div className="p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border-subtle)] space-y-1 max-h-56 overflow-y-auto text-[11px] font-mono">
            {sampleLogs
              .filter((l) => l.toLowerCase().includes(logSearch.toLowerCase()))
              .map((line, i) => (
                <div
                  key={i}
                  className={
                    line.includes("Auth Bypass") || line.includes("passwd")
                      ? "text-red-400 font-bold"
                      : "text-[var(--color-text-secondary)]"
                  }
                >
                  {line}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Completion Banner */}
      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between">
        <div className="text-xs text-[var(--color-text-muted)]">
          Token Penyelesaian Forensik: <code className="text-[var(--color-accent)]">{completionToken}</code>
        </div>
        <Button
          onClick={() => onComplete(completionToken)}
          variant="primary"
          size="sm"
          className="text-xs font-mono flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Selesaikan Lab &amp; Klaim +{template.xp_reward} XP
        </Button>
      </div>
    </div>
  );
}
