"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import { Globe, ShieldCheck, ShieldAlert, CheckCircle2, Lock, Sparkles, Terminal } from "lucide-react";
import { useProgress } from "@/lib/progress";

export function WebVulnLab() {
  const { completeLab } = useProgress();

  // Tab State
  const [activeTab, setActiveTab] = useState<"sqli" | "xss">("sqli");

  // SQLi State
  const [sqliInput, setSqliInput] = useState("admin' OR '1'='1' --");
  const [usePreparedStatement, setUsePreparedStatement] = useState(false);
  const [sqliTested, setSqliTested] = useState(false);

  // XSS State
  const [xssInput, setXssInput] = useState("<script>alert('Session Hijacked: ' + document.cookie)</script>");
  const [useEncoding, setUseEncoding] = useState(false);
  const [xssTested, setXssTested] = useState(false);

  // Mock Database users
  const mockUsers = [
    { id: 1, username: "admin", email: "admin@corp.internal", role: "SuperAdmin" },
    { id: 2, username: "alice", email: "alice@corp.internal", role: "Developer" },
    { id: 3, username: "bob", email: "bob@corp.internal", role: "Auditor" },
  ];

  // Dynamic Query Construction
  const rawQuery = `SELECT * FROM users WHERE username = '${sqliInput}' AND password_hash = '...';`;
  const preparedQueryBlueprint = `SELECT * FROM users WHERE username = ? AND password_hash = ?;`;

  // SQLi evaluation
  const isSqliBypass =
    !usePreparedStatement &&
    (sqliInput.includes("' OR '1'='1") ||
      sqliInput.includes("' OR 1=1") ||
      sqliInput.includes("' or '1'='1") ||
      sqliInput.includes("' or 1=1"));

  const isCompleted = sqliTested && xssTested;

  const handleTestSqli = () => {
    setSqliTested(true);
    if (xssTested) {
      completeLab("web-vuln-lab", "Basic Web Vulnerability Identification", "web-defender");
    }
  };

  const handleTestXss = () => {
    setXssTested(true);
    if (sqliTested) {
      completeLab("web-vuln-lab", "Basic Web Vulnerability Identification", "web-defender");
    }
  };

  return (
    <Card id="web-vuln-lab" className="border-[var(--color-border)] overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--color-accent)] font-bold">LAB 03</span>
            <Badge variant="default" size="sm">Menengah (Intermediate)</Badge>
          </div>
          <h2 className="text-lg font-mono font-bold text-[var(--color-text)] mt-1 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[var(--color-accent)]" />
            Web Application Vulnerability &amp; Mitigation Sandbox
          </h2>
        </div>
        <Badge variant={isCompleted ? "success" : "warning"} size="md">
          {isCompleted ? "Praktikum Tuntas" : "Eksperimen Interaktif"}
        </Badge>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Navigation Tabs between SQLi and XSS */}
        <div className="flex gap-2 border-b border-[var(--color-border)] pb-3">
          <button
            onClick={() => setActiveTab("sqli")}
            className={`px-4 py-2 rounded-md font-mono text-xs font-medium cursor-pointer transition-colors ${
              activeTab === "sqli"
                ? "bg-[var(--color-accent)] text-[#05080e] font-bold"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
            }`}
          >
            1. SQL Injection Sandbox
          </button>
          <button
            onClick={() => setActiveTab("xss")}
            className={`px-4 py-2 rounded-md font-mono text-xs font-medium cursor-pointer transition-colors ${
              activeTab === "xss"
                ? "bg-[var(--color-accent)] text-[#05080e] font-bold"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
            }`}
          >
            2. Cross-Site Scripting (XSS) Sandbox
          </button>
        </div>

        {/* ================= SECTION 1: SQL INJECTION ================= */}
        {activeTab === "sqli" && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-xs font-mono space-y-2">
              <span className="font-bold text-[var(--color-accent)] flex items-center gap-1.5 uppercase">
                <Sparkles className="w-4 h-4" /> Skenario SQL Injection (Bypass Login)
              </span>
              <p className="text-slate-300 leading-relaxed">
                Ketikkan karakter kutip satu <code>&apos;</code> dan logika boolean <code>OR 1=1 --</code> untuk memanipulasi string SQL. Amati bagaimana query string di bawah berubah secara real-time, lalu aktifkan mode <strong>Prepared Statements</strong> untuk melihat mitigasi amannya.
              </p>
            </div>

            {/* Input & Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <Input
                  label="Input Username Form Login"
                  value={sqliInput}
                  onChange={(e) => setSqliInput(e.target.value)}
                  placeholder="Ketik username..."
                />
              </div>
              <div>
                <label className="flex items-center gap-2 p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-mono cursor-pointer hover:border-[var(--color-accent)] transition-colors">
                  <input
                    type="checkbox"
                    checked={usePreparedStatement}
                    onChange={(e) => setUsePreparedStatement(e.target.checked)}
                    className="accent-[var(--color-accent)]"
                  />
                  <span className="text-[var(--color-text)] font-semibold">
                    Mode Prepared Statements
                  </span>
                </label>
              </div>
            </div>

            {/* Query Visualizer */}
            <div className="space-y-2 font-mono text-xs">
              <div className="text-[var(--color-text-secondary)] uppercase">
                {usePreparedStatement
                  ? "✓ Query yang Dijalankan Server (Aman - Parameterized):"
                  : "⚠️ Query yang Dijalankan Server (Rentan - String Concatenation):"}
              </div>
              <div
                className={`p-3.5 rounded-lg border leading-relaxed break-all ${
                  usePreparedStatement
                    ? "bg-emerald-950/20 border-emerald-800 text-emerald-300"
                    : isSqliBypass
                    ? "bg-rose-950/30 border-rose-800 text-rose-300 font-bold"
                    : "bg-[#070b12] border-[var(--color-border-subtle)] text-slate-300"
                }`}
              >
                {usePreparedStatement ? (
                  <div>
                    <div>{preparedQueryBlueprint}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)] mt-1">
                      Parameter Values: [username: &quot;{sqliInput}&quot;, password_hash: &quot;...&quot;]
                    </div>
                  </div>
                ) : (
                  rawQuery
                )}
              </div>
            </div>

            {/* Execution Database Result */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-secondary)] uppercase">
                  Hasil Respon Basis Data:
                </span>
                <Button size="sm" onClick={handleTestSqli}>
                  Eksekusi Query
                </Button>
              </div>

              {isSqliBypass ? (
                <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>AUTHENTICATION BYPASS BERHASIL! (Kerentanan SQLi Terpicu)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Query bernilai TRUE tanpa validasi password. Semua rekaman pengguna bocor:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse mt-2">
                      <thead>
                        <tr className="border-b border-rose-800/60 text-rose-300">
                          <th className="py-1">ID</th>
                          <th className="py-1">Username</th>
                          <th className="py-1">Email</th>
                          <th className="py-1">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockUsers.map((u) => (
                          <tr key={u.id} className="border-b border-rose-900/30">
                            <td className="py-1">{u.id}</td>
                            <td className="py-1 font-bold text-emerald-400">{u.username}</td>
                            <td className="py-1">{u.email}</td>
                            <td className="py-1 font-bold">{u.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : usePreparedStatement ? (
                <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>PREPARED STATEMENTS AKTIF: Login Ditolak dengan Aman</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Database mencari user yang secara literal bernama persis <code>{sqliInput}</code>. Karakter kutip tidak mengubah alur logika query SQL.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#070b12] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] italic">
                  Input normal. Coba ketikkan payload bypass seperti <code>admin&apos; OR &apos;1&apos;=&apos;1&apos; --</code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= SECTION 2: REFLECTED XSS ================= */}
        {activeTab === "xss" && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-xs font-mono space-y-2">
              <span className="font-bold text-[var(--color-accent)] flex items-center gap-1.5 uppercase">
                <Sparkles className="w-4 h-4" /> Skenario Reflected XSS &amp; Output Encoding
              </span>
              <p className="text-slate-300 leading-relaxed">
                Ketikkan tag HTML atau skrip JavaScript di formulir pencarian. Amati bagaimana browser merender input mentah tanpa sanitasi vs input yang telah disanitasi menggunakan Context-Aware HTML Entity Encoding.
              </p>
            </div>

            {/* Input & Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <Input
                  label="Kolom Pencarian Web (Search Bar)"
                  value={xssInput}
                  onChange={(e) => setXssInput(e.target.value)}
                  placeholder="Ketik string pencarian atau payload XSS..."
                />
              </div>
              <div>
                <label className="flex items-center gap-2 p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-mono cursor-pointer hover:border-[var(--color-accent)] transition-colors">
                  <input
                    type="checkbox"
                    checked={useEncoding}
                    onChange={(e) => setUseEncoding(e.target.checked)}
                    className="accent-[var(--color-accent)]"
                  />
                  <span className="text-[var(--color-text)] font-semibold">
                    HTML Entity Encoding (Aman)
                  </span>
                </label>
              </div>
            </div>

            {/* Rendering Sandbox */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-4 rounded-lg bg-[#070b12] border border-[var(--color-border)] space-y-2">
                <div className="font-bold text-[var(--color-text-muted)] uppercase">
                  Raw DOM Output Source:
                </div>
                <div className="p-3 rounded bg-[#090e18] border border-[var(--color-border-subtle)] text-amber-300 break-all select-all">
                  {useEncoding
                    ? xssInput
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;")
                    : xssInput}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-300 uppercase mb-2">
                    Visualisasi Render di Peramban Klien:
                  </div>
                  {!useEncoding && xssInput.toLowerCase().includes("<script") ? (
                    <div className="p-3 rounded bg-rose-950/40 border border-rose-800 text-rose-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        <span>XSS PAYLOAD TERPICU!</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Browser mengeksekusi skrip penyerang. Dokumen cookie sesi dan token otentikasi dapat dicuri tanpa izin pengguna.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded bg-emerald-950/30 border border-emerald-800 text-emerald-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>OUTPUT RENDER AMAN</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Karakter khusus diubah menjadi entitas HTML (&lt; dan &gt;). Browser hanya menampilkannya sebagai teks biasa dan tidak mengeksekusinya sebagai skrip.
                      </p>
                    </div>
                  )}
                </div>
                <Button size="sm" className="mt-2" onClick={handleTestXss}>
                  Verifikasi Pengujian XSS
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Global Lab Completion Box */}
        {isCompleted && (
          <div className="p-4 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-300 font-mono text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <strong>Praktikum Selesai!</strong> Anda telah menguji teknik eksploitasi SQL Injection dan XSS beserta mitigasi defensifnya. Badge <em>Web App Defender</em> telah terbuka!
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
