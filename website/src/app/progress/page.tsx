"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Badge, Button, Card, CardHeader, CardBody } from "@/components/ui";
import {
  Trophy,
  Shield,
  Award,
  BookOpen,
  FlaskConical,
  Flag,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Terminal,
  Network,
  Globe,
  KeyRound,
  Binary,
  Cpu,
  Lock,
  Download,
  AlertTriangle,
} from "lucide-react";
import { useProgress, BADGES_LIST, BadgeItem } from "@/lib/progress";
import { MODULES_DATA } from "@/data/modules";
import { LESSONS_DATABASE } from "@/data/lessons";

export default function ProgressDashboardPage() {
  const { progress, resetAllProgress } = useProgress();
  const [mounted, setMounted] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalLessons = LESSONS_DATABASE.length; // 24
  const completedLessonsCount = mounted ? progress.completedLessons.length : 0;
  const completedLabsCount = mounted ? progress.completedLabs.length : 0;
  const solvedChallengesCount = mounted ? progress.solvedChallenges.length : 0;

  // Calculate points
  const challengePoints = mounted ? progress.solvedChallenges.length * 30 : 0;
  const labPoints = completedLabsCount * 25;
  const lessonPoints = completedLessonsCount * 10;
  const totalXP = challengePoints + labPoints + lessonPoints;

  // Level determination
  const getLevel = (xp: number) => {
    if (xp >= 350) return { title: "Centurion Cyber Guardian", rank: "Master", color: "text-amber-400" };
    if (xp >= 200) return { title: "Senior Analyst", rank: "Lanjutan", color: "text-purple-400" };
    if (xp >= 100) return { title: "Junior Security Practitioner", rank: "Menengah", color: "text-[var(--color-accent)]" };
    if (xp >= 30) return { title: "Enthusiast Apprentice", rank: "Pemula", color: "text-emerald-400" };
    return { title: "Cadet Recruit", rank: "Inisiasi", color: "text-[var(--color-text-muted)]" };
  };

  const levelInfo = getLevel(totalXP);

  // Badge icon resolver
  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "Terminal":
        return <Terminal className="w-5 h-5" />;
      case "Network":
        return <Network className="w-5 h-5" />;
      case "Globe":
        return <Globe className="w-5 h-5" />;
      case "KeyRound":
        return <KeyRound className="w-5 h-5" />;
      case "Binary":
        return <Binary className="w-5 h-5" />;
      case "Cpu":
        return <Cpu className="w-5 h-5" />;
      case "Trophy":
        return <Trophy className="w-5 h-5" />;
      case "Shield":
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(progress, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cyberlab_progress_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm" className="font-mono">
            <Trophy className="w-3.5 h-3.5 mr-1" />
            CAPAIAN &amp; PORTOFOLIO
          </Badge>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">
            Local-First Progress Engine
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-mono font-bold text-[var(--color-text)]">
              Learning Dashboard
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-2xl font-mono leading-relaxed">
              Pantau progres kurikulum modular, rekapitulasi skor praktikum lab terisolasi,
              lencana sertifikasi lokal (Badges), dan riwayat aktivitas pembelajaran Anda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportData}
              variant="outline"
              size="sm"
              className="font-mono text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor JSON
            </Button>
            <Button
              onClick={() => setShowResetConfirm(true)}
              variant="outline"
              size="sm"
              className="font-mono text-xs flex items-center gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Progres
            </Button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Banner */}
      {showResetConfirm && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 font-mono text-xs space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Konfirmasi Penghapusan Seluruh Progres Belajar
          </div>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Tindakan ini akan mengosongkan riwayat modul yang diselesaikan, praktikum lab, skor kuis,
            dan seluruh lencana badge yang telah diraih. Progres di localStorage peramban Anda akan dihapus permanen.
          </p>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                resetAllProgress();
                setShowResetConfirm(false);
              }}
              variant="primary"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs"
            >
              Ya, Hapus Semua Progres
            </Button>
            <Button
              onClick={() => setShowResetConfirm(false)}
              variant="outline"
              size="sm"
              className="font-mono text-xs"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total XP & Rank */}
        <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] font-mono space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>TOTAL SKOR &amp; RANK</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--color-text)]">
              {mounted ? totalXP : 0} <span className="text-xs font-normal text-amber-400">XP</span>
            </div>
            <div className={`text-xs font-bold mt-1 ${levelInfo.color}`}>
              {levelInfo.title}
            </div>
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-subtle)]">
            Tingkat: <span className="text-[var(--color-text)]">{levelInfo.rank}</span>
          </div>
        </div>

        {/* Lessons Completed */}
        <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] font-mono space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>MATERI SELESAI</span>
            <BookOpen className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--color-text)]">
              {mounted ? completedLessonsCount : 0}{" "}
              <span className="text-sm font-normal text-[var(--color-text-muted)]">
                / {totalLessons}
              </span>
            </div>
            <div className="text-xs text-[var(--color-accent)] font-bold mt-1">
              {mounted ? Math.round((completedLessonsCount / totalLessons) * 100) : 0}% Kurikulum
            </div>
          </div>
          <div className="w-full bg-[var(--color-surface-elevated)] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[var(--color-accent)] h-full transition-all duration-300"
              style={{
                width: `${mounted ? (completedLessonsCount / totalLessons) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Labs Completed */}
        <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] font-mono space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>PRAKTIKUM LAB</span>
            <FlaskConical className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--color-text)]">
              {mounted ? completedLabsCount : 0}{" "}
              <span className="text-sm font-normal text-[var(--color-text-muted)]">/ 6</span>
            </div>
            <div className="text-xs text-emerald-400 font-bold mt-1">
              {mounted ? Math.round((completedLabsCount / 6) * 100) : 0}% Lab Selesai
            </div>
          </div>
          <div className="w-full bg-[var(--color-surface-elevated)] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-300"
              style={{
                width: `${mounted ? (completedLabsCount / 6) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Badges Earned */}
        <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] font-mono space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>LENCANA BADGES</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--color-text)]">
              {mounted ? progress.unlockedBadges.length : 0}{" "}
              <span className="text-sm font-normal text-[var(--color-text-muted)]">
                / {BADGES_LIST.length}
              </span>
            </div>
            <div className="text-xs text-purple-400 font-bold mt-1">
              {mounted ? Math.round((progress.unlockedBadges.length / BADGES_LIST.length) * 100) : 0}% Koleksi Terbuka
            </div>
          </div>
          <div className="w-full bg-[var(--color-surface-elevated)] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-400 h-full transition-all duration-300"
              style={{
                width: `${mounted ? (progress.unlockedBadges.length / BADGES_LIST.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Track Progress Breakdown */}
      <div className="space-y-4 font-mono">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
            Kemajuan per Jalur Pembelajaran (Learning Tracks)
          </h2>
          <Link
            href="/learning"
            className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
          >
            Lihat Semua Modul <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES_DATA.map((mod) => {
            const trackLessons = LESSONS_DATABASE.filter((l) => l.moduleId === mod.id);
            const trackDone = mounted
              ? trackLessons.filter((l) => progress.completedLessons.includes(l.id)).length
              : 0;
            const percentage = trackLessons.length > 0 ? Math.round((trackDone / trackLessons.length) * 100) : 0;

            return (
              <div
                key={mod.id}
                className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-accent)] font-bold">{mod.level}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {trackDone} / {trackLessons.length} Pelajaran
                  </span>
                </div>
                <div className="font-bold text-sm text-[var(--color-text)]">{mod.title}</div>
                <div className="w-full bg-[var(--color-surface-elevated)] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[var(--color-accent)] h-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-1">
                  <span>{percentage}% Selesai</span>
                  <Link
                    href={`/learning`}
                    className="text-[var(--color-accent)] hover:underline flex items-center gap-0.5"
                  >
                    Buka <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement Badges Grid */}
      <div className="space-y-4 font-mono">
        <div>
          <h2 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            Lencana Sertifikasi &amp; Pencapaian (Badges)
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Lencana otomatis dibuka saat Anda menyelesaikan lab praktikum atau mengumpulkan poin XP tertentu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BADGES_LIST.map((badge) => {
            const isUnlocked = mounted && progress.unlockedBadges.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border transition-all ${
                  isUnlocked
                    ? "bg-purple-500/10 border-purple-500/40 shadow-sm"
                    : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                      isUnlocked
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                        : "bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {renderBadgeIcon(badge.icon)}
                  </div>
                  <Badge variant={isUnlocked ? "success" : "default"} size="sm">
                    {isUnlocked ? "Terbuka" : "Terkunci"}
                  </Badge>
                </div>

                <div className="font-bold text-sm text-[var(--color-text)] mb-1">
                  {badge.title}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  {badge.description}
                </div>
                <div className="mt-3 pt-2 border-t border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-muted)] flex items-center justify-between">
                  <span>Kategori: {badge.category}</span>
                  {badge.requiredPoints && <span>{badge.requiredPoints} XP</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="space-y-4 font-mono">
        <h2 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--color-accent)]" />
          Riwayat Aktivitas Terkini (Activity Feed)
        </h2>

        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          {mounted && progress.activityLog.length > 0 ? (
            <div className="space-y-3">
              {progress.activityLog.slice(0, 8).map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                    <div>
                      <span className="font-bold text-[var(--color-text)]">{act.title}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)] block sm:inline sm:ml-2">
                        Tipe: {act.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">
                    {new Date(act.timestamp).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[var(--color-text-muted)] space-y-2">
              <Clock className="w-8 h-8 mx-auto text-[var(--color-border)]" />
              <div>Belum ada aktivitas tercatat. Mulailah dengan membaca materi atau menyelesaikan praktikum lab!</div>
              <div className="pt-2">
                <Link href="/learning">
                  <Button variant="primary" size="sm" className="font-mono text-xs">
                    Mulai Belajar Sekarang
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
