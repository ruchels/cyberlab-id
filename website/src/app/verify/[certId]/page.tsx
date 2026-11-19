"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  Calendar,
  Hash,
  Share2,
  Copy,
  Check,
  Search,
  ExternalLink,
  GraduationCap,
  Clock,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui";

export default function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ certId: string }>;
}) {
  const { certId } = use(params);
  const router = useRouter();

  const [searchId, setSearchId] = useState(certId === "demo" ? "" : certId);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(certId !== "demo");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (certId && certId !== "demo") {
      fetchCertificate(certId);
    }
  }, [certId]);

  const fetchCertificate = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/certificates/${id}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Sertifikat tidak ditemukan.");
        setData(null);
      } else {
        setData(json);
      }
    } catch (e: any) {
      setError(e.message || "Gagal menghubungi server verifikasi.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      router.push(`/verify/${searchId.trim()}`);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cert = data?.certificate;
  const isValid = data?.valid === true;

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>CyberLab-ID Cryptographic Credential Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Verifikasi Sertifikat Digital
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto">
            Layanan publik verifikasi keaslian dan integritas sertifikat kelulusan kurikulum Cybersecurity Academy CyberLab-ID.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Masukkan Certificate ID (contoh: CERT-CYBER-12345)..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[var(--color-accent)] text-black rounded-lg font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Verifikasi
          </button>
        </form>

        {/* State Display */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
            Memverifikasi sertifikat secara kriptografis...
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-center space-y-3 max-w-xl mx-auto">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-rose-300 font-mono">Sertifikat Tidak Valid</h3>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{error}</p>
          </div>
        ) : cert ? (
          <div className="space-y-6">
            {/* Status Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between font-mono text-xs ${
                isValid
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isValid ? (
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                )}
                <span>
                  {isValid
                    ? "STATUS: SERTIFIKAT RESMI TERVERIFIKASI & AKTIF"
                    : `STATUS: DICABUT (REVOKED) - ${cert.revocation_reason || "Pelanggaran integritas"}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1 rounded bg-black/20 hover:bg-black/40 border border-current text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin" : "Salin Link"}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 rounded bg-black/20 hover:bg-black/40 border border-current text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer hidden sm:inline-flex"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
              </div>
            </div>

            {/* Certificate Visual Card */}
            <div className="relative p-8 sm:p-12 rounded-3xl border-2 border-[var(--color-accent)]/50 bg-[#0d1222] shadow-2xl overflow-hidden print:border-black print:bg-white print:text-black">
              {/* Background Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <ShieldCheck className="w-96 h-96" />
              </div>

              {/* Certificate Inner Frame */}
              <div className="relative z-10 border border-[var(--color-accent)]/20 p-6 sm:p-10 rounded-2xl space-y-8 text-center">
                {/* Header Badge */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/40 flex items-center justify-center text-[var(--color-accent)] shadow-inner">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-accent)] font-bold">
                    CyberLab-ID Cybersecurity Academy
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-white print:text-black">
                    Sertifikat Kelulusan Kurikulum
                  </h2>
                </div>

                {/* Recipient Details */}
                <div className="space-y-2 py-4">
                  <p className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
                    Diberikan Kepada:
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-accent)] font-mono">
                    {cert.user_display_name}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] max-w-lg mx-auto pt-2">
                    Telah berhasil menyelesaikan seluruh kurikulum berbasis praktik, modul analisis, dan evaluasi kompetensi pada program pembelajaran:
                  </p>
                  <div className="text-lg sm:text-xl font-bold text-white print:text-black pt-1">
                    {cert.path_title}
                  </div>
                </div>

                {/* Certificate Meta Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[var(--color-border-subtle)] font-mono text-xs text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[var(--color-text-muted)] block uppercase">
                      Certificate ID
                    </span>
                    <span className="font-bold text-[var(--color-text)] text-[11px] break-all">
                      {cert.id}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-[var(--color-text-muted)] block uppercase">
                      Tanggal Penerbitan
                    </span>
                    <span className="font-bold text-[var(--color-text)]">
                      {new Date(cert.issue_date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-[var(--color-text-muted)] block uppercase">
                      Tingkat & Kategori
                    </span>
                    <span className="capitalize font-bold text-[var(--color-text)]">
                      {cert.difficulty} · {cert.category}
                    </span>
                  </div>
                </div>

                {/* Cryptographic Hash & QR Visual */}
                <div className="p-4 rounded-xl bg-black/40 border border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--color-accent)] uppercase">
                      <Hash className="w-3.5 h-3.5" />
                      <span>Verifikasi Kriptografis (SHA-256 Checksum)</span>
                    </div>
                    <p className="font-mono text-[10px] text-[var(--color-text-muted)] break-all bg-black/60 p-2 rounded border border-[var(--color-border)]">
                      {cert.verification_hash}
                    </p>
                  </div>

                  {/* QR Code Graphic (SVG) */}
                  <div className="shrink-0 p-2 bg-white rounded-lg shadow">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 25 25"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-black"
                    >
                      <rect width="25" height="25" fill="white" />
                      <rect x="2" y="2" width="7" height="7" fill="black" />
                      <rect x="3" y="3" width="5" height="5" fill="white" />
                      <rect x="4" y="4" width="3" height="3" fill="black" />
                      <rect x="16" y="2" width="7" height="7" fill="black" />
                      <rect x="17" y="3" width="5" height="5" fill="white" />
                      <rect x="18" y="4" width="3" height="3" fill="black" />
                      <rect x="2" y="16" width="7" height="7" fill="black" />
                      <rect x="3" y="17" width="5" height="5" fill="white" />
                      <rect x="4" y="18" width="3" height="3" fill="black" />
                      <rect x="11" y="2" width="2" height="4" fill="black" />
                      <rect x="11" y="8" width="2" height="2" fill="black" />
                      <rect x="11" y="12" width="3" height="3" fill="black" />
                      <rect x="16" y="11" width="4" height="2" fill="black" />
                      <rect x="15" y="16" width="3" height="3" fill="black" />
                      <rect x="20" y="15" width="3" height="4" fill="black" />
                      <rect x="11" y="18" width="2" height="5" fill="black" />
                      <rect x="16" y="21" width="6" height="2" fill="black" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Educational Disclaimer */}
            <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/50 text-[11px] font-mono text-[var(--color-text-muted)] space-y-1">
              <span className="font-bold text-[var(--color-text-secondary)] block">
                Pernyataan Integritas & Edukasi:
              </span>
              <p>{data.disclaimer}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
