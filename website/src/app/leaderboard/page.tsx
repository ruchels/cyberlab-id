"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, Badge, Button } from "@/components/ui";
import {
  Trophy,
  Award,
  Medal,
  Flag,
  Sparkles,
  Shield,
  Search,
  ArrowUpRight,
  ShieldAlert,
  Flame,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
  totalXp: number;
  ctfSolvesCount: number;
  ctfPoints?: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"global" | "ctf">("global");

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?type=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const topThree = leaderboard.slice(0, 3);
  const restUsers = leaderboard.slice(3);

  return (
    <div className="min-h-screen py-8 space-y-8 max-w-6xl mx-auto font-mono">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm">
            <Trophy className="w-3.5 h-3.5 mr-1 text-amber-400" />
            GLOBAL RANKING &amp; LEADERBOARD
          </Badge>
          <span className="text-xs text-[var(--color-text-muted)]">
            Perhitungan Skor Server-Side Terverifikasi
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)]">
              Papan Peringkat Nasional
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
              Peringkat pembelajar dan praktisi cybersecurity di seluruh Indonesia berdasarkan total akumulasi XP kurikulum dan poin penyelesaian tantangan CTF.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-border)] self-start md:self-auto text-xs">
            <button
              onClick={() => setActiveTab("global")}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "global"
                  ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Total XP Global
            </button>
            <button
              onClick={() => setActiveTab("ctf")}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "ctf"
                  ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              Poin CTF Solves
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
          {/* Rank 2 - Silver */}
          {topThree[1] && (
            <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-slate-400/30 flex flex-col items-center text-center space-y-3 relative order-2 md:order-1 mt-0 md:mt-4">
              <div className="w-12 h-12 rounded-xl bg-slate-300/10 border border-slate-300/40 flex items-center justify-center text-slate-300 font-bold text-lg">
                #2
              </div>
              <div className="space-y-1">
                <div className="font-bold text-base text-[var(--color-text)] truncate max-w-[200px]">
                  {topThree[1].displayName}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">@{topThree[1].username}</div>
              </div>
              <div className="text-2xl font-bold text-slate-300">
                {activeTab === "ctf" ? topThree[1].ctfPoints : topThree[1].totalXp}{" "}
                <span className="text-xs font-normal">XP</span>
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)]">
                {topThree[1].ctfSolvesCount} CTF Solves
              </div>
            </div>
          )}

          {/* Rank 1 - Gold (Center) */}
          {topThree[0] && (
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 to-[var(--color-surface)] border-2 border-amber-500/50 flex flex-col items-center text-center space-y-3 relative order-1 md:order-2 shadow-lg shadow-amber-500/5">
              <div className="absolute -top-3.5 bg-amber-500 text-black font-extrabold text-[10px] px-3 py-0.5 rounded-full flex items-center gap-1 shadow">
                <Flame className="w-3 h-3 fill-black" /> JUARA 1
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 font-extrabold text-xl mt-1">
                #1
              </div>
              <div className="space-y-1">
                <div className="font-bold text-lg text-[var(--color-text)] truncate max-w-[220px]">
                  {topThree[0].displayName}
                </div>
                <div className="text-xs text-amber-400">@{topThree[0].username}</div>
              </div>
              <div className="text-3xl font-extrabold text-amber-400">
                {activeTab === "ctf" ? topThree[0].ctfPoints : topThree[0].totalXp}{" "}
                <span className="text-sm font-normal">XP</span>
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {topThree[0].ctfSolvesCount} CTF Solves Terverifikasi
              </div>
            </div>
          )}

          {/* Rank 3 - Bronze */}
          {topThree[2] && (
            <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-amber-700/30 flex flex-col items-center text-center space-y-3 relative order-3 mt-0 md:mt-4">
              <div className="w-12 h-12 rounded-xl bg-amber-700/10 border border-amber-700/40 flex items-center justify-center text-amber-600 font-bold text-lg">
                #3
              </div>
              <div className="space-y-1">
                <div className="font-bold text-base text-[var(--color-text)] truncate max-w-[200px]">
                  {topThree[2].displayName}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">@{topThree[2].username}</div>
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {activeTab === "ctf" ? topThree[2].ctfPoints : topThree[2].totalXp}{" "}
                <span className="text-xs font-normal">XP</span>
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)]">
                {topThree[2].ctfSolvesCount} CTF Solves
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Table */}
      <Card className="border-[var(--color-border)] overflow-hidden">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
            <Medal className="w-4 h-4 text-[var(--color-accent)]" />
            Daftar Lengkap Peringkat
          </h2>
          <span className="text-xs text-[var(--color-text-muted)]">
            Total {leaderboard.length} Pembelajar Aktif
          </span>
        </CardHeader>

        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-12 text-xs text-[var(--color-text-muted)]">
              Memuat data peringkat...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Rank</th>
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">CTF Solves</th>
                    <th className="py-3 px-4 text-right">Skor Akumulasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {leaderboard.map((item) => {
                    const isCurrentUser = user && user.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isCurrentUser
                            ? "bg-[var(--color-accent)]/10 font-bold"
                            : "hover:bg-[var(--color-surface-elevated)]"
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          {item.rank === 1 ? (
                            <span className="text-amber-400 font-extrabold text-sm">🥇 1</span>
                          ) : item.rank === 2 ? (
                            <span className="text-slate-300 font-extrabold text-sm">🥈 2</span>
                          ) : item.rank === 3 ? (
                            <span className="text-amber-600 font-extrabold text-sm">🥉 3</span>
                          ) : (
                            <span className="text-[var(--color-text-muted)]">#{item.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-accent)] text-xs font-bold">
                              {item.displayName.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-[var(--color-text)] flex items-center gap-1.5">
                                {item.displayName}
                                {isCurrentUser && (
                                  <span className="text-[10px] text-[var(--color-accent)]">
                                    (Anda)
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[var(--color-text-muted)]">
                                @{item.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={item.role === "admin" ? "accent" : item.role === "moderator" ? "warning" : "default"}
                            size="sm"
                          >
                            {item.role.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center text-[var(--color-text-secondary)]">
                          {item.ctfSolvesCount} Tantangan
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-[var(--color-accent)] text-sm">
                            {activeTab === "ctf" ? item.ctfPoints : item.totalXp}
                          </span>{" "}
                          <span className="text-[10px] text-[var(--color-text-muted)]">XP</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
