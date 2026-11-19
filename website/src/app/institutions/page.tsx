"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  GraduationCap,
  Shield,
  Users,
  Award,
  BookOpen,
  ArrowRight,
  PlusCircle,
  Search,
  CheckCircle2,
  Sparkles,
  Lock,
  Globe,
  Activity,
  Layers,
  FileText,
  Server,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

interface Institution {
  id: string;
  slug: string;
  name: string;
  org_type: string;
  description: string;
  logo_url: string;
  brand_color: string;
  website_url: string;
  plan_tier: string;
  is_verified: number;
  member_count: number;
  course_count: number;
}

export default function InstitutionsDirectoryPage() {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [myInstitutions, setMyInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regForm, setRegForm] = useState({
    name: "",
    slug: "",
    org_type: "university",
    description: "",
    website_url: "",
    contact_email: "",
    brand_color: "#00ff9d",
    welcome_message: "",
  });
  const [regMessage, setRegMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/institutions");
      if (res.ok) {
        const data = await res.json();
        setInstitutions(data.institutions || []);
      }

      if (user) {
        const myRes = await fetch("/api/institutions?my=true");
        if (myRes.ok) {
          const myData = await myRes.json();
          setMyInstitutions(myData.institutions || []);
        }
      }
    } catch (err) {
      console.error("Failed to load institutions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, [user]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.slug) return;
    setSubmitting(true);
    setRegMessage(null);

    try {
      const res = await fetch("/api/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mendaftarkan institusi");

      setRegMessage({ type: "success", text: "Institusi berhasil didaftarkan! Mengalihkan ke portal institusi..." });
      setTimeout(() => {
        window.location.href = `/institutions/${data.institution.slug}`;
      }, 1200);
    } catch (err: any) {
      setRegMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInstitutions = institutions.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.description.toLowerCase().includes(search.toLowerCase()) ||
      inst.slug.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || inst.org_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case "university":
        return "Universitas / Perguruan Tinggi";
      case "vocational_school":
        return "SMK / Vokasi";
      case "high_school":
        return "SMA / MA";
      case "training_center":
        return "Pusat Pelatihan / Kursus";
      case "corporate":
        return "Corporate Security Dept";
      default:
        return "Komunitas Edukasi";
    }
  };

  return (
    <div className="space-y-12 py-6 max-w-7xl mx-auto">
      {/* Enterprise Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#101623] to-[#090d16] border border-[var(--color-border)] p-8 sm:p-12">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)]">
            <Building2 className="w-3.5 h-3.5" />
            CyberLab-ID Enterprise & Institutional Edition
          </div>
          <h1 className="text-3xl sm:text-5xl font-mono font-bold tracking-tight text-[var(--color-text)]">
            Platform Keamanan Siber Terpadu untuk Institusi Pendidikan & Vokasi
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            Hadirkan kurikulum hands-on bertaraf industri, laboratorium Cyber Range virtual terisolasi,
            asesmen ujian CTF tertutup, dan penerbitan sertifikat kompetensi berverifikasi digital untuk universitas,
            SMK TKJ/RPL, dan akademi keamanan siber Anda.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {user ? (
              <Button
                variant="accent"
                onClick={() => setShowRegisterModal(true)}
                className="flex items-center gap-2 font-mono text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Daftarkan Institusi Baru
              </Button>
            ) : (
              <Link href="/auth/login">
                <Button variant="accent" className="flex items-center gap-2 font-mono text-sm">
                  <Lock className="w-4 h-4" />
                  Masuk untuk Mendaftarkan Institusi
                </Button>
              </Link>
            )}
            <Link href="#directory">
              <Button variant="secondary" className="flex items-center gap-2 font-mono text-sm">
                Jelajahi Direktori Institusi
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Enterprise Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[var(--color-text)] font-mono">Multi-Tenant Terisolasi</h3>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Setiap institusi memiliki workspace terpisah dengan proteksi akses tingkat server (Anti-IDOR). Data mahasiswa, nilai tugas, dan soal ujian aman dari tenant lain.
          </p>
        </Card>

        <Card className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[var(--color-text)] font-mono">Cyber Range Virtual Khusus</h3>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Tugaskan laboratorium virtual (Linux hardening, topologi jaringan, web vulnerability) ke kelas/kohort tertentu dengan alokasi resource CPU & RAM otomatis.
          </p>
        </Card>

        <Card className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[var(--color-text)] font-mono">Sertifikat Digital SHA-256</h3>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Terbitkan kredensial kelulusan internal berverifikasi kriptografis. Siswa dapat menyematkan tautan verifikasi publik untuk portofolio karier tanpa risiko pemalsuan.
          </p>
        </Card>
      </div>

      {/* My Enrolled / Managed Institutions Section (if user logged in) */}
      {user && myInstitutions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="text-xl font-bold font-mono text-[var(--color-text)]">
              Institusi Saya ({myInstitutions.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myInstitutions.map((inst) => (
              <Card
                key={inst.id}
                className="bg-[#0d121f] border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)] uppercase">
                      {inst.my_role}
                    </span>
                    <Badge variant="accent" size="sm">
                      {inst.plan_tier.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--color-text)] line-clamp-1">{inst.name}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mt-1">{inst.description}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--color-text-muted)]">/{inst.slug}</span>
                  <Link href={`/institutions/${inst.slug}`}>
                    <Button variant="secondary" size="sm" className="font-mono text-xs flex items-center gap-1">
                      Buka Portal <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Directory Section */}
      <div id="directory" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-mono text-[var(--color-text)]">
              Direktori Institusi & Mitra Pendidikan
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] font-mono mt-1">
              Universitas, sekolah kejuruan, dan pusat riset yang menggunakan ekosistem CyberLab-ID.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Cari nama institusi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-mono"
            >
              <option value="all">Semua Tipe</option>
              <option value="university">Universitas</option>
              <option value="vocational_school">SMK / Vokasi</option>
              <option value="high_school">SMA / MA</option>
              <option value="training_center">Training Center</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-[var(--color-text-muted)]">
            Memuat direktori institusi...
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-[var(--color-border)] space-y-2">
            <Building2 className="w-8 h-8 mx-auto text-[var(--color-text-muted)]" />
            <p className="text-sm font-mono text-[var(--color-text-secondary)]">Tidak ada institusi yang cocok</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstitutions.map((inst) => (
              <Card
                key={inst.id}
                className="bg-[#0d121f] border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-all p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] font-bold text-lg font-mono">
                      {inst.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-cyan-400 border border-[var(--color-border)]">
                        {getOrgTypeLabel(inst.org_type)}
                      </span>
                      {inst.is_verified === 1 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[var(--color-text)] line-clamp-1">{inst.name}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3 mt-1.5 leading-relaxed">
                      {inst.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                    <div className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-center">
                      <span className="block text-[10px] text-[var(--color-text-muted)]">Anggota</span>
                      <strong className="text-[var(--color-text)] font-bold">{inst.member_count}</strong>
                    </div>
                    <div className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-center">
                      <span className="block text-[10px] text-[var(--color-text-muted)]">Kursus LMS</span>
                      <strong className="text-[var(--color-accent)] font-bold">{inst.course_count}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--color-text-muted)] truncate max-w-[130px]">
                    /{inst.slug}
                  </span>
                  <Link href={`/institutions/${inst.slug}`}>
                    <Button variant="secondary" size="sm" className="font-mono text-xs flex items-center gap-1.5">
                      Lihat Portal <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0d121f] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold font-mono text-[var(--color-text)]">
                  Daftarkan Institusi / Sekolah Anda
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] font-mono mt-1">
                  Buat workspace tenant terisolasi untuk universitas, sekolah kejuruan, atau akademi Anda.
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-zinc-500 hover:text-white font-mono text-lg"
              >
                ✕
              </button>
            </div>

            {regMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-mono ${
                  regMessage.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}
              >
                {regMessage.text}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Nama Resmi Institusi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Politeknik Negeri Jakarta - Cyber Defense Center"
                  value={regForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "-")
                      .replace(/-+/g, "-");
                    setRegForm({ ...regForm, name, slug: autoSlug.slice(0, 30) });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[var(--color-text-secondary)]">URL Slug *</label>
                  <div className="flex items-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 text-xs text-[var(--color-text-muted)]">
                    <span>/institutions/</span>
                    <input
                      type="text"
                      required
                      placeholder="pnj-cyber"
                      value={regForm.slug}
                      onChange={(e) => setRegForm({ ...regForm, slug: e.target.value })}
                      className="w-full py-2 bg-transparent text-[var(--color-accent)] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[var(--color-text-secondary)]">Tipe Institusi *</label>
                  <select
                    value={regForm.org_type}
                    onChange={(e) => setRegForm({ ...regForm, org_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-mono"
                  >
                    <option value="university">Universitas / Perguruan Tinggi</option>
                    <option value="vocational_school">SMK / Politeknik Vokasi</option>
                    <option value="high_school">SMA / MA</option>
                    <option value="training_center">Pusat Pelatihan Profesional</option>
                    <option value="corporate">Perusahaan / SOC Internal</option>
                    <option value="community">Komunitas Edukasi Terverifikasi</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Deskripsi Profil</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan fokus studi, laboratorium keamanan, dan program yang diselenggarakan..."
                  value={regForm.description}
                  onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[var(--color-text-secondary)]">Situs Web Resmi</label>
                  <input
                    type="url"
                    placeholder="https://pnj.ac.id"
                    value={regForm.website_url}
                    onChange={(e) => setRegForm({ ...regForm, website_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[var(--color-text-secondary)]">Warna Brand Utama</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={regForm.brand_color}
                      onChange={(e) => setRegForm({ ...regForm, brand_color: e.target.value })}
                      className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={regForm.brand_color}
                      onChange={(e) => setRegForm({ ...regForm, brand_color: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowRegisterModal(false)}
                  className="font-mono text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={submitting}
                  className="font-mono text-xs"
                >
                  {submitting ? "Mendaftarkan..." : "Daftarkan Sekarang"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
