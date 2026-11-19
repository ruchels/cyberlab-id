"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import {
  Globe,
  GraduationCap,
  Building2,
  Users,
  Compass,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Send,
  PlusCircle,
  FileCheck,
  Search,
  Filter,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Partner {
  id: string;
  organization_name: string;
  org_type: string;
  country: string;
  city: string;
  website_url: string;
  logo_url: string;
  description: string;
  collaboration_categories: string[];
  contact_name?: string;
  contact_email?: string;
}

export default function PartnershipsPage() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Form State
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("university");
  const [country, setCountry] = useState("ID");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [proposedCollaboration, setProposedCollaboration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
  }, [selectedType]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const url = selectedType !== "all" ? `/api/partnerships?type=${selectedType}` : "/api/partnerships";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPartners(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const res = await fetch("/api/partnerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          orgType,
          country,
          websiteUrl,
          contactName,
          contactEmail,
          proposedCollaboration,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitMessage("Pengajuan kemitraan berhasil dikirimkan! Tim pengelola akan meninjau dokumen proposal Anda.");
        setOrgName("");
        setWebsiteUrl("");
        setContactName("");
        setContactEmail("");
        setProposedCollaboration("");
        setTimeout(() => {
          setShowApplyModal(false);
          setSubmitMessage(null);
        }, 3000);
      } else {
        alert(data.error || "Gagal mengirim pengajuan kemitraan.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case "university":
        return "Universitas / Perguruan Tinggi";
      case "vocational_school":
        return "SMK / Vokasi";
      case "community":
        return "Komunitas Praktisi";
      case "research_org":
        return "Lembaga Riset";
      case "tech_edu":
        return "Organisasi Edukasi Teknologi";
      case "open_source":
        return "Komunitas Open Source";
      default:
        return "Institusi Kolaboratif";
    }
  };

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#101623] to-[#090d16] border border-[var(--color-border)] p-8 sm:p-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Globe className="w-3.5 h-3.5" />
            Jaringan Kemitraan Global & Komunitas Siber
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--color-text)]">
            Institutional & Community <span className="text-[var(--color-accent)]">Partnerships</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            CyberLab-ID berkolaborasi dengan perguruan tinggi, sekolah vokasi, komunitas praktisi keamanan siber, dan lembaga riset internasional untuk memajukan talenta digital terbuka, kurikulum berstandar industri, dan kompetisi CTF regional.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setShowApplyModal(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Ajukan Kemitraan Institusi
            </Button>
            <Link href="/developers">
              <Button variant="outline">
                <FileCheck className="w-4 h-4 mr-2" />
                Developer Public API
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSelectedType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
              selectedType === "all"
                ? "bg-[var(--color-accent)] text-black font-bold"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-white"
            }`}
          >
            Semua ({partners.length})
          </button>
          <button
            onClick={() => setSelectedType("university")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
              selectedType === "university"
                ? "bg-[var(--color-accent)] text-black font-bold"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-white"
            }`}
          >
            Universitas
          </button>
          <button
            onClick={() => setSelectedType("community")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
              selectedType === "community"
                ? "bg-[var(--color-accent)] text-black font-bold"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-white"
            }`}
          >
            Komunitas
          </button>
          <button
            onClick={() => setSelectedType("research_org")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
              selectedType === "research_org"
                ? "bg-[var(--color-accent)] text-black font-bold"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-white"
            }`}
          >
            Lembaga Riset
          </button>
          <button
            onClick={() => setSelectedType("open_source")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
              selectedType === "open_source"
                ? "bg-[var(--color-accent)] text-black font-bold"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-white"
            }`}
          >
            Open Source
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--color-text-muted)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari organisasi atau negara..."
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Partners Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm font-mono text-[var(--color-text-muted)]">
          Memuat direktori mitra resmi CyberLab-ID...
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8">
          Tidak ada mitra yang cocok dengan filter pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((p) => (
            <Card key={p.id} className="bg-[var(--color-surface)] border-[var(--color-border)] hover:border-cyan-500/40 transition-colors flex flex-col justify-between p-5">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] shrink-0">
                      {p.org_type === "university" ? (
                        <GraduationCap className="w-5 h-5 text-indigo-400" />
                      ) : p.org_type === "research_org" ? (
                        <Compass className="w-5 h-5 text-amber-400" />
                      ) : p.org_type === "open_source" ? (
                        <Building2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Users className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-text)] leading-snug">
                        {p.organization_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--color-text-muted)] font-mono">
                        <span className="uppercase text-cyan-400 font-bold">{p.country}</span>
                        {p.city && <span>· {p.city}</span>}
                      </div>
                    </div>
                  </div>
                  <Badge variant="accent" size="sm" className="shrink-0 text-[10px]">
                    Verified
                  </Badge>
                </div>

                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                  {p.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.collaboration_categories?.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] uppercase"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  {getOrgTypeLabel(p.org_type)}
                </span>
                {p.website_url && (
                  <a
                    href={p.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline text-[11px] font-mono"
                  >
                    Kunjungi <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Partnership Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--color-accent)]" />
                  Pengajuan Kemitraan Komunitas & Institusi
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Lengkapi profil organisasi Anda untuk kolaborasi akademik, turnamen CTF, atau riset keamanan siber.
                </p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-[var(--color-text-muted)] hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            {submitMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-mono">
                ✓ {submitMessage}
              </div>
            )}

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[var(--color-text-secondary)] mb-1">
                    Nama Institusi / Organisasi *
                  </label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="cth: Universitas Negeri Siber / Komunitas HackSec"
                    required
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[var(--color-text-secondary)] mb-1">
                    Jenis Organisasi *
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-3 py-2 text-xs text-[var(--color-text)]"
                  >
                    <option value="university">Universitas / Perguruan Tinggi</option>
                    <option value="vocational_school">SMK / Sekolah Vokasi</option>
                    <option value="community">Komunitas Keamanan Siber</option>
                    <option value="research_org">Lembaga Riset / Lab Akademik</option>
                    <option value="tech_edu">Organisasi Pendidikan Teknologi</option>
                    <option value="open_source">Komunitas Open Source</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[var(--color-text-secondary)] mb-1">
                    Negara (Kode ISO, cth: ID, SG, MY) *
                  </label>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value.toUpperCase())}
                    placeholder="ID"
                    maxLength={2}
                    required
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[var(--color-text-secondary)] mb-1">
                    Situs Web Resmi Organisasi *
                  </label>
                  <Input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://kampus.ac.id"
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[var(--color-text-secondary)] mb-1">
                    Nama Narahubung Resmi *
                  </label>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nama Lengkap Penanggung Jawab"
                    required
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[var(--color-text-secondary)] mb-1">
                    Alamat Email Narahubung *
                  </label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@organisasi.org"
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[var(--color-text-secondary)] mb-1">
                  Bentuk Kolaborasi yang Diajukan *
                </label>
                <textarea
                  value={proposedCollaboration}
                  onChange={(e) => setProposedCollaboration(e.target.value)}
                  rows={4}
                  placeholder="Jelaskan rencana kolaborasi: kurikulum praktikum siber bersama, turnamen CTF mahasiswa, seminar riset, atau kontribusi materi edukasi..."
                  required
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-[11px] leading-relaxed">
                <strong>Kebijakan Integritas:</strong> CyberLab-ID tidak pernah mencantumkan nama institusi tanpa persetujuan formal dan verifikasi perwakilan resmi. Pengajuan kemitraan akan diverifikasi secara teliti oleh administrator sebelum diterbitkan secara publik.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowApplyModal(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  <Send className="w-3.5 h-3.5 mr-1" />
                  {submitting ? "Mengirim..." : "Kirim Pengajuan Kemitraan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
