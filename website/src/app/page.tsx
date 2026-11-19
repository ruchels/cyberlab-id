"use client";

import React, { useState } from "react";
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
  Cpu,
  Search,
  Zap,
  Radio,
  Share2,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Layers,
  Activity,
} from "lucide-react";
import {
  Card,
  CardBody,
  CardFooter,
  Badge,
  Button,
  Terminal,
  GithubIcon,
  CyberActivityIndicator,
  SecurityRadar,
  DigitalNetworkVisualizer,
} from "@/components/ui";
import { useLanguage } from "@/lib/i18n";
import { useSound } from "@/lib/sound-context";

export default function HomePage() {
  const { t } = useLanguage();
  const { playTab, playClick } = useSound();
  const [heroTab, setHeroTab] = useState<"terminal" | "radar" | "network">("terminal");

  const terminalLines = [
    { type: "comment" as const, text: "Inisialisasi CyberLab-ID Platform v2.10 (Full Ecosystem)" },
    { type: "command" as const, text: "./cyberlab --status-check --ecosystem-full" },
    {
      type: "success" as const,
      text: "[OK] 6 Jalur Kurikulum & 44 Topik Siap (Linux, Net, Web, Kripto, Forensik, RE)",
    },
    {
      type: "success" as const,
      text: "[OK] Cyber Range Sandbox & Client-Side Security Tools Aktif",
    },
    {
      type: "success" as const,
      text: "[OK] Blue Team SOC Defense Grid & Threat Intel Operational",
    },
    {
      type: "output" as const,
      text: "Ekosistem siap digunakan untuk komunitas, pelajar, dan institusi keamanan siber Indonesia.",
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

  const pillarCards = [
    {
      title: "Cyber Defense & SOC",
      subtitle: "Blue Team Operations",
      desc: "Simulasi triage alert keamanan, incident response, digital forensics dengan SHA-256 evidence hashing, dan threat intelligence.",
      href: "/soc",
      icon: ShieldAlert,
      tag: "Blue Team",
      color: "border-cyan-500/30 text-cyan-400 bg-cyan-950/20",
    },
    {
      title: "Virtual Cyber Range",
      subtitle: "Hands-on Practical Labs",
      desc: "Lingkungan virtual terisolasi untuk menguji eksploitasi web, analisis malware terkontrol, dan network pivoting.",
      href: "/range",
      icon: Activity,
      tag: "Range",
      color: "border-emerald-500/30 text-emerald-400 bg-emerald-950/20",
    },
    {
      title: "AI Security Tutor",
      subtitle: "Personalized Intelligence",
      desc: "Bimbingan AI kontekstual untuk membedah konsep keamanan sulit, analisis code review, dan kuis adaptif.",
      href: "/assistant",
      icon: Sparkles,
      tag: "AI Powered",
      color: "border-indigo-500/30 text-indigo-400 bg-indigo-950/20",
    },
    {
      title: "Institutional Edition",
      subtitle: "Enterprise & Campus LMS",
      desc: "Multi-tenant portal untuk perguruan tinggi dan institusi pelatihan mengelola lab kelas, asesmen, dan sertifikat digital.",
      href: "/institutions",
      icon: GraduationCap,
      tag: "Multi-Tenant",
      color: "border-amber-500/30 text-amber-400 bg-amber-950/20",
    },
  ];

  return (
    <div className="space-y-20 py-4">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Indicator Pill */}
            <div className="flex items-center gap-3">
              <CyberActivityIndicator />
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-mono font-extrabold tracking-tight text-[var(--color-text)] leading-tight">
                CyberLab<span className="text-cyan-400">-ID</span>
              </h1>
              <p className="text-xl sm:text-2xl font-mono text-cyan-300 font-semibold flex items-center gap-2">
                <span>{t.hero.tagline}</span>
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Platform dan ekosistem terbuka untuk mempelajari, mempraktikkan, dan menguasai keamanan siber berstandar industri. Dari dasar sistem operasi hingga Blue Team Security Operations Center (SOC).
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/learning">
                <Button size="lg" variant="cyan" className="font-mono">
                  {t.hero.startLearning}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/soc">
                <Button variant="secondary" size="lg" className="font-mono border-cyan-800/50 hover:border-cyan-400 text-cyan-300">
                  <ShieldAlert className="w-4 h-4 mr-1.5 text-cyan-400" />
                  SOC Workspace
                </Button>
              </Link>
              <Link href="/tools">
                <Button variant="outline" size="lg" className="font-mono">
                  <Wrench className="w-4 h-4 mr-1.5 text-slate-300" />
                  {t.hero.exploreTools}
                </Button>
              </Link>
              <a
                href="https://github.com/cyberlab-id/cyberlab-id"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="lg" className="font-mono text-slate-400 hover:text-slate-100">
                  <GithubIcon className="w-4 h-4 mr-1.5" />
                  GitHub
                </Button>
              </a>
            </div>

            {/* Verification Features Badges */}
            <div className="flex flex-wrap gap-4 pt-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Kurikulum Bilingual Primer
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zero-Leak Privacy Sandbox
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                Lisensi Open-Source MIT
              </span>
            </div>
          </div>

          {/* Right Column: Multi-Mode Cyber Console Centerpiece */}
          <div className="lg:col-span-5 space-y-3">
            {/* View Mode Tabs */}
            <div className="flex items-center justify-between p-1 rounded-lg bg-[#0b101c]/90 border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setHeroTab("terminal");
                    playTab();
                  }}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    heroTab === "terminal"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Terminal</span>
                </button>
                <button
                  onClick={() => {
                    setHeroTab("radar");
                    playTab();
                  }}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    heroTab === "radar"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Radar SOC</span>
                </button>
                <button
                  onClick={() => {
                    setHeroTab("network");
                    playTab();
                  }}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    heroTab === "network"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>Topologi</span>
                </button>
              </div>

              <span className="text-[10px] text-slate-500 pr-2 hidden sm:inline">
                INTERACTIVE
              </span>
            </div>

            {/* Display Pane */}
            <div className="relative min-h-[310px] flex items-center justify-center">
              {heroTab === "terminal" && (
                <Terminal
                  title="cyberlab@id-command: ~"
                  lines={terminalLines}
                  className="w-full cyber-glow-cyan"
                />
              )}

              {heroTab === "radar" && (
                <div className="w-full flex flex-col items-center justify-center p-6 rounded-xl border border-slate-800 bg-[#090e1a]/90 backdrop-blur-md cyber-glow-cyan">
                  <SecurityRadar size="md" threatLevel="nominal" />
                  <p className="text-[11px] font-mono text-slate-400 mt-4 text-center">
                    Simulasi Radar Pertahanan 360° // Monitoring Node DMZ & Honeypot Sensor
                  </p>
                </div>
              )}

              {heroTab === "network" && (
                <div className="w-full cyber-glow-cyan">
                  <DigitalNetworkVisualizer />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL STATS SECTION */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t.stats.modulesCount, desc: t.stats.modulesDesc, badge: "Kurikulum" },
          { label: t.stats.toolsCount, desc: t.stats.toolsDesc, badge: "Client-Side" },
          { label: t.stats.challengesCount, desc: t.stats.challengesDesc, badge: "Praktikum" },
          { label: t.stats.license, desc: t.stats.licenseDesc, badge: "Open Source" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl border border-slate-800 bg-[#0c1324]/80 backdrop-blur-sm space-y-2 hover:border-cyan-500/40 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                {stat.badge}
              </span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-slate-100">
              {stat.label}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {stat.desc}
            </p>
          </div>
        ))}
      </section>

      {/* 3. FOUR CORE PLATFORM PILLARS */}
      <section className="space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
            Ekosistem Komprehensif
          </div>
          <h2 className="text-2xl font-mono font-bold text-slate-100 mt-1">
            Pilar Utama CyberLab-ID
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillarCards.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <Link key={idx} href={pillar.href} className="group">
                <Card variant="interactive" className="h-full flex flex-col justify-between border-slate-800/90 bg-[#0d1426]/90">
                  <CardBody className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg border ${pillar.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="accent" size="sm">
                        {pillar.tag}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-mono text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {pillar.title}
                      </h3>
                      <p className="text-xs font-mono text-cyan-400/90 mt-0.5">
                        {pillar.subtitle}
                      </p>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </CardBody>
                  <CardFooter className="flex items-center justify-between text-xs font-mono text-cyan-400 group-hover:text-cyan-300">
                    <span>Eksplorasi Modul</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. LEARNING TRACKS SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              {t.paths.title}
            </div>
            <h2 className="text-2xl font-mono font-bold text-slate-100 mt-1">
              Jalur Pembelajaran Inti
            </h2>
          </div>
          <Link
            href="/learning"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline inline-flex items-center gap-1.5"
          >
            <span>{t.paths.viewAll} (44 Topik Kurikulum)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => {
            const Icon = track.icon;
            return (
              <Card key={track.id} variant="interactive" className="flex flex-col justify-between border-slate-800 bg-[#0d1426]/90">
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant="default">{track.level}</Badge>
                  </div>

                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-100">
                      {track.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {track.desc}
                    </p>
                  </div>
                </CardBody>
                <CardFooter className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">
                    {track.topics} {t.paths.topics} terstruktur
                  </span>
                  <Link
                    href={`/learning`}
                    className="text-cyan-400 font-bold hover:text-cyan-300 hover:underline"
                  >
                    Buka Modul →
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 5. FEATURED TOOLS SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              {t.toolsSection.title}
            </div>
            <h2 className="text-2xl font-mono font-bold text-slate-100 mt-1">
              Perkakas Analisis Keamanan Siber
            </h2>
          </div>
          <Link
            href="/tools"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline inline-flex items-center gap-1.5"
          >
            <span>Buka Semua 6 Tools Analisis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.id} variant="interactive" className="flex flex-col justify-between border-slate-800 bg-[#0d1426]/90">
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant="accent" size="sm">
                      {tool.badge}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-100">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                </CardBody>
                <CardFooter>
                  <Link
                    href={tool.href}
                    className="w-full inline-flex items-center justify-between text-xs font-mono text-cyan-400 font-bold hover:underline"
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

      {/* 6. CTF PREVIEW BANNER */}
      <section className="p-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d1426] via-[#101b33] to-[#0d1426] relative overflow-hidden shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          <div className="md:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-800/40">
              <Trophy className="w-4 h-4" />
              <span>Capture The Flag (CTF) Practice Arena</span>
            </div>
            <h2 className="text-2xl font-mono font-bold text-slate-100">
              Uji Kemampuan Anda dengan Tantangan Praktikum &amp; CTF
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Tersedia tantangan kriptografi, decoding pesan tersembunyi, perhitungan subnetting, dan analisis header biner file dengan sistem validasi flag instan &amp; XP leaderboard.
            </p>
          </div>
          <div className="md:col-span-4 flex justify-start md:justify-end gap-3">
            <Link href="/challenges">
              <Button size="lg" variant="cyan" className="font-mono">
                <Trophy className="w-4 h-4 mr-2" />
                Mulai CTF
              </Button>
            </Link>
            <Link href="/arena">
              <Button size="lg" variant="secondary" className="font-mono border-slate-700">
                Arena Tim
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. OPEN SOURCE CALL TO ACTION */}
      <section className="p-8 rounded-2xl border border-slate-800 bg-[#090e1c] text-center space-y-4 shadow-lg">
        <div className="w-12 h-12 rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <GithubIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-mono font-bold text-slate-100">
          Berkolaborasi Membangun Ekosistem CyberLab-ID
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Platform ini 100% open-source di bawah Lisensi MIT. Siapapun dipersilakan menyumbang materi kurikulum, melaporkan bug keamanan, atau menambahkan tool analisis baru.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <a
            href="https://github.com/cyberlab-id/cyberlab-id"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="cyan" className="font-mono">
              <GithubIcon className="w-4 h-4 mr-2" />
              Bintang &amp; Kontribusi di GitHub
            </Button>
          </a>
          <Link href="/contributors">
            <Button variant="secondary" className="font-mono border-slate-700">
              Hub Kontributor
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline" className="font-mono">
              Dokumentasi
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
