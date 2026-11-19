"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Compass,
} from "lucide-react";
import { Badge, Card, CardHeader, CardContent } from "@/components/ui";

interface AcademyPath {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  estimated_hours: number;
  modules_count: number;
  is_featured: number;
  isEnrolled?: boolean;
  progressPercentage?: number;
  hasCertificate?: boolean;
}

export default function AcademyPage() {
  const [paths, setPaths] = useState<AcademyPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchPaths();
  }, []);

  const fetchPaths = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/academy/paths");
      const json = await res.json();
      if (json.success && json.paths) {
        setPaths(json.paths);
      }
    } catch (e) {
      console.error("Failed to load academy paths", e);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", ...Array.from(new Set(paths.map((p) => p.category)))];

  const filteredPaths = paths.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === "all" || p.difficulty === difficultyFilter;
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  // Recommended path based on beginner status or featured
  const recommendedPath = paths.find((p) => p.is_featured === 1) || paths[0];

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono">
            <GraduationCap className="w-4 h-4" />
            <span>CyberLab-ID Cybersecurity Academy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Jalur Pembelajaran <span className="text-[var(--color-accent)]">Akademi Terstruktur</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-3xl leading-relaxed">
            Kuasai keamanan siber melalui 10 kurikulum berbasis praktik bertahap. Selesaikan modul, jalankan simulasi lab, dan raih sertifikat kompetensi digital terverifikasi kriptografis.
          </p>
        </div>

        {/* Recommended Path Banner */}
        {recommendedPath && (
          <div className="p-6 rounded-xl border border-[var(--color-accent)]/40 bg-gradient-to-r from-[var(--color-accent)]/10 via-[var(--color-surface)] to-[var(--color-surface)] relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--color-accent)]/20 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Rekomendasi Jalur Permulaan (Featured Path)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">{recommendedPath.title}</h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  {recommendedPath.description}
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-[var(--color-text-muted)] pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {recommendedPath.estimated_hours} Jam
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> {recommendedPath.modules_count} Modul
                  </span>
                  <span className="capitalize px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {recommendedPath.difficulty}
                  </span>
                </div>
              </div>
              <div>
                <Link
                  href={`/academy/${recommendedPath.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-black font-mono font-bold text-xs hover:opacity-90 transition-opacity"
                >
                  <span>Mulai Jalur Ini</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-y border-[var(--color-border)] py-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Cari jalur pembelajaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-mono text-[var(--color-text-muted)] mr-1">Tingkat:</span>
            {["all", "beginner", "intermediate", "advanced"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDifficultyFilter(lvl)}
                className={`px-3 py-1 rounded text-xs font-mono capitalize transition-colors ${
                  difficultyFilter === lvl
                    ? "bg-[var(--color-accent)] text-black font-bold"
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                {lvl === "all" ? "Semua" : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <span className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">Kategori:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-mono shrink-0 transition-colors ${
                categoryFilter === cat
                  ? "bg-white/10 text-[var(--color-accent)] border border-[var(--color-accent)]/50"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {cat === "all" ? "Semua Kategori" : cat}
            </button>
          ))}
        </div>

        {/* Paths Grid */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
            Memuat kurikulum akademi...
          </div>
        ) : filteredPaths.length === 0 ? (
          <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
            Tidak ada jalur pembelajaran yang cocok dengan pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPaths.map((path) => (
              <Card
                key={path.id}
                className="flex flex-col justify-between hover:border-[var(--color-accent)]/40 transition-colors bg-[#0d121f]"
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]">
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
                  <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)]">
                    {path.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                    {path.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-muted)] border-t border-[var(--color-border-subtle)] pt-3">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--color-accent)]" /> {path.estimated_hours} Jam
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" /> {path.modules_count} Modul
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" /> Sertifikat
                    </span>
                  </div>

                  {/* Enrollment Progress if any */}
                  {path.isEnrolled && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-[var(--color-text-muted)]">Progres Belajar</span>
                        <span className="text-[var(--color-accent)] font-bold">
                          {path.progressPercentage ?? 0}%
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-surface-elevated)] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[var(--color-accent)] h-full transition-all duration-300"
                          style={{ width: `${path.progressPercentage ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2">
                    <Link
                      href={`/academy/${path.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded bg-[var(--color-surface-elevated)] hover:bg-[var(--color-accent)] hover:text-black font-mono text-xs font-bold border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all"
                    >
                      {path.hasCertificate ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Lihat Sertifikat Selesai</span>
                        </>
                      ) : path.isEnrolled ? (
                        <>
                          <span>Lanjutkan Belajar</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Lihat Kurikulum & Mulai</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Verification Banner */}
        <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold font-mono">Verifikasi Sertifikat Digital</h4>
              <p className="text-xs text-[var(--color-text-muted)]">
                Punya ID sertifikat CyberLab-ID? Masukkan ID atau pindai kode verifikasi untuk membuktikan integritas kriptografisnya.
              </p>
            </div>
          </div>
          <Link
            href="/verify/demo"
            className="shrink-0 px-4 py-2 rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:bg-white/10 font-mono text-xs font-bold transition-colors"
          >
            Halaman Verifikasi
          </Link>
        </div>
      </div>
    </div>
  );
}
