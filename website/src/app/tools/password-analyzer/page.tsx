"use client";

import React, { useState } from "react";
import Link from "next/link";
import { analyzePassword } from "@/lib/tools/password";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import {
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function PasswordAnalyzerPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const analysis = analyzePassword(password);

  const getStrengthColor = () => {
    switch (analysis.strength) {
      case "Sangat Kuat":
        return "bg-emerald-500";
      case "Kuat":
        return "bg-teal-400";
      case "Sedang":
        return "bg-amber-400";
      case "Lemah":
        return "bg-orange-500";
      default:
        return "bg-rose-500";
    }
  };

  const getBadgeVariant = () => {
    switch (analysis.strength) {
      case "Sangat Kuat":
      case "Kuat":
        return "success";
      case "Sedang":
        return "warning";
      default:
        return "danger";
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Tools
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-[var(--color-text)] flex items-center gap-3">
              <Lock className="w-7 h-7 text-[var(--color-accent)]" />
              Password Strength & Entropy Analyzer
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Analisis matematis entropi Shannon, ketahanan brute-force GPU cluster, dan deteksi kebiasaan buruk password.
            </p>
          </div>
          <Badge variant="accent" size="md">
            Zero Network Leak
          </Badge>
        </div>
      </div>

      {/* Input Card */}
      <Card>
        <CardBody className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
              Ketik Password yang Ingin Diuji
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi atau passphrase..."
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-4 py-3 text-sm font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 cursor-pointer"
                title={showPassword ? "Sembunyikan" : "Tampilkan"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Strength Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--color-text-secondary)]">
                Kekuatan:{" "}
                <strong className="text-[var(--color-text)] font-bold">
                  {analysis.strength}
                </strong>{" "}
                ({analysis.score}/100)
              </span>
              <Badge variant={getBadgeVariant()}>{analysis.strength}</Badge>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                style={{ width: `${Math.max(5, analysis.score)}%` }}
              />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border-subtle)] text-center font-mono">
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Panjang Karakter</div>
              <div className="text-lg font-bold text-[var(--color-text)] mt-0.5">
                {analysis.length}
              </div>
            </div>
            <div className="p-3 rounded bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border-subtle)] text-center font-mono">
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Entropi Informasi</div>
              <div className="text-lg font-bold text-[var(--color-accent)] mt-0.5">
                {analysis.entropyBits} <span className="text-xs text-[var(--color-text-muted)]">bit</span>
              </div>
            </div>
            <div className="p-3 rounded bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border-subtle)] text-center font-mono col-span-2">
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Estimasi Waktu Retas GPU</div>
              <div className="text-sm font-bold text-amber-400 mt-1 truncate">
                {analysis.estimatedCrackTime}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Detailed Analysis Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Checklist */}
        <Card>
          <CardHeader>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-text)]">
              Komposisi Karakter (Character Pool)
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-[var(--color-border-subtle)] text-xs font-mono">
              {[
                { label: "Huruf Kecil (a-z)", status: analysis.hasLower },
                { label: "Huruf Besar (A-Z)", status: analysis.hasUpper },
                { label: "Angka (0-9)", status: analysis.hasNumber },
                { label: "Simbol / Karakter Khusus (!@#$)", status: analysis.hasSymbol },
                { label: "Panjang Minimal 12 Karakter", status: analysis.length >= 12 },
              ].map((item, idx) => (
                <div key={idx} className="px-5 py-3 flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">{item.label}</span>
                  {item.status ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Ya
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                      <XCircle className="w-4 h-4 text-rose-500" /> Belum
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Patterns & Suggestions */}
        <div className="space-y-4">
          {analysis.detectedPatterns.length > 0 && (
            <div className="p-4 rounded-lg border border-amber-800/80 bg-amber-950/30 text-xs font-mono space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Pola Rentan Terdeteksi:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-200/90 pl-1">
                {analysis.detectedPatterns.map((pat, idx) => (
                  <li key={idx}>{pat}</li>
                ))}
              </ul>
            </div>
          )}

          <Card>
            <CardHeader>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-text)]">
                Saran Penguatan Keamanan
              </h3>
            </CardHeader>
            <CardBody className="space-y-2.5 text-xs text-[var(--color-text-secondary)]">
              {analysis.suggestions.map((sug, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0 mt-0.5" />
                  <span>{sug}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Educational Guide */}
      <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)] space-y-3">
        <h4 className="font-mono font-bold text-[var(--color-text)] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--color-accent)]" />
          Tips: Gunakan Passphrase Daripada Password Rumit yang Pendek
        </h4>
        <p>
          Kompleksitas buatan seperti <code>Tr0ub4dor&amp;3</code> sulit diingat manusia namun sangat cepat di-brute force oleh rig modern. Sebaliknya, kombinasi 4 kata acak (misal: <code>kucing-merah-terbang-sepatu</code>) memiliki panjang 28 karakter dengan entropi melebihi 60 bit dan mudah diingat.
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)] border-t border-[var(--color-border-subtle)] pt-2 font-mono">
          🔒 Jaminan Privasi: Password yang Anda ketikkan di halaman ini dievaluasi secara instan oleh JavaScript di browser lokal. Tidak pernah dikirimkan atau direkam ke server manapun.
        </p>
        <p className="text-[11px] text-amber-300/80 font-mono">
          ⚠️ Disclaimer Edukasi: Tool ini berfungsi sebagai estimator matematis untuk tujuan edukasi dan pelatihan, bukan jaminan mutlak keamanan akun. Selalu aktifkan Multi-Factor Authentication (MFA/2FA) dan jangan pernah menggunakan ulang password yang sama pada beberapa layanan.
        </p>
      </div>
    </div>
  );
}
