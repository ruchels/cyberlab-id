"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Award,
  ShieldCheck,
  Play,
  Check,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { Badge, Card, CardHeader, CardContent } from "@/components/ui";

interface ModuleItem {
  id: string;
  title: string;
  type: string;
  duration_minutes: number;
  description?: string;
}

export default function AcademyPathDetailPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = use(params);
  const router = useRouter();

  const [path, setPath] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [pathId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/academy/paths/${pathId}`);
      const json = await res.json();
      if (json.success) {
        setPath(json.path);
        setEnrollment(json.enrollment);
        setCertificate(json.certificate);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await fetch(`/api/academy/paths/${pathId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enroll" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mendaftar");
      setMessage({ type: "success", text: "Berhasil mendaftar ke jalur pembelajaran ini!" });
      fetchDetail();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleModule = async (moduleId: string) => {
    if (!enrollment) return;
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await fetch(`/api/academy/paths/${pathId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_module", moduleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui progres modul");
      fetchDetail();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimCertificate = async () => {
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await fetch(`/api/academy/paths/${pathId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim_cert" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengklaim sertifikat");
      setMessage({ type: "success", text: "Selamat! Sertifikat kompetensi berhasil diterbitkan." });
      fetchDetail();
      if (data.certificate?.id) {
        router.push(`/verify/${data.certificate.id}`);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center font-mono text-xs text-[var(--color-text-muted)]">
        Memuat detail kurikulum...
      </div>
    );
  }

  if (!path) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center space-y-4">
        <p className="font-mono text-sm text-[var(--color-text-muted)]">Jalur pembelajaran tidak ditemukan.</p>
        <Link
          href="/academy"
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Akademi
        </Link>
      </div>
    );
  }

  const completedModules = enrollment?.completed_items || [];
  const totalModules = path.modules?.length || 0;
  const progressPercent = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0;
  const isAllCompleted = totalModules > 0 && completedModules.length === totalModules;

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/academy"
            className="inline-flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog Akademi</span>
          </Link>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-lg font-mono text-xs flex items-center justify-between border ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="underline hover:opacity-80">
              Tutup
            </button>
          </div>
        )}

        {/* Header Hero */}
        <div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] bg-[#0c101c] space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]">
              {path.category}
            </span>
            <Badge
              variant={
                path.difficulty === "beginner"
                  ? "default"
                  : path.difficulty === "intermediate"
                  ? "accent"
                  : "secondary"
              }
              size="sm"
            >
              {path.difficulty}
            </Badge>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold">{path.title}</h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
              {path.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[var(--color-border-subtle)] font-mono text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--color-accent)]" /> {path.estimated_hours} Jam Pembelajaran
            </span>
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" /> {totalModules} Modul & Praktikum
            </span>
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" /> Sertifikat Kompetensi Digital
            </span>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            {!enrollment ? (
              <button
                onClick={handleEnroll}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-accent)] text-black font-mono font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Mulai & Daftarkan Diri Sekarang</span>
              </button>
            ) : certificate ? (
              <Link
                href={`/verify/${certificate.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-500 text-black font-mono font-bold text-xs hover:opacity-90 transition-opacity"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Lihat Sertifikat Digital ({certificate.id})</span>
              </Link>
            ) : isAllCompleted ? (
              <button
                onClick={handleClaimCertificate}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-400 text-black font-mono font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 animate-pulse"
              >
                <Award className="w-4 h-4" />
                <span>Klaim Sertifikat Kompetensi</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-semibold">
                  Terdaftar (Progres: {progressPercent}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Tracker (if enrolled) */}
        {enrollment && (
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[var(--color-text-secondary)]">
                Status Penyelesaian Kurikulum ({completedModules.length} dari {totalModules} modul)
              </span>
              <span className="text-[var(--color-accent)] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[var(--color-surface-elevated)] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[var(--color-accent)] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Modules Syllabus */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-mono flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
              <span>Silabus & Modul Pembelajaran</span>
            </h2>
            <span className="text-xs font-mono text-[var(--color-text-muted)]">
              {totalModules} Modul
            </span>
          </div>

          <div className="space-y-3">
            {path.modules?.map((mod: ModuleItem, idx: number) => {
              const isDone = completedModules.includes(mod.id);
              return (
                <div
                  key={mod.id || idx}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                    isDone
                      ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                      : "border-[var(--color-border)] bg-[#0d121f] hover:border-[var(--color-border-elevated)]"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => handleToggleModule(mod.id)}
                      disabled={!enrollment || actionLoading}
                      title={enrollment ? (isDone ? "Tandai belum selesai" : "Tandai selesai") : "Daftar untuk menandai"}
                      className={`mt-0.5 shrink-0 transition-transform ${
                        enrollment ? "cursor-pointer hover:scale-110" : "cursor-not-allowed opacity-40"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--color-text-muted)]" />
                      )}
                    </button>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">#{idx + 1}</span>
                        <h4
                          className={`text-sm font-semibold ${
                            isDone ? "text-emerald-300 line-through opacity-85" : "text-[var(--color-text)]"
                          }`}
                        >
                          {mod.title}
                        </h4>
                      </div>
                      {mod.description && (
                        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                          {mod.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
                      {mod.type || "Teori & Lab"}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      {mod.duration_minutes || 45} mnt
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificate Section Box */}
        {isAllCompleted && !certificate && (
          <div className="p-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 space-y-4">
            <div className="flex items-start gap-4">
              <Award className="w-8 h-8 text-amber-400 shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="text-base font-bold text-amber-300 font-mono">
                  Kurikulum Selesai! Sertifikat Siap Diterbitkan
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Anda telah menyelesaikan seluruh modul di jalur pembelajaran ini. Klik tombol di bawah untuk menerbitkan sertifikat digital dengan verifikasi kriptografis SHA-256 yang dapat diverifikasi secara publik.
                </p>
                <button
                  onClick={handleClaimCertificate}
                  disabled={actionLoading}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-400 text-black font-mono font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Klaim Sertifikat Saya</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
