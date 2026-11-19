"use client";

import React from "react";
import Link from "next/link";
import { Shield, Heart } from "lucide-react";
import { GithubIcon } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[var(--color-border)] bg-[#070a11] mt-16 text-xs text-[var(--color-text-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 font-mono text-base font-bold text-[var(--color-text)]">
              <Shield className="w-4 h-4 text-[var(--color-accent)]" />
              <span>
                CyberLab<span className="text-[var(--color-accent)]">-ID</span>
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] max-w-md leading-relaxed">
              {t.footer.tagline} Platform edukasi keamanan siber berbasis praktik terbuka, legal, dan dirancang khusus untuk memajukan talenta digital Indonesia.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Community Driven
              </span>
              <span className="text-[var(--color-text-muted)]">·</span>
              <span className="text-[var(--color-text-muted)]">MIT License</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2 font-mono text-xs">
              <li>
                <Link
                  href="/learning"
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  {t.nav.learning}
                </Link>
              </li>
              <li>
                <Link
                  href="/labs"
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  {t.nav.labs}
                </Link>
              </li>
              <li>
                <Link
                  href="/tools"
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  {t.nav.tools}
                </Link>
              </li>
              <li>
                <Link
                  href="/challenges"
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  {t.nav.challenges}
                </Link>
              </li>
              <li>
                <Link
                  href="/progress"
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  {t.nav.progress}
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  {t.nav.docs}
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & Legal */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              {t.footer.community}
            </h4>
            <ul className="space-y-2 font-mono text-xs">
              <li>
                <a
                  href="https://github.com/cyberlab-id/cyberlab-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1.5"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  GitHub Repository
                </a>
              </li>
              <li>
                <Link
                  href="/about#contribute"
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  Panduan Kontribusi
                </Link>
              </li>
              <li>
                <Link
                  href="/about#ethics"
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  Kode Etik & Keamanan
                </Link>
              </li>
              <li>
                <Link
                  href="/about#license"
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  Lisensi MIT
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-10 pt-6 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[var(--color-text-muted)]">
          <p className="text-center sm:text-left">
            © {currentYear} CyberLab-ID Contributors. Didedikasikan untuk Komunitas Cybersecurity Indonesia.
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
