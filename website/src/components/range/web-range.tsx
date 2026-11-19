"use client";

import React, { useState } from "react";
import { Badge, Button, Input } from "@/components/ui";
import {
  Globe,
  Shield,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Lock,
  Code2,
  FileCode,
  FileText,
} from "lucide-react";

interface WebRangeProps {
  sessionId: string;
  template: any;
  onComplete: (evidenceToken?: string) => Promise<void>;
  onStop: () => Promise<void>;
}

export function WebRangeView({
  sessionId,
  template,
  onComplete,
  onStop,
}: WebRangeProps) {
  const [activeTab, setActiveTab] = useState<"sqli" | "xss" | "traversal">("sqli");

  // SQLi state
  const [sqliInput, setSqliInput] = useState("' OR '1'='1");
  const [sqliPass, setSqliPass] = useState("any_password");
  const [sqliMode, setSqliMode] = useState<"vulnerable" | "remediated">("vulnerable");
  const [sqliResult, setSqliResult] = useState<any>(null);

  // XSS state
  const [xssInput, setXssInput] = useState("<script>alert('XSS_AUDIT_SUCCESS')</script>");
  const [xssResult, setXssResult] = useState<string | null>(null);

  // Path Traversal state
  const [filePath, setFilePath] = useState("../../../../etc/passwd");
  const [traversalResult, setTraversalResult] = useState<string | null>(null);

  const [hasSolvedSqli, setHasSolvedSqli] = useState(false);
  const completionToken = "RANGE{appsec_owasp_remediation_mastered}";

  const handleTestSqli = (e: React.FormEvent) => {
    e.preventDefault();
    if (sqliMode === "vulnerable") {
      if (sqliInput.includes("' OR '1'='1") || sqliInput.includes("' or 1=1")) {
        setSqliResult({
          success: true,
          user: "admin",
          role: "SUPERADMIN",
          balance: "Rp 1.450.000.000",
          token: completionToken,
          query: `SELECT * FROM bank_users WHERE username = '${sqliInput}' AND password = '${sqliPass}'`,
        });
        setHasSolvedSqli(true);
      } else {
        setSqliResult({
          success: false,
          error: "Invalid username or password.",
          query: `SELECT * FROM bank_users WHERE username = '${sqliInput}' AND password = '${sqliPass}'`,
        });
      }
    } else {
      // Remediated mode
      setSqliResult({
        success: false,
        error: "Parameterized query safely rejected the input literal. No SQL syntax altered.",
        query: `SELECT * FROM bank_users WHERE username = $1 AND password = $2 [Params: "${sqliInput}", "${sqliPass}"]`,
      });
    }
  };

  const handleTestXss = (e: React.FormEvent) => {
    e.preventDefault();
    if (xssInput.includes("<script>") || xssInput.includes("onerror=")) {
      setXssResult(`Payload dieksekusi pada DOM! Simulasi refleksi skrip tidak tersanitasi.`);
    } else {
      setXssResult(`Komentar teks biasa tersimpan dengan aman: ${xssInput}`);
    }
  };

  const handleTestTraversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (filePath.includes("../")) {
      setTraversalResult(
        `root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nstudent:x:1000:1000:Student User:/home/student:/bin/bash\ncyberlab:x:1001:1001:CyberLab Service:/var/cyberlab:/bin/sh`
      );
    } else {
      setTraversalResult(`[INFO] Berkas resmi dibuka: /var/www/uploads/${filePath}`);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Bar Tabs */}
      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[var(--color-accent)]" />
          <span className="font-bold text-sm text-[var(--color-text)]">
            OWASP Top 10 Web Vulnerability Range
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab("sqli")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "sqli"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            1. SQL Injection (A03)
          </button>
          <button
            onClick={() => setActiveTab("xss")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "xss"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            2. XSS Script Reflection (A03)
          </button>
          <button
            onClick={() => setActiveTab("traversal")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "traversal"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            3. Path Traversal (A01)
          </button>
        </div>
      </div>

      {/* Tab 1: SQL Injection */}
      {activeTab === "sqli" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Target Login: CyberBank Portal
              </h3>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSqliMode("vulnerable")}
                  className={`px-2.5 py-1 rounded ${
                    sqliMode === "vulnerable"
                      ? "bg-red-500/20 text-red-400 border border-red-500/40 font-bold"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  Mode Rentan
                </button>
                <button
                  type="button"
                  onClick={() => setSqliMode("remediated")}
                  className={`px-2.5 py-1 rounded ${
                    sqliMode === "remediated"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  Mode Aman (Prepared)
                </button>
              </div>
            </div>

            <form onSubmit={handleTestSqli} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] block text-[11px]">Username / Account Number:</label>
                <Input
                  value={sqliInput}
                  onChange={(e) => setSqliInput(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] block text-[11px]">Password:</label>
                <Input
                  type="password"
                  value={sqliPass}
                  onChange={(e) => setSqliPass(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <Button type="submit" variant="primary" size="sm" className="w-full text-xs font-mono">
                Submit Autentikasi
              </Button>
            </form>

            <div className="p-3 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] space-y-1">
              <span className="font-bold text-[var(--color-accent)]">Instruksi Eksploitasi:</span>
              <p>
                Gunakan teknik string concatenation bypass: <code>&apos; OR &apos;1&apos;=&apos;1</code> pada input username untuk membuat kondisi klausa WHERE selalu benar.
              </p>
            </div>
          </div>

          {/* Results & Query Visualization */}
          <div className="p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2 text-[11px] text-[var(--color-text-muted)]">
                <span>SQL QUERY ENGINE INSPECTOR</span>
                <span className="text-[var(--color-accent)]">Database: SQLite / PostgreSQL</span>
              </div>

              {sqliResult ? (
                <div className="space-y-3">
                  <div className="p-3 rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[11px] font-mono break-all text-amber-300">
                    <code>{sqliResult.query}</code>
                  </div>

                  {sqliResult.success ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 space-y-2">
                      <div className="font-bold flex items-center gap-1.5 text-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        Autentikasi Berhasil! Berhasil Login sebagai {sqliResult.user} ({sqliResult.role})
                      </div>
                      <div className="text-[11px] text-[var(--color-text-secondary)]">
                        Saldo Akun: {sqliResult.balance}
                      </div>
                      <div className="p-2 rounded bg-black/40 text-[11px] font-bold text-purple-300">
                        Token Verifikasi: {sqliResult.token}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                      {sqliResult.error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--color-text-muted)] text-xs">
                  Kirimkan kredensial untuk meninjau eksekusi query dinamis SQL.
                </div>
              )}
            </div>

            {hasSolvedSqli && (
              <div className="pt-3 border-t border-[var(--color-border-subtle)]">
                <Button
                  onClick={() => onComplete(completionToken)}
                  variant="primary"
                  size="sm"
                  className="w-full text-xs font-mono flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Selesaikan Lab &amp; Klaim +{template.xp_reward} XP
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: XSS */}
      {activeTab === "xss" && (
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
          <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
            <Code2 className="w-4 h-4 text-purple-400" />
            Reflected / Stored Cross-Site Scripting (XSS) Sandbox
          </h3>
          <form onSubmit={handleTestXss} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[var(--color-text-muted)] block text-[11px]">Guestbook Comment Input:</label>
              <Input
                value={xssInput}
                onChange={(e) => setXssInput(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="text-xs font-mono">
              Kirim Komentar
            </Button>
          </form>

          {xssResult && (
            <div className="p-3.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border-subtle)] text-xs font-mono text-[var(--color-accent)]">
              {xssResult}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Path Traversal */}
      {activeTab === "traversal" && (
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
          <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            Path Traversal &amp; Arbitrary File Read Sandbox
          </h3>
          <form onSubmit={handleTestTraversal} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[var(--color-text-muted)] block text-[11px]">Parameter Berkas (?file=):</label>
              <Input
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="text-xs font-mono">
              Muat Berkas Server
            </Button>
          </form>

          {traversalResult && (
            <div className="p-3.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border-subtle)] text-xs font-mono whitespace-pre-wrap text-emerald-400">
              {traversalResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
