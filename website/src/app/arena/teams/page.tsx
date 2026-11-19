"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Shield,
  ArrowLeft,
  Key,
  Copy,
  Check,
  LogOut,
  Crown,
  Trophy,
  Sparkles,
} from "lucide-react";
import { Badge, Card, CardHeader, CardContent } from "@/components/ui";

interface Member {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  total_xp: number;
  role: string;
  joined_at: string;
}

export default function ArenaTeamManagerPage() {
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/arena/teams");
      const json = await res.json();
      if (json.success) {
        setTeam(json.team);
        setMembers(json.members || []);
      }
    } catch (e) {
      console.error("Failed to load team data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await fetch("/api/arena/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: teamName.trim(),
          description: teamDesc.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat tim");
      setMessage({ type: "success", text: "Tim berhasil dibuat!" });
      setTeamName("");
      setTeamDesc("");
      fetchTeam();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await fetch("/api/arena/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          inviteCode: inviteCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal bergabung dengan tim");
      setMessage({ type: "success", text: `Berhasil bergabung dengan tim ${data.team?.name || ""}!` });
      setInviteCode("");
      fetchTeam();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar dari tim ini?")) return;
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await fetch("/api/arena/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal keluar dari tim");
      setMessage({ type: "success", text: "Anda telah keluar dari tim." });
      setTeam(null);
      setMembers([]);
      fetchTeam();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const copyCode = () => {
    if (team?.invite_code) {
      navigator.clipboard.writeText(team.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div>
          <Link
            href="/arena"
            className="inline-flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Arena CTF</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono">
            <Users className="w-4 h-4" />
            <span>Manajemen Tim Arena</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Kolaborasi & <span className="text-[var(--color-accent)]">Squad Kompetisi</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            Bentuk tim tangguh atau bergabung dengan skuad lain untuk berlaga di kompetisi CTF CyberLab-ID.
          </p>
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

        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
            Memuat data tim...
          </div>
        ) : team ? (
          /* Active Team View */
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-accent)]/40 bg-[#0d1222] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                    <Badge variant="accent" size="sm">
                      {team.role === "leader" ? "Team Leader" : "Member"}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] pt-1">
                    {team.description || "Tidak ada deskripsi tim."}
                  </p>
                </div>

                <div className="text-right font-mono sm:border-l sm:border-[var(--color-border)] sm:pl-6">
                  <span className="text-xs text-[var(--color-text-muted)] block">Total Skor Tim</span>
                  <span className="text-2xl font-extrabold text-[var(--color-accent)]">
                    {team.total_points || 0} pts
                  </span>
                </div>
              </div>

              {/* Invite Code Box */}
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-black/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-[var(--color-accent)]" />
                  <div>
                    <span className="text-xs font-mono text-[var(--color-text-muted)] block">
                      Kode Undangan Tim (Share ke rekan tim):
                    </span>
                    <span className="font-mono text-base font-bold tracking-widest text-[var(--color-accent)]">
                      {team.invite_code}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={copyCode}
                    className="px-4 py-2 rounded-lg bg-[var(--color-surface-elevated)] hover:bg-white/10 border border-[var(--color-border)] font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Tersalin" : "Salin Kode"}</span>
                  </button>

                  <button
                    onClick={handleLeaveTeam}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono text-xs font-bold hover:bg-rose-500/20 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Tim</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Member List */}
            <div className="space-y-4">
              <h3 className="font-mono text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--color-accent)]" />
                <span>Roster Anggota ({members.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-[var(--color-border)] bg-[#0d121f] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 flex items-center justify-center font-bold text-xs text-[var(--color-accent)] font-mono">
                        {m.display_name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-mono text-xs font-bold">
                          <span>{m.display_name}</span>
                          {m.role === "leader" && (
                            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                          @{m.username} · {m.total_xp} XP
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Not in team: Show Create & Join forms */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Team Card */}
            <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[#0d121f] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono text-base font-bold">Bentuk Tim Baru</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Jadilah kapten tim dan buat squad CTF Anda.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[var(--color-text-secondary)]">Nama Tim</label>
                  <input
                    type="text"
                    placeholder="cth: Garuda Cyber Squad"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[var(--color-text-secondary)]">
                    Deskripsi Tim (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Visi atau moto tim..."
                    value={teamDesc}
                    onChange={(e) => setTeamDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 bg-[var(--color-accent)] text-black rounded-lg font-mono text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  {actionLoading ? "Membuat..." : "Buat Tim Sekarang"}
                </button>
              </form>
            </div>

            {/* Join Team Card */}
            <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[#0d121f] space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono text-base font-bold">Gabung dengan Tim</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Masukkan kode undangan dari ketua tim Anda.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleJoinTeam} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[var(--color-text-secondary)]">
                      Kode Undangan (6 Karakter)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: GARUDA"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      maxLength={12}
                      required
                      className="w-full px-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-xs font-mono uppercase tracking-widest text-center text-[var(--color-accent)] font-bold focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-lg font-mono text-xs font-bold hover:bg-white/5 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {actionLoading ? "Bergabung..." : "Gabung Tim"}
                  </button>
                </form>
              </div>

              <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-black/20 text-[11px] font-mono text-[var(--color-text-muted)]">
                Belum punya tim? Ajak teman komunitas untuk bergabung atau buat tim baru sendiri.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
