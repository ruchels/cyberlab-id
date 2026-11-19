"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Swords,
  Users,
  Flag,
  Calendar,
  Clock,
  Shield,
  Award,
  ChevronRight,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Badge, Card, CardHeader, CardContent } from "@/components/ui";

interface Competition {
  id: string;
  title: string;
  description: string;
  type: string;
  format: string;
  start_time: string;
  end_time: string;
  status: "upcoming" | "active" | "ended";
  rules: string;
}

interface TeamRank {
  id: string;
  name: string;
  description: string;
  total_points: number;
  leader_name: string;
  members_count: number;
}

export default function ArenaPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [leaderboard, setLeaderboard] = useState<TeamRank[]>([]);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Submit flag modal state
  const [flagInput, setFlagInput] = useState("");
  const [challengeIdInput, setChallengeIdInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchArenaData();
  }, []);

  const fetchArenaData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/arena/competitions");
      const json = await res.json();
      if (json.success) {
        setCompetitions(json.competitions || []);
        setLeaderboard(json.teams || []);
        setMyTeam(json.myTeam || null);
      }
    } catch (e) {
      console.error("Failed to load arena data", e);
    } finally {
      setLoading(false);
    }
  };

  const activeComp = competitions.find((c) => c.status === "active") || competitions[0];

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComp || !flagInput || !challengeIdInput) return;

    try {
      setSubmitting(true);
      setSubmitResult(null);
      const res = await fetch(`/api/arena/competitions/${activeComp.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challengeIdInput.trim(),
          flag: flagInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitResult({ success: false, message: data.error || "Flag salah atau pengiriman gagal" });
      } else {
        setSubmitResult({ success: true, message: data.message || "Flag Benar! Poin telah ditambahkan." });
        setFlagInput("");
        fetchArenaData();
      }
    } catch (err: any) {
      setSubmitResult({ success: false, message: err.message || "Gagal menghubungi server arena" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono">
              <Swords className="w-4 h-4" />
              <span>CyberLab-ID CTF Competitive Arena</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Arena Kompetisi & <span className="text-[var(--color-accent)]">Papan Skor Tim</span>
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl">
              Uji ketangguhan teknik hacking dan pertahanan siber dalam format tim kolaboratif. Selesaikan tantangan, kumpulkan poin, dan raih posisi teratas di papan peringkat nasional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/arena/teams"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-accent)] text-xs font-mono font-bold transition-all"
            >
              <Users className="w-4 h-4 text-[var(--color-accent)]" />
              <span>{myTeam ? `Tim Saya (${myTeam.name})` : "Kelola Tim / Gabung"}</span>
            </Link>
          </div>
        </div>

        {/* Active Competition Banner */}
        {activeComp && (
          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-accent)]/40 bg-[#0d1222] relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {activeComp.status}
                  </span>
                  <span className="text-[var(--color-text-muted)]">· Format: {activeComp.format}</span>
                  <span className="text-[var(--color-text-muted)]">· Tipe: {activeComp.type}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold">{activeComp.title}</h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {activeComp.description}
                </p>
                <div className="pt-2 text-xs font-mono text-[var(--color-text-muted)] flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[var(--color-accent)]" /> Mulai:{" "}
                    {new Date(activeComp.start_time).toLocaleDateString("id-ID")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-400" /> Selesai:{" "}
                    {new Date(activeComp.end_time).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Submit Flag Quick Box */}
              <div className="w-full lg:w-96 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[var(--color-accent)] flex items-center gap-1.5">
                    <Flag className="w-4 h-4" />
                    Kirim Flag Kompetisi
                  </span>
                  {myTeam && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
                      {myTeam.name}
                    </span>
                  )}
                </div>

                {submitResult && (
                  <div
                    className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 ${
                      submitResult.success
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {submitResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="leading-tight">{submitResult.message}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitFlag} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Challenge ID (cth: chal-web-01)..."
                    value={challengeIdInput}
                    onChange={(e) => setChallengeIdInput(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-md text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="CYBERLAB{...}"
                      value={flagInput}
                      onChange={(e) => setFlagInput(e.target.value)}
                      required
                      className="flex-1 px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-md text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-[var(--color-accent)] text-black rounded-md font-mono text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? "..." : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Content Columns: Leaderboard & Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Team Leaderboard (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-mono flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Papan Peringkat Tim (Scoreboard)</span>
              </h3>
              <span className="text-xs font-mono text-[var(--color-text-muted)]">
                Top 20 Tim Nasional
              </span>
            </div>

            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[#0d121f]">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Nama Tim</th>
                      <th className="py-3 px-4">Ketua Tim</th>
                      <th className="py-3 px-4 text-center">Anggota</th>
                      <th className="py-3 px-4 text-right">Total Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[var(--color-text-muted)]">
                          Belum ada tim yang terdaftar.
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((team, idx) => (
                        <tr
                          key={team.id}
                          className={`hover:bg-white/[0.02] transition-colors ${
                            idx === 0
                              ? "bg-amber-400/[0.04]"
                              : idx === 1
                              ? "bg-slate-300/[0.03]"
                              : idx === 2
                              ? "bg-amber-700/[0.03]"
                              : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center font-bold">
                            {idx === 0 ? (
                              <span className="text-amber-400">1</span>
                            ) : idx === 1 ? (
                              <span className="text-slate-300">2</span>
                            ) : idx === 2 ? (
                              <span className="text-amber-600">3</span>
                            ) : (
                              <span className="text-[var(--color-text-muted)]">{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[var(--color-text)]">
                            <div className="flex items-center gap-2">
                              <span>{team.name}</span>
                              {myTeam && myTeam.id === team.id && (
                                <Badge variant="accent" size="sm">
                                  Tim Anda
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[var(--color-text-secondary)]">
                            {team.leader_name}
                          </td>
                          <td className="py-3.5 px-4 text-center text-[var(--color-text-muted)]">
                            {team.members_count || 1}
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-[var(--color-accent)]">
                            {team.total_points.toLocaleString()} pts
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Rules and Competition Info (Col 3) */}
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
              <h4 className="font-mono text-sm font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--color-accent)]" />
                <span>Aturan Kompetisi & Tie-Breaking</span>
              </h4>
              <ul className="space-y-2.5 text-xs text-[var(--color-text-secondary)] font-mono leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)]">•</span>
                  <span>Setiap tantangan memiliki skor tetap atau dinamis berdasarkan jumlah solve.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)]">•</span>
                  <span>
                    Jika terdapat kesamaan poin (tie), peringkat ditentukan oleh tim yang mencapai skor tersebut terlebih dahulu (timestamp earlier solve).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)]">•</span>
                  <span>Dilarang keras melakukan sharing flag, DDoS pada infrastruktur, atau brute-force portal.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[#0c101c] space-y-4">
              <h4 className="font-mono text-sm font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Pencapaian Arena (Badges)</span>
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Kumpulkan badge eksklusif seperti <strong>Arena Gladiator</strong> dan <strong>Team Captain</strong> yang langsung tersemat di profil publik CyberLab-ID Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
