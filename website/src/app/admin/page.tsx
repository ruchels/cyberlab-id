"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import {
  Shield,
  Users,
  Flag,
  MessageSquare,
  AlertTriangle,
  FileText,
  BarChart3,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Search,
  Trash2,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type AdminTab = "analytics" | "users" | "ctf" | "moderation" | "audit";

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("analytics");

  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // CTF state
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isCreatingCtf, setIsCreatingCtf] = useState(false);
  const [newCtf, setNewCtf] = useState({
    title: "",
    description: "",
    category: "Cryptography",
    difficulty: "Beginner",
    points: 25,
    flag: "",
    hint: "",
    instructions: "",
  });
  const [ctfMsg, setCtfMsg] = useState<string | null>(null);

  // Moderation state
  const [reports, setReports] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
        setRecentLogs(data.recentLogs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/admin/challenges");
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      if (activeTab === "analytics" || activeTab === "audit") fetchAnalytics();
      if (activeTab === "users") fetchUsers();
      if (activeTab === "ctf") fetchChallenges();
      if (activeTab === "moderation") fetchReports();
    }
  }, [user, activeTab]);

  const handleUpdateUser = async (targetId: string, role: string, status: string) => {
    setUpdatingUser(targetId);
    try {
      const res = await fetch(`/api/admin/users/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, status }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal memperbarui pengguna.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleCreateCtf = async (e: React.FormEvent) => {
    e.preventDefault();
    setCtfMsg(null);
    try {
      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCtf),
      });
      const data = await res.json();
      if (res.ok) {
        setCtfMsg("Tantangan CTF berhasil dibuat!");
        setIsCreatingCtf(false);
        setNewCtf({
          title: "",
          description: "",
          category: "Cryptography",
          difficulty: "Beginner",
          points: 25,
          flag: "",
          hint: "",
          instructions: "",
        });
        fetchChallenges();
      } else {
        setCtfMsg(data.error || "Gagal membuat tantangan.");
      }
    } catch {
      setCtfMsg("Tidak dapat terhubung ke server.");
    }
  };

  const handleResolveReport = async (reportId: string, action: "dismiss" | "delete_post") => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-mono text-xs text-[var(--color-text-muted)]">
        Memverifikasi hak akses administrator...
      </div>
    );
  }

  // Access Control Guard
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-16 text-center space-y-4 max-w-md mx-auto font-mono">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Akses Ditolak (403 Forbidden)
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          Halaman ini dilindungi oleh otorisasi berbasis peran (Role-Based Access Control). Hanya akun dengan hak akses <strong>Administrator</strong> yang diizinkan mengakses panel ini.
        </p>
        <Link href="/auth/login">
          <Button variant="outline" size="sm" className="text-xs">
            Masuk dengan Akun Admin
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 space-y-8 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent" size="sm">
              <Shield className="w-3.5 h-3.5 mr-1" />
              PANEL ADMINISTRATOR
            </Badge>
            <span className="text-xs text-[var(--color-text-muted)]">
              Sistem Manajemen Platform Terpusat
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            Admin Management Center
          </h1>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-border)] text-xs">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "analytics"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analitik
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "users"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Pengguna
          </button>
          <button
            onClick={() => setActiveTab("ctf")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "ctf"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Flag className="w-3.5 h-3.5" /> Tantangan CTF
          </button>
          <button
            onClick={() => setActiveTab("moderation")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "moderation"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Moderasi
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Audit Log
          </button>
        </div>
      </div>

      {/* Tab 1: Analytics */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)]">Total Pengguna</div>
              <div className="text-2xl font-bold text-[var(--color-text)] mt-1">{analytics.totalUsers}</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)]">Pengguna Aktif</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{analytics.activeUsers}</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)]">Tantangan CTF</div>
              <div className="text-2xl font-bold text-[var(--color-accent)] mt-1">{analytics.totalChallenges}</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)]">Total Solves</div>
              <div className="text-2xl font-bold text-purple-400 mt-1">{analytics.totalSolves}</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)]">Topik Komunitas</div>
              <div className="text-2xl font-bold text-sky-400 mt-1">{analytics.communityPosts}</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)]">Laporan Masuk</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{analytics.pendingReports}</div>
            </div>
          </div>

          {/* Audit Logs Preview */}
          <Card className="border-[var(--color-border)]">
            <CardHeader>
              <h2 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-accent)]" />
                Catatan Aktivitas &amp; Keamanan Terkini (Audit Trail)
              </h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)]">
                    <tr>
                      <th className="py-2.5 px-4">Waktu</th>
                      <th className="py-2.5 px-4">Aktor</th>
                      <th className="py-2.5 px-4">Aksi</th>
                      <th className="py-2.5 px-4">Target</th>
                      <th className="py-2.5 px-4">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--color-surface-elevated)]">
                        <td className="py-2.5 px-4 text-[var(--color-text-muted)] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleTimeString("id-ID")}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-[var(--color-text)]">
                          {log.actor_username || "Sistem"}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] font-bold text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[var(--color-text-muted)]">
                          {log.target_type} ({log.target_id.slice(0, 12)}...)
                        </td>
                        <td className="py-2.5 px-4 text-[var(--color-text-secondary)]">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchUsers();
                }}
                placeholder="Cari berdasarkan username, email, nama..."
                className="pl-9 font-mono text-xs"
              />
              <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <Button onClick={fetchUsers} variant="outline" size="sm" className="text-xs">
              Cari
            </Button>
          </div>

          <Card className="border-[var(--color-border)]">
            <CardBody className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] uppercase">
                    <tr>
                      <th className="py-3 px-4">Pengguna</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Total XP</th>
                      <th className="py-3 px-4">CTF Solves</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-[var(--color-surface-elevated)]">
                        <td className="py-3 px-4 font-bold text-[var(--color-text)]">
                          {u.display_name} <span className="text-[10px] text-[var(--color-text-muted)]">(@{u.username})</span>
                        </td>
                        <td className="py-3 px-4 text-[var(--color-text-muted)]">{u.email}</td>
                        <td className="py-3 px-4">
                          <select
                            value={u.role}
                            disabled={updatingUser === u.id || u.id === user.id}
                            onChange={(e) => handleUpdateUser(u.id, e.target.value, u.status)}
                            className="bg-[var(--color-background)] border border-[var(--color-border)] rounded px-2 py-1 text-xs font-mono"
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={u.status === "active" ? "success" : "danger"} size="sm">
                            {u.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-bold text-[var(--color-accent)]">{u.total_xp} XP</td>
                        <td className="py-3 px-4 text-[var(--color-text-muted)]">{u.solves_count}</td>
                        <td className="py-3 px-4 text-right">
                          {u.id !== user.id && (
                            <Button
                              onClick={() =>
                                handleUpdateUser(
                                  u.id,
                                  u.role,
                                  u.status === "active" ? "suspended" : "active"
                                )
                              }
                              disabled={updatingUser === u.id}
                              variant="outline"
                              size="sm"
                              className={`text-[11px] ${
                                u.status === "active"
                                  ? "text-red-400 border-red-500/30 hover:bg-red-500/10"
                                  : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                              }`}
                            >
                              {u.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab 3: CTF Challenge Management */}
      {activeTab === "ctf" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">
                Daftar Tantangan CTF ({challenges.length})
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Semua flag dienkripsi satu arah dengan hash SHA-256 untuk mencegah kebocoran pada sisi klien.
              </p>
            </div>
            <Button
              onClick={() => setIsCreatingCtf(true)}
              variant="primary"
              size="sm"
              className="text-xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Buat Tantangan Baru
            </Button>
          </div>

          {/* Create Modal */}
          {isCreatingCtf && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-xl rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
                  <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                    <Flag className="w-4 h-4 text-[var(--color-accent)]" />
                    Tambah Tantangan CTF Baru
                  </h3>
                  <button
                    onClick={() => setIsCreatingCtf(false)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs"
                  >
                    Tutup ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCtf} className="space-y-3 text-xs font-mono">
                  {ctfMsg && (
                    <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      {ctfMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[var(--color-text-muted)] block">Kategori</label>
                      <select
                        value={newCtf.category}
                        onChange={(e) => setNewCtf({ ...newCtf, category: e.target.value })}
                        className="w-full rounded bg-[var(--color-background)] border border-[var(--color-border)] p-2 text-xs"
                      >
                        <option value="Cryptography">Cryptography</option>
                        <option value="Networking">Networking</option>
                        <option value="Web Exploitation">Web Exploitation</option>
                        <option value="Digital Forensics">Digital Forensics</option>
                        <option value="Reverse Engineering">Reverse Engineering</option>
                        <option value="Linux">Linux</option>
                        <option value="Miscellaneous">Miscellaneous</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[var(--color-text-muted)] block">Tingkat Kesulitan</label>
                      <select
                        value={newCtf.difficulty}
                        onChange={(e) => setNewCtf({ ...newCtf, difficulty: e.target.value })}
                        className="w-full rounded bg-[var(--color-background)] border border-[var(--color-border)] p-2 text-xs"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[var(--color-text-muted)] block">Judul Tantangan</label>
                      <Input
                        required
                        value={newCtf.title}
                        onChange={(e) => setNewCtf({ ...newCtf, title: e.target.value })}
                        placeholder="e.g. RSA Prime Factorization"
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[var(--color-text-muted)] block">Poin XP</label>
                      <Input
                        type="number"
                        required
                        value={newCtf.points}
                        onChange={(e) => setNewCtf({ ...newCtf, points: Number(e.target.value) })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[var(--color-text-muted)] block">
                      Secret Flag (Akan Dihash Otomatis)
                    </label>
                    <Input
                      required
                      value={newCtf.flag}
                      onChange={(e) => setNewCtf({ ...newCtf, flag: e.target.value })}
                      placeholder="CYBERLAB{secret_solution_here}"
                      className="font-mono text-xs border-[var(--color-accent)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[var(--color-text-muted)] block">Deskripsi Skenario</label>
                    <textarea
                      rows={3}
                      required
                      value={newCtf.description}
                      onChange={(e) => setNewCtf({ ...newCtf, description: e.target.value })}
                      placeholder="Jelaskan latar belakang skenario insiden atau objek analisis..."
                      className="w-full rounded bg-[var(--color-background)] border border-[var(--color-border)] p-2 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[var(--color-text-muted)] block">Petunjuk (Hint)</label>
                    <Input
                      value={newCtf.hint}
                      onChange={(e) => setNewCtf({ ...newCtf, hint: e.target.value })}
                      placeholder="Petunjuk opsional untuk pembelajar..."
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
                    <Button type="button" onClick={() => setIsCreatingCtf(false)} variant="outline" size="sm">
                      Batal
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      Simpan &amp; Publikasikan
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <Card className="border-[var(--color-border)]">
            <CardBody className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] uppercase">
                    <tr>
                      <th className="py-3 px-4">Judul Tantangan</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Tingkat</th>
                      <th className="py-3 px-4">Poin</th>
                      <th className="py-3 px-4">Total Solves</th>
                      <th className="py-3 px-4">Flag Hash (Server)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {challenges.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--color-surface-elevated)]">
                        <td className="py-3 px-4 font-bold text-[var(--color-text)]">{c.title}</td>
                        <td className="py-3 px-4 text-[var(--color-accent)]">{c.category}</td>
                        <td className="py-3 px-4">
                          <Badge variant="default" size="sm">
                            {c.difficulty}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-400">+{c.points} XP</td>
                        <td className="py-3 px-4 text-[var(--color-text-muted)]">{c.solves_count}</td>
                        <td className="py-3 px-4 font-mono text-[10px] text-[var(--color-text-muted)]">
                          {c.flag_hash?.slice(0, 16)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab 4: Moderation */}
      {activeTab === "moderation" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text)]">
              Antrean Moderasi Komunitas ({reports.length})
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Tinjau konten diskusi yang dilaporkan oleh anggota komunitas atas dugaan spam, kebocoran flag, atau pelanggaran etika.
            </p>
          </div>

          {reports.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
              <div>Tidak ada laporan pelanggaran aktif saat ini. Komunitas aman terkendali!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl bg-[var(--color-surface)] border border-amber-500/30 text-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Alasan: {rep.reason}
                    </span>
                    <Badge variant={rep.status === "pending" ? "warning" : "default"} size="sm">
                      {rep.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="p-3 rounded bg-[var(--color-background)] border border-[var(--color-border-subtle)] space-y-1">
                    <div className="font-bold text-[var(--color-text)]">{rep.post_title}</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2">
                      {rep.post_content}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] pt-1">
                      Penulis: @{rep.author_username} • Dilaporkan oleh: @{rep.reporter_username}
                    </div>
                  </div>

                  {rep.status === "pending" && (
                    <div className="flex items-center gap-2 justify-end pt-1">
                      <Button
                        onClick={() => handleResolveReport(rep.id, "dismiss")}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Abaikan Laporan
                      </Button>
                      <Button
                        onClick={() => handleResolveReport(rep.id, "delete_post")}
                        variant="primary"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white text-xs flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Postingan
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Audit Trail */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text)]">
              Audit Trail &amp; Log Keamanan
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Rekam jejak setiap aksi administratif, percobaan autentikasi, penyelesaian flag CTF, dan tindakan moderasi.
            </p>
          </div>

          <Card className="border-[var(--color-border)]">
            <CardBody className="p-0">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)]">
                    <tr>
                      <th className="py-2.5 px-4">Waktu</th>
                      <th className="py-2.5 px-4">Aktor</th>
                      <th className="py-2.5 px-4">Aksi</th>
                      <th className="py-2.5 px-4">Target</th>
                      <th className="py-2.5 px-4">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--color-surface-elevated)]">
                        <td className="py-2.5 px-4 text-[var(--color-text-muted)] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-[var(--color-text)]">
                          {log.actor_username || "Sistem"}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] font-bold text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[var(--color-text-muted)]">
                          {log.target_type}
                        </td>
                        <td className="py-2.5 px-4 text-[var(--color-text-secondary)]">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
