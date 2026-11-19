"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  analyzeFileSignature,
  FileAnalysisResult,
  SIGNATURE_DATABASE,
} from "@/lib/tools/file-signature";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import {
  Binary,
  ArrowLeft,
  Upload,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  FileSearch,
} from "lucide-react";

export default function FileSignatureCheckerPage() {
  const [result, setResult] = useState<FileAnalysisResult | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Read first 128 bytes
      const slice = file.slice(0, 128);
      const buffer = await slice.arrayBuffer();
      const analysis = analyzeFileSignature(file.name, buffer);
      setResult(analysis);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDatabase = SIGNATURE_DATABASE.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.extension.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Binary className="w-7 h-7 text-[var(--color-accent)]" />
              File Signature (Magic Bytes) Checker
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Deteksi format asli suatu file berdasarkan tanda tangan biner (Magic Bytes) dan bongkar manipulasi ekstensi (File Spoofing).
            </p>
          </div>
          <Badge variant="accent" size="md">
            Forensics & Antivirus Logic
          </Badge>
        </div>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardBody className="space-y-4">
          <div className="border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-lg p-8 text-center cursor-pointer bg-[var(--color-surface-elevated)]/30 transition-colors">
            <input
              type="file"
              id="file-sig-upload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-sig-upload" className="cursor-pointer block">
              <Upload className="w-10 h-10 text-[var(--color-accent)] mx-auto mb-3 opacity-80" />
              <p className="text-sm font-mono font-bold text-[var(--color-text)]">
                Pilih atau Tarik File ke Sini
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 font-mono">
                Hanya membaca 32 byte pertama di memori lokal peramban. Privasi terjamin 100%.
              </p>
            </label>
          </div>
        </CardBody>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Spoofing Alert */}
          {result.isExtensionMismatch && (
            <div
              className={`p-4 rounded-lg border flex items-start gap-3 font-mono text-xs ${
                result.severity === "danger"
                  ? "bg-rose-950/40 border-rose-800 text-rose-200"
                  : "bg-amber-950/40 border-amber-800 text-amber-200"
              }`}
            >
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-sm font-bold block">
                  PERINGATAN: Ekstensi File Tidak Sesuai dengan Header Biner!
                </strong>
                <p>
                  File mengaku berekstensi <code>.{result.declaredExtension}</code>, namun tanda tangan biner (Magic Bytes) menunjukkan format asli adalah{" "}
                  <strong>{result.detectedSignatures.map((s) => s.name).join(" atau ")}</strong>.
                </p>
                {result.severity === "danger" && (
                  <p className="text-rose-400 font-bold pt-1">
                    ⚠️ Risiko Keamanan Tinggi: Ini adalah teknik umum malware dropper untuk mengelabui pengguna agar mengklik executable berbahaya!
                  </p>
                )}
              </div>
            </div>
          )}

          {!result.isExtensionMismatch && result.detectedSignatures.length > 0 && (
            <div className="p-4 rounded-lg border bg-emerald-950/30 border-emerald-800 text-emerald-300 font-mono text-xs flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong>Tanda Tangan Valid:</strong> Ekstensi <code>.{result.declaredExtension}</code> cocok dengan tanda tangan biner yang terdeteksi ({result.detectedSignatures[0].name}).
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hex Dump */}
            <Card>
              <CardHeader>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-text)]">
                  Hexadecimal &amp; ASCII Header Dump
                </h3>
              </CardHeader>
              <CardBody className="space-y-4 font-mono text-xs">
                <div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mb-1">
                    Magic Bytes (Hex):
                  </div>
                  <div className="p-3 rounded bg-[#070b12] border border-[var(--color-border-subtle)] text-[var(--color-accent)] break-all font-bold tracking-wider">
                    {result.hexPreview}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mb-1">
                    ASCII Representation:
                  </div>
                  <div className="p-3 rounded bg-[#070b12] border border-[var(--color-border-subtle)] text-slate-300 break-all">
                    {result.asciiPreview}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Identification Meta */}
            <Card>
              <CardHeader>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-text)]">
                  Hasil Identifikasi Forensik
                </h3>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-[var(--color-border-subtle)] text-xs font-mono">
                  <div className="px-5 py-3 flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Nama File:</span>
                    <span className="text-[var(--color-text)] font-bold truncate max-w-[200px]">
                      {result.fileName}
                    </span>
                  </div>
                  <div className="px-5 py-3 flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Ekstensi Tercatat:</span>
                    <span className="text-[var(--color-text)] font-bold uppercase">
                      {result.declaredExtension || "(Tanpa Ekstensi)"}
                    </span>
                  </div>
                  <div className="px-5 py-3 flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Format Terdeteksi:</span>
                    <span className="text-[var(--color-accent)] font-bold">
                      {result.detectedSignatures.length > 0
                        ? result.detectedSignatures.map((s) => s.name).join(", ")
                        : "Tidak dikenal / Raw Data"}
                    </span>
                  </div>
                  <div className="px-5 py-3 flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">MIME Type Asli:</span>
                    <span className="text-slate-300 font-mono">
                      {result.detectedSignatures[0]?.mimeType || "application/octet-stream"}
                    </span>
                  </div>
                  <div className="px-5 py-3 flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Deskripsi Format:</span>
                    <span className="text-slate-400 text-right max-w-[220px]">
                      {result.detectedSignatures[0]?.description || "-"}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Signature Database Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-mono font-bold text-[var(--color-text)] flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-[var(--color-accent)]" />
              Tabel Referensi Magic Bytes Populer
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Kamus signature bawaan CyberLab-ID untuk analisis forensik digital.
            </p>
          </div>
          <div className="w-full sm:w-60">
            <Input
              placeholder="Cari format, ekstensi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] uppercase border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-2.5">Ekstensi</th>
                  <th className="px-4 py-2.5">Format File</th>
                  <th className="px-4 py-2.5">Magic Bytes (Hex)</th>
                  <th className="px-4 py-2.5">Deskripsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {filteredDatabase.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[var(--color-surface-elevated)]/30">
                    <td className="px-4 py-2 font-bold text-[var(--color-accent)] uppercase">
                      .{item.extension}
                    </td>
                    <td className="px-4 py-2 text-[var(--color-text)]">{item.name}</td>
                    <td className="px-4 py-2 text-amber-300 font-bold">
                      {item.magicBytes
                        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
                        .join(" ")}
                    </td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">
                      {item.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
