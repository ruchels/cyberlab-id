"use client";

import React from "react";
import Link from "next/link";
import { Shield, Heart, ShieldCheck } from "lucide-react";
import { GithubIcon } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[var(--color-border)] bg-[#070a11] mt-16 text-xs text-[var(--color-text-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-mono text-base font-bold text-[var(--color-text)]">
              <Shield className="w-4 h-4 text-[var(--color-accent)]" />
              <span>
                CyberLab<span className="text-[var(--color-accent)]">-ID</span>
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              {t.footer.tagline} Platform edukasi keamanan siber terbuka dan berstandar industri untuk memajukan talenta digital Indonesia.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Open Source & Community
              </span>
              <span className="text-[var(--color-text-muted)]">·</span>
              <span className="text-[var(--color-text-muted)]">MIT License</span>
            </div>
          </div>

          {/* Quick Links: Pembelajaran */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              Kurikulum & Praktik
            </h4>
            <ul className="space-y-2 font-mono text-xs">
              <li>
                <Link href="/soc" className="hover:text-[var(--color-accent)] transition-colors text-emerald-400 font-semibold">
                  SOC & Incident Response
                </Link>
              </li>
              <li>
                <Link href="/academy" className="hover:text-[var(--color-accent)] transition-colors">
                  Cybersecurity Academy
                </Link>
              </li>
              <li>
                <Link href="/learning" className="hover:text-[var(--color-accent)] transition-colors">
                  {t.nav.learning}
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:text-[var(--color-accent)] transition-colors">
                  AI Learning Assistant
                </Link>
              </li>
              <li>
                <Link href="/learning/ai-path" className="hover:text-[var(--color-accent)] transition-colors">
                  AI Learning Path
                </Link>
              </li>
              <li>
                <Link href="/security-center" className="hover:text-[var(--color-accent)] transition-colors">
                  Security Analysis Center
                </Link>
              </li>
              <li>
                <Link href="/quizzes" className="hover:text-[var(--color-accent)] transition-colors">
                  Kuis AI Adaptif
                </Link>
              </li>
              <li>
                <Link href="/range" className="hover:text-[var(--color-accent)] transition-colors">
                  {(t.nav as any).range || "Cyber Range"}
                </Link>
              </li>
              <li>
                <Link href="/labs" className="hover:text-[var(--color-accent)] transition-colors">
                  {t.nav.labs}
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-[var(--color-accent)] transition-colors">
                  {t.nav.tools}
                </Link>
              </li>
              <li>
                <Link href="/challenges" className="hover:text-[var(--color-accent)] transition-colors">
                  {t.nav.challenges}
                </Link>
              </li>
            </ul>
          </div>

          {/* Ekosistem & Riset */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              Ekosistem & Riset
            </h4>
            <ul className="space-y-2 font-mono text-xs">
              <li>
                <Link href="/institutions" className="text-[var(--color-accent)] font-bold hover:underline transition-colors">
                  Enterprise & Institusi
                </Link>
              </li>
              <li>
                <Link href="/arena" className="hover:text-[var(--color-accent)] transition-colors">
                  CTF Competition Arena
                </Link>
              </li>
              <li>
                <Link href="/arena/teams" className="hover:text-[var(--color-accent)] transition-colors">
                  Manajemen Skuad / Tim
                </Link>
              </li>
              <li>
                <Link href="/research" className="hover:text-[var(--color-accent)] transition-colors">
                  Research Hub & Write-ups
                </Link>
              </li>
              <li>
                <Link href="/mentorship" className="hover:text-[var(--color-accent)] transition-colors">
                  Community Mentorship
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-[var(--color-accent)] transition-colors">
                  Webinar & Workshop
                </Link>
              </li>
              <li>
                <Link href="/contributors" className="hover:text-[var(--color-accent)] transition-colors">
                  Pusat Kontributor
                </Link>
              </li>
              <li>
                <Link href="/partnerships" className="hover:text-[var(--color-accent)] transition-colors">
                  Kemitraan Global & Kampus
                </Link>
              </li>
              <li>
                <Link href="/knowledge-explorer" className="hover:text-[var(--color-accent)] transition-colors">
                  Knowledge Explorer (MITRE / CVE)
                </Link>
              </li>
            </ul>
          </div>

          {/* Open Source & Integritas */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              Open-Source & Verifikasi
            </h4>
            <ul className="space-y-2 font-mono text-xs">
              <li>
                <Link href="/developers" className="hover:text-[var(--color-accent)] transition-colors">
                  Developer Portal & API v1
                </Link>
              </li>
              <li>
                <Link href="/opensource" className="hover:text-[var(--color-accent)] transition-colors">
                  Repositori & Kode Etik
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/cyberlab-id/cyberlab-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1.5"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  GitHub Organization
                </a>
              </li>
              <li>
                <Link href="/verify/demo" className="hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verifikasi Sertifikat
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-[var(--color-accent)] transition-colors">
                  Papan Peringkat Nasional
                </Link>
              </li>
              <li>
                <Link href="/about#license" className="hover:text-[var(--color-accent)] transition-colors">
                  Lisensi MIT Bebas Pakai
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-10 pt-6 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[var(--color-text-muted)]">
          <p className="text-center sm:text-left">
            © {currentYear} CyberLab-ID Open-Source Contributors. Didedikasikan untuk Komunitas Cybersecurity Indonesia.
          </p>
          <div className="flex items-center gap-1">
            <span>Dibuat dengan</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline mx-0.5" />
            <span>untuk Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
