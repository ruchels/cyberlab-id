"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  Terminal as TerminalIcon,
  BookOpen,
  Wrench,
  Trophy,
  ArrowRight,
  CheckCircle2,
  Lock,
  Network,
  Globe,
  Binary,
  Camera,
  Cpu,
  Search,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardBody, CardFooter, Badge, Button, Terminal, GithubIcon } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useLanguage();

  const terminalLines = [
    { type: "comment" as const, text: "Inisialisasi CyberLab-ID Platform v0.1" },
    { type: "command" as const, text: "./cyberlab --status-check" },
    {
      type: "success" as const,
      text: "[OK] 6 Jalur Kurikulum Siap: Linux, Jaringan, Web Security, Kripto, Forensik, Reverse Eng.",
    },
    {
      type: "success" as const,
      text: "[OK] 6 Client-Side Security Tools Aktif (Zero Data Exfiltration)",
    },
    {
      type: "output" as const,
      text: "Platform siap digunakan untuk komunitas edukasi keamanan digital Indonesia.",
    },
  ];

  const tracks = [
    {
      id: "linux",
      title: "Linux & System Admin",
      topics: 7,
      level: "Pemula",
      icon: TerminalIcon,
      desc: "Struktur berkas FHS, manajemen izin chmod/chown, proses background, dan hardening server.",
    },
    {
      id: "networking",
      title: "Computer Networking",
      topics: 8,
      level: "Pemula",
      icon: Network,
      desc: "Model OSI/TCP-IP, IPv4 & CIDR subnetting, DNS/DHCP, firewall rules, dan packet triage.",
    },
    {
      id: "web-security",
      title: "Web Security & OWASP",
      topics: 8,
      level: "Menengah",
      icon: Globe,
      desc: "Analisis HTTP/HTTPS, mitigasi SQL Injection, Cross-Site Scripting (XSS), IDOR, dan Security Headers.",
    },
    {
      id: "cryptography",
      title: "Cryptography",
      topics: 8,
      level: "Menengah",
      icon: Lock,
      desc: "Encoding vs Enkripsi vs Hash, Caesar & XOR ciphers, SHA-256, dan dasar matematika RSA.",
    },
    {
      id: "digital-forensics",
      title: "Digital Forensics",
      topics: 7,
      level: "Menengah",
      icon: Search,
      desc: "Identifikasi magic bytes, ekstraksi EXIF metadata gambar, dan penyelidikan file log sistem.",
    },
    {
      id: "reverse-engineering",
      title: "Reverse Engineering",
      topics: 6,
      level: "Mahir",
      icon: Cpu,
      desc: "Fondasi biner, instruksi assembly x86/x64, analisis statis strings, dan dekomposisi file PE/ELF.",
    },
  ];

  const featuredTools = [
    {
      id: "hash-inspector",
      title: "Hash Inspector",
      icon: Lock,
      desc: "Kalkulasi MD5, SHA-1, SHA-256, SHA-512 & komparator verifikasi integritas file.",
      badge: "Kriptografi",
      href: "/tools/hash-inspector",
    },
    {
      id: "subnet-calculator",
      title: "Subnet Calculator",
      icon: Network,
      desc: "Kalkulator presisi IPv4 & CIDR (/0 s.d /32) lengkap dengan visualisasi bit biner.",
      badge: "Jaringan",
      href: "/tools/subnet-calculator",
    },
    {
      id: "cipher-toolkit",
      title: "Cipher Toolkit",
      icon: Zap,
      desc: "Pemecah cipher Caesar (CTF brute force), ROT13, XOR bitwise, dan Base64 decode.",
      badge: "Kripto / CTF",
      href: "/tools/cipher-toolkit",
    },
    {
      id: "file-signature-checker",
      title: "File Signature Checker",
      icon: Binary,
      desc: "Analisis Magic Bytes header biner dan deteksi pemalsuan ekstensi file (spoofing).",
      badge: "Forensik",
      href: "/tools/file-signature-checker",
    },
  ];

  return (
    <div className="space-y-16 py-4">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-accent)]">
              <Shield className="w-3.5 h-3.5" />
              <span>{t.hero.badge}</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-[var(--color-text)] leading-tight">
                CyberLab<span className="text-[var(--color-accent)]">-ID</span>
              </h1>
              <p className="text-xl sm:text-2xl font-mono text-[var(--color-accent)] font-semibold">
                {t.hero.tagline}
              </p>
            </div>

            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
              {t.hero.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/learning">
                <Button size="lg" className="font-mono">
                  {t.hero.startLearning}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link href="/tools">
                <Button variant="secondary" size="lg" className="font-mono">
                  <Wrench className="w-4 h-4 mr-1" />
                  {t.hero.exploreTools}
                </Button>
              </Link>
              <a
                href="https://github.com/cyberlab-id/cyberlab-id"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="font-mono">
                  <GithubIcon className="w-4 h-4 mr-1" />
                  {t.hero.viewGitHub}
                </Button>
              </a>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap gap-4 pt-4 text-xs font-mono text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Bahasa Indonesia Primer
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zero-Leak Privacy Tools
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Lisensi Open-Source MIT
              </span>
            </div>
          </div>

          {/* Right Column: Terminal Demonstration */}
          <div className="lg:col-span-5">
            <Terminal
              title="cyberlab@id-terminal: ~"
              lines={terminalLines}
              className="cyber-glow"
            />
          </div>
        </div>
      </section>

      {/* 2. REAL STATS SECTION (Verified data, no fake marketing) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t.stats.modulesCount, desc: t.stats.modulesDesc },
          { label: t.stats.toolsCount, desc: t.stats.toolsDesc },
          { label: t.stats.challengesCount, desc: t.stats.challengesDesc },
          { label: t.stats.license, desc: t.stats.licenseDesc },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] space-y-1.5"
          >
            <div className="font-mono text-lg sm:text-xl font-bold text-[var(--color-accent)]">
              {stat.label}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {stat.desc}
            </p>
          </div>
        ))}
      </section>

      {/* 3. LEARNING TRACKS SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)] pb-4">
          <div>
            <div className="text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider">
              {t.paths.title}
            </div>
            <h2 className="text-2xl font-mono font-bold text-[var(--color-text)] mt-1">
              Jalur Pembelajaran Inti
            </h2>
          </div>
          <Link
            href="/learning"
            className="text-xs font-mono text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
          >
            <span>{t.paths.viewAll} (44 Topik)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => {
            const Icon = track.icon;
            return (
              <Card key={track.id} variant="interactive" className="flex flex-col justify-between">
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant="default">{track.level}</Badge>
                  </div>

                  <div>
                    <h3 className="font-mono text-sm font-bold text-[var(--color-text)]">
                      {track.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                      {track.desc}
                    </p>
                  </div>
                </CardBody>
                <CardFooter className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--color-text-muted)]">
                    {track.topics} {t.paths.topics} kurikulum
                  </span>
                  <Link
                    href="/learning"
                    className="text-[var(--color-accent)] font-bold hover:underline"
                  >
                    Buka Modul →
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 4. FEATURED TOOLS SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-border)] pb-4">
          <div>
            <div className="text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider">
              {t.toolsSection.title}
            </div>
            <h2 className="text-2xl font-mono font-bold text-[var(--color-text)] mt-1">
              Perkakas Analisis Keamanan Siber
            </h2>
          </div>
          <Link
            href="/tools"
            className="text-xs font-mono text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
          >
            <span>Buka Semua 6 Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.id} variant="interactive" className="flex flex-col justify-between">
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant="accent" size="sm">
                      {tool.badge}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-[var(--color-text)]">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                </CardBody>
                <CardFooter>
                  <Link
                    href={tool.href}
                    className="w-full inline-flex items-center justify-between text-xs font-mono text-[var(--color-accent)] font-bold hover:underline"
                  >
                    <span>{t.toolsSection.openTool}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 5. CTF PREVIEW BANNER */}
      <section className="p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400">
              <Trophy className="w-4 h-4" />
              <span>Capture The Flag (CTF) Practice Arena</span>
            </div>
            <h2 className="text-2xl font-mono font-bold text-[var(--color-text)]">
              Uji Kemampuan Anda dengan Tantangan Praktikum
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
              Tersedia tantangan kriptografi, decoding pesan tersembunyi, perhitungan subnetting, dan analisis header biner file dengan sistem validasi flag instan.
            </p>
          </div>
          <div className="md:col-span-4 flex justify-start md:justify-end">
            <Link href="/challenges">
              <Button size="lg" className="font-mono">
                <Trophy className="w-4 h-4 mr-2" />
                Mulai CTF Challenge
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. OPEN SOURCE CALL TO ACTION */}
      <section className="p-8 rounded-xl border border-[var(--color-border-subtle)] bg-[#070b12] text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] mx-auto">
          <GithubIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-mono font-bold text-[var(--color-text)]">
          Berkolaborasi Membangun CyberLab-ID
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
          Platform ini 100% open-source di bawah Lisensi MIT. Siapapun dipersilakan menyumbang materi kurikulum, melaporkan perbaikan, atau menambahkan tool analisis baru.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <a
            href="https://github.com/cyberlab-id/cyberlab-id"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="primary" className="font-mono">
              <GithubIcon className="w-4 h-4 mr-2" />
              Bintang &amp; Kontribusi di GitHub
            </Button>
          </a>
          <Link href="/docs">
            <Button variant="secondary" className="font-mono">
              Panduan Kontributor
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
