"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  Award,
  Clock,
  ArrowRight,
  Shield,
  Target,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sliders,
  AlertCircle,
  BookOpen,
  FlaskConical,
  Trophy,
} from "lucide-react";
import { Badge, Card, CardHeader, CardContent } from "@/components/ui";

interface DomainScore {
  domain: string;
  name: string;
  score: number;
  completedCount: number;
  totalModules: number;
  level: string;
}

interface RecommendationItem {
  id: string;
  title: string;
  type: string;
  category: string;
  difficulty: string;
  url: string;
  rationale: string;
}

export default function AiLearningPathPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingPref, setSavingPref] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pref edit states
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);
  const [targetHours, setTargetHours] = useState(5);

  useEffect(() => {
    fetchPersonalizedPath();
  }, []);

  const fetchPersonalizedPath = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/personalization");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setPersonalizationEnabled(json.data.isPersonalizationEnabled);
        setTargetHours(json.data.weeklyTargetHours || 5);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async (enabled: boolean, hours: number) => {
    try {
      setSavingPref(true);
      setMsg(null);
      const res = await fetch("/api/ai/personalization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPersonalizationEnabled: enabled,
          weeklyTargetHours: hours,
        }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Gagal memperbarui preferensi");
      setMsg({ type: "success", text: "Preferensi personalisasi AI berhasil disimpan." });
      fetchPersonalizedPath();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSavingPref(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center font-mono text-xs text-[var(--color-text-muted)]">
        Memuat analisis AI Learning Path Anda...
      </div>
    );
  }

  const rec = data?.recommendedNextActivity;

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono">
              <Sparkles className="w-4 h-4" />
              <span>CyberLab-ID Adaptive Intelligence Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Jalur Belajar Adaptif <span className="text-[var(--color-accent)]">(Your AI Learning Path)</span>
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Rekomendasi kurikulum, penguatan domain keahlian, dan tantangan yang dipersonalisasi berdasarkan performa belajar dan praktikum Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/assistant"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-black font-mono font-bold text-xs hover:opacity-90 transition-opacity"
            >
              <span>Konsultasi AI Tutor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Message Banner */}
        {msg && (
          <div
            className={`p-4 rounded-lg font-mono text-xs flex items-center justify-between border ${
              msg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="underline hover:opacity-80">
              Tutup
            </button>
          </div>
        )}

        {/* Top Summary Banner: Overall Level & Weekly Hours Target */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[#0c101c] space-y-2">
            <span className="text-[10px] uppercase font-mono text-[var(--color-text-muted)] font-bold">
              Level Kemahiran Saat Ini
            </span>
            <h3 className="text-xl font-extrabold text-[var(--color-accent)] font-mono">
              {data?.overallLevel}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Total Akumulasi: <strong>{data?.totalXp} XP</strong>
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[#0c101c] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-mono text-[var(--color-text-muted)] font-bold">
                Target Belajar Mingguan
              </span>
              <span className="text-xs font-mono text-[var(--color-accent)] font-bold">
                {data?.weeklyCompletedHours} / {data?.weeklyTargetHours} Jam
              </span>
            </div>
            <div className="w-full bg-[var(--color-surface-elevated)] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[var(--color-accent)] h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (data?.weeklyCompletedHours / (data?.weeklyTargetHours || 5)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] font-mono text-[var(--color-text-muted)] pt-1">
              Konsistensi belajar harian mempercepat peningkatan peringkat kompetensi.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[#0c101c] space-y-2">
            <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold">
              Domain Terkuat vs Perlu Penguatan
            </span>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Unggul:</span>
                <span className="text-emerald-400 font-bold">{data?.strongestDomain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Fokus Perbaikan:</span>
                <span className="text-amber-400 font-bold">{data?.weakestDomain}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Next Activity Spotlight */}
        {rec && (
          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-accent)]/50 bg-[#0d1222] relative overflow-hidden space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-bold">
              <Target className="w-4 h-4" />
              <span>Rekomendasi Aktivitas Selanjutnya (Priority AI Suggestion)</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <h3 className="text-2xl font-bold text-white">{rec.title}</h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {rec.rationale}
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-[var(--color-text-muted)] pt-2">
                  <span className="capitalize px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text)]">
                    Kategori: {rec.category}
                  </span>
                  <Badge variant="accent" size="sm">
                    {rec.difficulty.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <Link
                  href={rec.url}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-accent)] text-black font-mono font-bold text-xs hover:opacity-90 transition-opacity"
                >
                  <span>Mulai Sekarang</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 6 Cybersecurity Domain Mastery Bars */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--color-accent)]" />
              <span>Matriks Penguasaan 6 Domain Keamanan Siber</span>
            </h3>
            <span className="text-xs font-mono text-[var(--color-text-muted)]">
              Evaluasi Berkelanjutan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.domainScores?.map((d: DomainScore) => (
              <div
                key={d.domain}
                className="p-5 rounded-xl border border-[var(--color-border)] bg-[#0d121f] space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-mono text-xs font-bold text-white">{d.name}</h4>
                  <Badge variant={d.score >= 50 ? "accent" : "default"} size="sm">
                    {d.level}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-[var(--color-text-muted)]">
                    <span>Penguasaan</span>
                    <span className="text-[var(--color-text)] font-bold">{d.score}%</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-elevated)] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        d.score >= 70
                          ? "bg-[var(--color-accent)]"
                          : d.score >= 35
                          ? "bg-blue-400"
                          : "bg-amber-400"
                      }`}
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[var(--color-text-muted)] flex justify-between pt-1">
                  <span>Modul/Lab: {d.completedCount} / {d.totalModules}</span>
                  <Link
                    href={`/academy`}
                    className="text-[var(--color-accent)] hover:underline flex items-center gap-0.5"
                  >
                    <span>Latih</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Challenges & Practice Labs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Challenges */}
          <div className="space-y-4">
            <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Tantangan CTF Terpersonalisasi</span>
            </h3>

            <div className="space-y-3">
              {data?.recommendedChallenges?.map((c: RecommendationItem) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-[var(--color-border)] bg-[#0d121f] flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{c.title}</h4>
                      <Badge variant="default" size="sm">
                        {c.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">{c.rationale}</p>
                  </div>
                  <Link
                    href={c.url}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--color-surface-elevated)] hover:bg-[var(--color-accent)] hover:text-black font-mono text-xs font-bold border border-[var(--color-border)] transition-colors"
                  >
                    Pecahkan
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Labs */}
          <div className="space-y-4">
            <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-blue-400" />
              <span>Rekomendasi Simulasi Cyber Range</span>
            </h3>

            <div className="space-y-3">
              {data?.suggestedLabs?.map((lab: RecommendationItem) => (
                <div
                  key={lab.id}
                  className="p-4 rounded-xl border border-[var(--color-border)] bg-[#0d121f] flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{lab.title}</h4>
                      <Badge variant="default" size="sm">
                        {lab.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">{lab.rationale}</p>
                  </div>
                  <Link
                    href={lab.url}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--color-surface-elevated)] hover:bg-blue-400 hover:text-black font-mono text-xs font-bold border border-[var(--color-border)] transition-colors"
                  >
                    Luncurkan
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[#0c101c] space-y-4">
          <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[var(--color-accent)]" />
            <span>Milestone Pembelajaran Anda</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data?.learningMilestones?.map((m: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[#0d121f] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className={`w-5 h-5 ${m.isAchieved ? "text-emerald-400" : "text-[var(--color-text-muted)] opacity-30"}`}
                  />
                  <span className={`text-xs font-mono ${m.isAchieved ? "text-white font-bold" : "text-[var(--color-text-muted)]"}`}>
                    {m.title}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--color-accent)]">
                  +{m.xpReward} XP
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy & Personalization Control Settings */}
        <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[#0c101c] space-y-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[var(--color-accent)]" />
            <h3 className="font-bold text-white text-sm">Privasi & Kontrol Rekomendasi AI</h3>
          </div>

          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            CyberLab-ID menghormati kedaulatan data Anda. Rekomendasi AI hanya menganalisis progres modul teknis lokal Anda untuk menyusun urutan materi belajar yang optimal tanpa mengambil atau menyebarkan data pribadi sensitif.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enablePersonalization"
                checked={personalizationEnabled}
                onChange={(e) => {
                  setPersonalizationEnabled(e.target.checked);
                  handleUpdatePreferences(e.target.checked, targetHours);
                }}
                disabled={savingPref}
                className="w-4 h-4 rounded accent-[var(--color-accent)] cursor-pointer"
              />
              <label htmlFor="enablePersonalization" className="text-white font-bold cursor-pointer">
                Aktifkan Analisis Rekomendasi Adaptif AI
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)]">Target Mingguan:</span>
              <select
                value={targetHours}
                onChange={(e) => {
                  const h = Number(e.target.value);
                  setTargetHours(h);
                  handleUpdatePreferences(personalizationEnabled, h);
                }}
                disabled={savingPref}
                className="px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-xs font-mono text-white"
              >
                <option value={3}>3 Jam / Minggu</option>
                <option value={5}>5 Jam / Minggu</option>
                <option value={10}>10 Jam / Minggu</option>
                <option value={15}>15 Jam / Minggu</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
