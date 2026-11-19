"use client";

import React from "react";
import Link from "next/link";
import {
  GitPullRequest,
  Code,
  Shield,
  Heart,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Lock,
  Terminal,
  FileCode,
  Users,
} from "lucide-react";
import { GithubIcon, Badge } from "@/components/ui";

export default function OpenSourceHubPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono">
            <GithubIcon className="w-4 h-4" />
            <span>CyberLab-ID Open-Source Hub</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Berkolaborasi & <span className="text-[var(--color-accent)]">Membangun Ekosistem Terbuka</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-3xl leading-relaxed">
            CyberLab-ID adalah proyek nirlaba open-source yang didedikasikan untuk literasi dan keterampilan cybersecurity praktis di Indonesia. Seluruh materi, simulator, dan kode sumber terbuka untuk dipelajari, diaudit, dan dikembangkan bersama.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="https://github.com/cyberlab-id/cyberlab-id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-accent)] text-black font-mono font-bold text-xs hover:opacity-90 transition-opacity"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Kunjungi GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/contributors"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-accent)] font-mono font-bold text-xs transition-colors"
            >
              <GitPullRequest className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Portal Kontributor</span>
            </Link>
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[#0d121f] space-y-2">
            <span className="text-[10px] font-mono uppercase text-[var(--color-accent)] font-bold">
              LISENSI
            </span>
            <h4 className="font-bold text-base text-white">MIT License</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Bebas digunakan untuk institusi pendidikan, sekolah, universitas, maupun riset independen.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[#0d121f] space-y-2">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
              ETIKA SIBER
            </span>
            <h4 className="font-bold text-base text-white">Defensive First</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Materi diarahkan murni untuk edukasi proteksi, audit legal, dan pemahaman ancaman digital.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[#0d121f] space-y-2">
            <span className="text-[10px] font-mono uppercase text-blue-400 font-bold">
              MODULAR
            </span>
            <h4 className="font-bold text-base text-white">Extensible Labs</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Tiap modul dan simulator dibuat modular berbasis TypeScript dan isolated containers.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[#0d121f] space-y-2">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
              PRIVASI
            </span>
            <h4 className="font-bold text-base text-white">Zero Data Exfil</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Tools interaktif berjalan di browser klien tanpa pengiriman data sensitif ke server.
            </p>
          </div>
        </div>

        {/* Quick Clone & Contribution Guide */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <Terminal className="w-6 h-6 text-[var(--color-accent)]" />
            <span>Memulai Kontribusi Kode Lokal</span>
          </h2>

          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[#0c101c] space-y-4 font-mono text-xs">
            <p className="text-[var(--color-text-secondary)]">
              Siapkan lingkungan pengembangan lokal Anda dalam 4 langkah mudah:
            </p>
            <div className="space-y-2 bg-black/60 p-4 rounded-xl border border-[var(--color-border)] overflow-x-auto text-[var(--color-text)]">
              <div className="text-[var(--color-text-muted)]"># 1. Clone repository CyberLab-ID</div>
              <div>git clone https://github.com/cyberlab-id/cyberlab-id.git</div>
              <div>cd cyberlab-id/website</div>
              <div className="text-[var(--color-text-muted)] pt-2"># 2. Install dependencies</div>
              <div>npm install</div>
              <div className="text-[var(--color-text-muted)] pt-2"># 3. Jalankan automated test suite</div>
              <div>node ../test_phase6.mjs</div>
              <div className="text-[var(--color-text-muted)] pt-2"># 4. Jalankan local dev server</div>
              <div>npm run dev</div>
            </div>
          </div>
        </div>

        {/* Code of Conduct & Security Disclosure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[#0d121f] space-y-4">
            <h3 className="font-mono text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Kode Etik Kontributor</span>
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Kami berkomitmen membangun lingkungan komunitas yang ramah, inklusif, dan bebas pelecehan untuk semua orang, tanpa memandang latar belakang keahlian atau identitas.
            </p>
            <ul className="space-y-2 font-mono text-xs text-[var(--color-text-muted)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Gunakan bahasa yang menghargai dan ramah pemula.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Terima kritik teknis yang membangun dengan lapang dada.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Fokus pada kebaikan bersama komunitas siber Indonesia.</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[#0d121f] space-y-4">
            <h3 className="font-mono text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-400" />
              <span>Responsible Vulnerability Disclosure</span>
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Jika Anda menemukan potensi celah keamanan di platform CyberLab-ID, harap laporkan secara bertanggung jawab ke tim pengembang sebelum publikasi publik.
            </p>
            <div className="p-3 rounded-lg bg-black/40 border border-[var(--color-border)] font-mono text-xs space-y-1">
              <span className="text-[var(--color-text-muted)] block">Email Pelaporan Keamanan:</span>
              <span className="text-[var(--color-accent)] font-bold">security@cyberlab.id</span>
              <span className="text-[10px] text-[var(--color-text-muted)] block pt-1">
                Kunci PGP tersedia di repository untuk komunikasi terenkripsi.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
