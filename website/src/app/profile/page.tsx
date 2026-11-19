"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import {
  User,
  Shield,
  Terminal,
  Globe,
  KeyRound,
  Binary,
  Cpu,
  Trophy,
  Sparkles,
  Award,
  Flag,
  Calendar,
  Lock,
  Edit3,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const AVATAR_OPTIONS = [
  { id: "Shield", label: "Defender Shield", icon: Shield },
  { id: "Terminal", label: "Terminal Ninja", icon: Terminal },
  { id: "Globe", label: "Web Specialist", icon: Globe },
  { id: "KeyRound", label: "Crypto Master", icon: KeyRound },
  { id: "Binary", label: "Forensic Sleuth", icon: Binary },
  { id: "Cpu", label: "Reverse Engineer", icon: Cpu },
  { id: "Trophy", label: "CTF Champion", icon: Trophy },
  { id: "Sparkles", label: "Cyber Initiate", icon: Sparkles },
];

export default function ProfilePage() {
  const { user, isLoading, logout, updateProfile } = useAuth();

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Change password state
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-mono text-xs text-[var(--color-text-muted)]">
        Memuat data akun...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)]">
          <User className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-mono font-bold text-[var(--color-text)]">
          Masuk ke Akun Anda
        </h1>
        <p className="text-xs font-mono text-[var(--color-text-muted)] leading-relaxed">
          Masuk atau buat akun baru untuk menyimpan progres pembelajaran, mengumpulkan poin XP dari CTF, dan berdiskusi di forum komunitas.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Link href="/auth/login">
            <Button variant="primary" size="sm" className="font-mono text-xs">
              Masuk Akun
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline" size="sm" className="font-mono text-xs">
              Daftar Baru
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getRank = (xp: number) => {
    if (xp >= 350) return { title: "Centurion Cyber Guardian", rank: "Master", color: "text-amber-400" };
    if (xp >= 200) return { title: "Senior Security Analyst", rank: "Lanjutan", color: "text-purple-400" };
    if (xp >= 100) return { title: "Junior Security Practitioner", rank: "Menengah", color: "text-[var(--color-accent)]" };
    if (xp >= 30) return { title: "Enthusiast Apprentice", rank: "Pemula", color: "text-emerald-400" };
    return { title: "Cadet Recruit", rank: "Inisiasi", color: "text-[var(--color-text-muted)]" };
  };

  const rankInfo = getRank(user.totalXp);

  const renderAvatarIcon = (avatarName: string) => {
    const opt = AVATAR_OPTIONS.find((a) => a.id === avatarName);
    const Icon = opt ? opt.icon : Shield;
    return <Icon className="w-7 h-7" />;
  };

  const openEditModal = () => {
    setEditDisplayName(user.displayName);
    setEditBio(user.bio || "");
    setEditAvatar(user.avatar || "Shield");
    setEditError(null);
    setEditSuccess(false);
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    const res = await updateProfile({
      displayName: editDisplayName,
      bio: editBio,
      avatar: editAvatar,
    });
    if (res.success) {
      setEditSuccess(true);
      setTimeout(() => setIsEditing(false), 1200);
    } else {
      setEditError(res.error || "Gagal memperbarui profil.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPassError(data.error || "Gagal mengganti kata sandi.");
      } else {
        setPassSuccess(true);
        setCurrentPass("");
        setNewPass("");
        setTimeout(() => setIsChangingPass(false), 1200);
      }
    } catch {
      setPassError("Tidak dapat terhubung ke server.");
    }
  };

  return (
    <div className="min-h-screen py-8 space-y-8 max-w-5xl mx-auto font-mono">
      {/* Profile Header Banner */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] shadow-md">
              {renderAvatarIcon(user.avatar)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">
                  {user.displayName}
                </h1>
                <Badge
                  variant={user.role === "admin" ? "accent" : user.role === "moderator" ? "warning" : "default"}
                  size="sm"
                >
                  {user.role.toUpperCase()}
                </Badge>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                <span>@{user.username}</span>
                <span>•</span>
                <span>{user.email}</span>
              </div>
              {user.bio && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xl">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              onClick={openEditModal}
              variant="outline"
              size="sm"
              className="text-xs flex-1 md:flex-initial flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profil
            </Button>
            <Button
              onClick={() => {
                setIsChangingPass(true);
                setPassSuccess(false);
                setPassError(null);
              }}
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Ganti Sandi
            </Button>
            <Button
              onClick={() => logout()}
              variant="outline"
              size="sm"
              className="text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total XP & Rank */}
        <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>TOTAL SKOR &amp; RANK</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-[var(--color-text)]">
            {user.totalXp} <span className="text-xs font-normal text-amber-400">XP</span>
          </div>
          <div className={`text-xs font-bold ${rankInfo.color}`}>
            {rankInfo.title} ({rankInfo.rank})
          </div>
        </div>

        {/* Solved CTFs */}
        <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>CTF TERSERLESAIKAN</span>
            <Flag className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <div className="text-3xl font-bold text-[var(--color-text)]">
            {user.solvedChallenges?.length || 0}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            Tantangan Flag Terverifikasi
          </div>
        </div>

        {/* Badges Unlocked */}
        <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>LENCANA DIBUKA</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-[var(--color-text)]">
            {user.achievements?.length || 0}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            Pencapaian Akun Terdaftar
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" />
          Lencana Prestasi Terbuka ({user.achievements?.length || 0})
        </h2>

        {user.achievements && user.achievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.achievements.map((ach) => (
              <div
                key={ach.code}
                className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <Badge variant="success" size="sm">
                    Terbuka
                  </Badge>
                </div>
                <div className="font-bold text-sm text-[var(--color-text)]">{ach.title}</div>
                <div className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  {ach.description}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border-subtle)]">
                  Dibuka: {new Date(ach.unlocked_at).toLocaleDateString("id-ID")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center text-xs text-[var(--color-text-muted)]">
            Belum ada lencana yang dibuka. Selesaikan tantangan CTF atau daftarkan akun Anda!
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[var(--color-accent)]" />
                Edit Profil Akun
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs"
              >
                Tutup ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {editError && (
                <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Profil berhasil diperbarui!
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] block">Nama Tampilan</label>
                <Input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] block">Biografi Singkat</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Ceritakan latar belakang atau fokus cybersecurity Anda..."
                  className="w-full rounded-md bg-[var(--color-background)] border border-[var(--color-border)] p-2.5 text-xs text-[var(--color-text)] font-mono focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] block mb-2">Pilih Avatar Ikon</label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = editAvatar === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEditAvatar(opt.id)}
                        className={`p-3 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                          isSelected
                            ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)] text-[var(--color-accent)]"
                            : "bg-[var(--color-background)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] truncate w-full">{opt.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
                <Button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="sm"
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangingPass && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[var(--color-accent)]" />
                Ganti Kata Sandi
              </h3>
              <button
                onClick={() => setIsChangingPass(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs"
              >
                Tutup ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              {passError && (
                <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400">
                  {passError}
                </div>
              )}
              {passSuccess && (
                <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Kata sandi berhasil diperbarui!
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] block">Kata Sandi Saat Ini</label>
                <Input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="••••••••"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] block">Kata Sandi Baru (Min 8 Karakter)</label>
                <Input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="••••••••"
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
                <Button
                  type="button"
                  onClick={() => setIsChangingPass(false)}
                  variant="outline"
                  size="sm"
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Perbarui Sandi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
