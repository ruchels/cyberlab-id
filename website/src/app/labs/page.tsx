"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import {
  FlaskConical,
  Terminal,
  Network,
  Globe,
  KeyRound,
  Binary,
  Cpu,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  LinuxCliLab,
  NetworkPacketLab,
  WebVulnLab,
  CryptoChallengesLab,
  FileForensicsLab,
  ReverseEngineeringLab,
} from "@/components/labs";
import { useProgress } from "@/lib/progress";

interface LabMeta {
  id: string;
  badgeId: string;
  title: string;
  category: string;
  difficulty: "Dasar" | "Menengah";
  icon: React.ElementType;
  description: string;
}

const LABS_LIST: LabMeta[] = [
  {
    id: "linux-cli-lab",
    badgeId: "terminal-initiate",
    title: "Linux Command Line Fundamentals",
    category: "System Administration",
    difficulty: "Dasar",
    icon: Terminal,
    description: "Navigasi direktori, manipulasi berkas, inspeksi permissions (chmod), dan eksekusi skrip Bash.",
  },
  {
    id: "network-packet-lab",
    badgeId: "packet-detective",
    title: "Network Packet Analysis & Sniffing",
    category: "Networking & Protocols",
    difficulty: "Dasar",
    icon: Network,
    description: "Inspeksi alur paket Wireshark-like, analisis protokol HTTP/DNS, dan pembongkaran kredensial plain text.",
  },
  {
    id: "web-vuln-lab",
    badgeId: "web-defender",
    title: "Web Vulnerability Identification (SQLi & XSS)",
    category: "Web Application Security",
    difficulty: "Menengah",
    icon: Globe,
    description: "Eksploitasi sandbox SQL Injection auth bypass dan XSS payload, dilengkapi mitigasi kode aman.",
  },
  {
    id: "crypto-challenges-lab",
    badgeId: "cipher-breaker",
    title: "Cryptography & Multi-Stage Decoding",
    category: "Applied Cryptography",
    difficulty: "Menengah",
    icon: KeyRound,
    description: "Rantai dekripsi bertahap: identifikasi Base64 encoding diikuti single-byte XOR brute-force.",
  },
  {
    id: "file-forensics-lab",
    badgeId: "forensic-sleuth",
    title: "Digital File Forensics & Header Repair",
    category: "Digital Forensics",
    difficulty: "Menengah",
    icon: Binary,
    description: "Rekonstruksi byte header gambar PNG yang dirusak oleh teknik anti-forensik.",
  },
  {
    id: "reverse-engineering-lab",
    badgeId: "reverse-apprentice",
    title: "Basic Reverse Engineering & Assembly Patching",
    category: "Reverse Engineering",
    difficulty: "Menengah",
    icon: Cpu,
    description: "Analisis register x86, pelacakan instruksi percabangan, dan byte patching logika crackme.",
  },
];

export default function LabsPage() {
  const { progress } = useProgress();
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const completedCount = mounted
    ? LABS_LIST.filter((lab) => progress.completedLabs.includes(lab.id)).length
    : 0;

  const filteredLabs = LABS_LIST.filter((lab) => {
    if (activeFilter === "completed") {
      return mounted && progress.completedLabs.includes(lab.id);
    }
    if (activeFilter === "uncompleted") {
      return !mounted || !progress.completedLabs.includes(lab.id);
    }
    return true;
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm" className="font-mono">
            <FlaskConical className="w-3.5 h-3.5 mr-1" />
            PRAKTIKUM &amp; SIMULASI
          </Badge>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">
            Lingkungan Aman 100% Client-Side
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-mono font-bold text-[var(--color-text)]">
              Hands-on Cybersecurity Labs
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-2xl font-mono leading-relaxed">
              Praktikkan konsep cybersecurity di lingkungan simulasi browser tanpa risiko hukum maupun teknis.
              Setiap praktikum dirancang menguji pemahaman teori ke dalam aksi nyata.
            </p>
          </div>

          {/* Progress Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl flex items-center gap-4 min-w-[240px]">
            <div className="w-12 h-12 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono text-[var(--color-text-muted)]">Kemajuan Praktikum</div>
              <div className="text-xl font-mono font-bold text-[var(--color-text)]">
                {mounted ? completedCount : 0} / {LABS_LIST.length}{" "}
                <span className="text-xs font-normal text-[var(--color-text-muted)]">
                  ({mounted ? Math.round((completedCount / LABS_LIST.length) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Ethics Disclaimer */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs font-mono text-amber-300">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-amber-200">
              Etika &amp; Batasan Hukum Pembelajaran
            </span>
            <p className="text-amber-300/90 leading-relaxed">
              Semua praktikum di CyberLab-ID berjalan murni secara lokal di sandbox memori peramban Anda. 
              Dilarang keras menerapkan teknik eksploitasi, scanning, atau reverse engineering pada sistem milik orang lain tanpa izin tertulis resmi (Pasal 30 &amp; 31 UU ITE).
            </p>
          </div>
        </div>
      </div>

      {/* Quick Nav / Hub Cards */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-mono font-bold text-[var(--color-text)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
            Daftar Modul Praktikum
          </h2>

          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded transition-colors ${
                activeFilter === "all"
                  ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Semua ({LABS_LIST.length})
            </button>
            <button
              onClick={() => setActiveFilter("completed")}
              className={`px-3 py-1 rounded transition-colors ${
                activeFilter === "completed"
                  ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Selesai ({mounted ? completedCount : 0})
            </button>
            <button
              onClick={() => setActiveFilter("uncompleted")}
              className={`px-3 py-1 rounded transition-colors ${
                activeFilter === "uncompleted"
                  ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Belum ({mounted ? LABS_LIST.length - completedCount : LABS_LIST.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLabs.map((lab, index) => {
            const Icon = lab.icon;
            const isDone = mounted && progress.completedLabs.includes(lab.id);

            return (
              <a
                key={lab.id}
                href={`#${lab.id}`}
                className={`p-4 rounded-xl border text-left font-mono transition-all block ${
                  isDone
                    ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-accent)]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <Badge variant={isDone ? "success" : "default"} size="sm">
                    {isDone ? "Terselesaikan" : lab.difficulty}
                  </Badge>
                </div>
                <div className="text-xs text-[var(--color-accent)] font-bold mb-1">
                  LAB 0{index + 1} • {lab.category}
                </div>
                <div className="text-sm font-bold text-[var(--color-text)] line-clamp-1 mb-1">
                  {lab.title}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">
                  {lab.description}
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>Buka Praktikum</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Render All 6 Interactive Labs */}
      <div className="space-y-12 pt-6">
        <section id="linux-cli-lab" className="scroll-mt-20">
          <LinuxCliLab />
        </section>

        <section id="network-packet-lab" className="scroll-mt-20">
          <NetworkPacketLab />
        </section>

        <section id="web-vuln-lab" className="scroll-mt-20">
          <WebVulnLab />
        </section>

        <section id="crypto-challenges-lab" className="scroll-mt-20">
          <CryptoChallengesLab />
        </section>

        <section id="file-forensics-lab" className="scroll-mt-20">
          <FileForensicsLab />
        </section>

        <section id="reverse-engineering-lab" className="scroll-mt-20">
          <ReverseEngineeringLab />
        </section>
      </div>
    </div>
  );
}
