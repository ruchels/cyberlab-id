"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import {
  Shield,
  Terminal,
  BookOpen,
  Wrench,
  Trophy,
  FileText,
  Info,
  Menu,
  X,
  Globe,
  FlaskConical,
  Award,
  MessageSquare,
  Medal,
  Bell,
  User as UserIcon,
  Lock,
  Activity,
} from "lucide-react";
import { GithubIcon, Badge } from "@/components/ui";

export function Navbar() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLanguage();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: t.nav.home, icon: Terminal },
    { href: "/learning", label: t.nav.learning, icon: BookOpen },
    { href: "/range", label: (t.nav as any).range || "Cyber Range", icon: Activity },
    { href: "/labs", label: t.nav.labs, icon: FlaskConical },
    { href: "/tools", label: t.nav.tools, icon: Wrench },
    { href: "/challenges", label: t.nav.challenges, icon: Trophy },
    { href: "/community", label: (t.nav as any).community || "Komunitas", icon: MessageSquare },
    { href: "/leaderboard", label: (t.nav as any).leaderboard || "Peringkat", icon: Medal },
    { href: "/progress", label: t.nav.progress, icon: Award },
    { href: "/docs", label: t.nav.docs, icon: FileText },
  ];

  const toggleLanguage = () => {
    setLocale(locale === "id" ? "en" : "id");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[#090d16]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-mono text-base font-bold tracking-tight text-[var(--color-text)] hover:opacity-95 transition-opacity"
        >
          <div className="w-8 h-8 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)]">
            <Shield className="w-4 h-4" />
          </div>
          <span>
            CyberLab<span className="text-[var(--color-accent)] font-extrabold">-ID</span>
          </span>
          <span className="hidden lg:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
            v0.3
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-colors duration-150 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {user && (user.unreadNotifications ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {user.unreadNotifications}
              </span>
            )}
          </Link>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            title="Ganti Bahasa / Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <span className="font-bold">{locale.toUpperCase()}</span>
          </button>

          {/* User Auth Info or Login button */}
          {user ? (
            <div className="flex items-center gap-2 font-mono">
              {user.role === "admin" && (
                <Link href="/admin">
                  <Badge variant="accent" size="sm" className="hidden sm:inline-flex">
                    ADMIN
                  </Badge>
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 transition-colors text-xs"
              >
                <div className="w-5 h-5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] flex items-center justify-center font-bold text-[10px]">
                  {user.displayName.slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-[var(--color-text)] font-bold truncate max-w-[100px]">
                  {user.displayName}
                </span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1 rounded">
                  {user.totalXp} XP
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-mono">
              <Link
                href="/auth/login"
                className="px-2.5 py-1.5 rounded text-xs border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] text-[var(--color-text)] transition-colors font-medium"
              >
                Masuk
              </Link>
              <Link
                href="/auth/register"
                className="hidden sm:inline-block px-2.5 py-1.5 rounded text-xs bg-[var(--color-accent)] text-[var(--color-background)] font-bold hover:opacity-90 transition-opacity"
              >
                Daftar
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-[var(--color-border)] bg-[#090d16] px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-mono flex items-center gap-2.5 ${
                  isActive
                    ? "bg-[var(--color-surface-elevated)] text-[var(--color-accent)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-mono flex items-center gap-2.5 text-red-400 bg-red-500/10"
            >
              <Lock className="w-4 h-4" />
              Panel Administrator
            </Link>
          )}
          <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)] font-mono">
              Bahasa: {locale === "id" ? "Bahasa Indonesia" : "English"}
            </span>
            <button
              onClick={toggleLanguage}
              className="text-xs font-mono text-[var(--color-accent)] hover:underline"
            >
              Ganti ke {locale === "id" ? "English" : "Indonesia"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
