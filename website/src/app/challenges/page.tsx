"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import {
  Trophy,
  Flag,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Unlock,
  KeyRound,
  Filter,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  hint: string;
  instructions: string;
  attachment_url: string;
  solves_count: number;
  isSolved: boolean;
}

export default function ChallengesPage() {
  const { user, refreshUser } = useAuth();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "solved" | "unsolved">("all");
  const [search, setSearch] = useState("");

  // Submission state per challenge
  const [flagInputs, setFlagInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [submitFeedback, setSubmitFeedback] = useState<
    Record<string, { success: boolean; message: string; badges?: string[] }>
  >({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/ctf/challenges");
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
      }
    } catch (err) {
      console.error("Failed to load challenges:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const handleFlagSubmit = async (challengeId: string) => {
    const input = flagInputs[challengeId];
    if (!input || input.trim().length === 0) return;

    setSubmitting((prev) => ({ ...prev, [challengeId]: true }));
    setSubmitFeedback((prev) => ({ ...prev, [challengeId]: undefined as any }));

    try {
      const res = await fetch("/api/ctf/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, flag: input.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitFeedback((prev) => ({
          ...prev,
          [challengeId]: {
            success: true,
            message: data.message,
            badges: data.unlockedBadges,
          },
        }));
        // Update local challenge state to solved
        setChallenges((prev) =>
          prev.map((c) =>
            c.id === challengeId ? { ...c, isSolved: true, solves_count: c.solves_count + 1 } : c
          )
        );
        await refreshUser();
      } else {
        setSubmitFeedback((prev) => ({
          ...prev,
          [challengeId]: {
            success: false,
            message: data.error || data.message || "Flag yang Anda masukkan salah.",
          },
        }));
      }
    } catch {
      setSubmitFeedback((prev) => ({
        ...prev,
        [challengeId]: {
          success: false,
          message: "Gagal menghubungi server verifikasi.",
        },
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [challengeId]: false }));
    }
  };

  const toggleHint = (id: string) => {
    setRevealedHints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredChallenges = challenges.filter((c) => {
    const matchCat = selectedCategory === "all" || c.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchDiff = selectedDifficulty === "all" || c.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    const matchStatus =
      activeFilter === "all" ||
      (activeFilter === "solved" && c.isSolved) ||
      (activeFilter === "unsolved" && !c.isSolved);
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());

    return matchCat && matchDiff && matchStatus && matchSearch;
  });

  const totalPoints = challenges.reduce((sum, c) => sum + c.points, 0);
  const earnedPoints = challenges
    .filter((c) => c.isSolved)
    .reduce((sum, c) => sum + c.points, 0);
  const solvedCount = challenges.filter((c) => c.isSolved).length;

  return (
    <div className="min-h-screen py-8 space-y-8 max-w-7xl mx-auto font-mono">
      {/* Header Banner */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm">
            <Trophy className="w-3.5 h-3.5 mr-1" />
            CAPTURE THE FLAG PLATFORM
          </Badge>
          <span className="text-xs text-[var(--color-text-muted)]">
            Validasi Server-Side Aman • Jeopardy Style
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)]">
              CyberLab CTF Challenges
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
              Asah kemampuan analisis kriptografi, reverse engineering, web exploitation, dan digital forensics.
              Seluruh flag diverifikasi langsung secara aman di server tanpa eksposur jawaban pada klien.
            </p>
          </div>

          {/* Stats Card */}
          <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] min-w-[260px] flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-muted)]">Skor CTF Terverifikasi</div>
              <div className="text-xl font-bold text-[var(--color-text)]">
                {earnedPoints} / {totalPoints}{" "}
                <span className="text-xs font-normal text-amber-400">PTS</span>
              </div>
              <div className="text-[11px] text-[var(--color-accent)]">
                {solvedCount} dari {challenges.length} Tantangan Selesai
              </div>
            </div>
          </div>
        </div>

        {/* Unauthenticated Alert */}
        {!user && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-amber-400 block">
                Anda Belum Masuk Akun
              </span>
              <p className="text-amber-300/80">
                Masuk atau daftar untuk mengklaim poin XP, menyimpan status penyelesaian flag, dan masuk ke papan peringkat global.
              </p>
            </div>
            <Link href="/auth/login" className="flex-shrink-0">
              <Button variant="primary" size="sm" className="text-xs font-mono">
                Masuk Sekarang
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul tantangan, deskripsi, atau kategori..."
              className="pl-9 font-mono text-xs"
            />
            <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Solved Status Filter */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeFilter === "all"
                  ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Semua ({challenges.length})
            </button>
            <button
              onClick={() => setActiveFilter("solved")}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeFilter === "solved"
                  ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Selesai ({solvedCount})
            </button>
            <button
              onClick={() => setActiveFilter("unsolved")}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeFilter === "unsolved"
                  ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Belum ({challenges.length - solvedCount})
            </button>
          </div>
        </div>

        {/* Category & Difficulty pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
          <span className="text-[var(--color-text-muted)] text-[11px] font-bold uppercase mr-1">
            Kategori:
          </span>
          {["all", "Cryptography", "Networking", "Web Exploitation", "Digital Forensics", "Reverse Engineering", "Linux", "Miscellaneous"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/50 font-bold"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border-subtle)]"
              }`}
            >
              {cat === "all" ? "Semua Kategori" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[var(--color-text-muted)]">
          Memuat tantangan CTF dari server...
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] space-y-2">
          <Flag className="w-8 h-8 mx-auto text-[var(--color-border)]" />
          <div>Tidak ada tantangan yang cocok dengan kriteria filter yang dipilih.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChallenges.map((ch) => {
            const feedback = submitFeedback[ch.id];
            const isSubmitting = submitting[ch.id] || false;
            const isHintOpen = revealedHints[ch.id] || false;

            return (
              <Card
                key={ch.id}
                className={`border transition-all flex flex-col justify-between ${
                  ch.isSolved
                    ? "bg-emerald-500/5 border-emerald-500/40"
                    : "border-[var(--color-border)]"
                }`}
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-accent)]">
                      {ch.category}
                    </span>
                    <Badge variant={ch.isSolved ? "success" : "default"} size="sm">
                      {ch.isSolved ? "TERPECAHKAN" : ch.difficulty}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-base text-[var(--color-text)]">
                    {ch.title}
                  </h3>
                  <div className="text-xs text-[var(--color-text-muted)] flex items-center justify-between pt-1">
                    <span className="text-amber-400 font-bold">+{ch.points} PTS</span>
                    <span>{ch.solves_count} Solves</span>
                  </div>
                </CardHeader>

                <CardBody className="space-y-4 text-xs flex-1 flex flex-col justify-between">
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {ch.description}
                  </p>

                  {ch.instructions && (
                    <div className="p-2.5 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)]">
                      <span className="text-[var(--color-accent)] font-bold">Instruksi:</span>{" "}
                      {ch.instructions}
                    </div>
                  )}

                  {/* Hint Toggle */}
                  {ch.hint && (
                    <div>
                      <button
                        onClick={() => toggleHint(ch.id)}
                        className="text-[11px] text-[var(--color-accent)] hover:underline flex items-center gap-1"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        {isHintOpen ? "Sembunyikan Petunjuk" : "Buka Petunjuk (Hint)"}
                      </button>
                      {isHintOpen && (
                        <div className="mt-2 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                          {ch.hint}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submission Form / Solved state */}
                  <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-2">
                    {ch.isSolved ? (
                      <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>Tantangan Terselesaikan (+{ch.points} XP)</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={flagInputs[ch.id] || ""}
                            onChange={(e) =>
                              setFlagInputs((prev) => ({ ...prev, [ch.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleFlagSubmit(ch.id);
                            }}
                            placeholder="CYBERLAB{flag_rahasia}"
                            className="font-mono text-xs"
                          />
                          <Button
                            onClick={() => handleFlagSubmit(ch.id)}
                            disabled={isSubmitting || !flagInputs[ch.id]}
                            variant="primary"
                            size="sm"
                            className="text-xs whitespace-nowrap"
                          >
                            {isSubmitting ? "..." : "Submit"}
                          </Button>
                        </div>

                        {/* Feedback Banner */}
                        {feedback && (
                          <div
                            className={`p-2.5 rounded border text-[11px] flex items-start gap-2 ${
                              feedback.success
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-red-500/10 border-red-500/30 text-red-400"
                            }`}
                          >
                            {feedback.success ? (
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div>{feedback.message}</div>
                              {feedback.badges && feedback.badges.length > 0 && (
                                <div className="mt-1 font-bold text-purple-300">
                                  Lencana Diraih: {feedback.badges.join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
