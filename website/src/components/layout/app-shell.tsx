"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";
import { useSound } from "@/lib/sound-context";
import {
  Menu,
  Bell,
  Globe,
  Shield,
  Search,
  ChevronRight,
  User as UserIcon,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { SoundControl } from "@/components/ui/sound-control";

const STORAGE_COLLAPSED_KEY = "cyberlab_sidebar_collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { locale, setLocale } = useLanguage();
  const { playClick } = useSound();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Restore collapsed preference
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_COLLAPSED_KEY);
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const handleToggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    try {
      localStorage.setItem(STORAGE_COLLAPSED_KEY, String(nextVal));
    } catch {}
  };

  const toggleLanguage = () => {
    playClick();
    setLocale(locale === "id" ? "en" : "id");
  };

  // Get current section label for breadcrumb
  const getSectionName = () => {
    if (pathname === "/") return "Command Dashboard";
    if (pathname.startsWith("/academy")) return "Akademi Keamanan Siber";
    if (pathname.startsWith("/learning")) return "Kurikulum Pembelajaran";
    if (pathname.startsWith("/soc")) return "Security Operations Center (SOC)";
    if (pathname.startsWith("/range")) return "Virtual Cyber Range";
    if (pathname.startsWith("/labs")) return "Praktikum Laboratorium";
    if (pathname.startsWith("/tools")) return "Security Analysis Tools";
    if (pathname.startsWith("/challenges")) return "CTF Challenge Arena";
    if (pathname.startsWith("/arena")) return "Arena CTF & Kompetisi";
    if (pathname.startsWith("/assistant")) return "AI Security Tutor";
    if (pathname.startsWith("/institutions")) return "Portal Institusi";
    if (pathname.startsWith("/admin")) return "Konsol Administrasi";
    if (pathname.startsWith("/community")) return "Komunitas & Forum";
    if (pathname.startsWith("/research")) return "Riset & Analisis";
    if (pathname.startsWith("/contributors")) return "Hub Kontributor";
    if (pathname.startsWith("/profile")) return "Pengaturan Pengguna";
    return pathname.replace(/^\//, "").replace(/-/g, " ");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* 1. Left Collapsible Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* 2. Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
        }`}
      >
        {/* Top Header Command Bar */}
        <header className="sticky top-0 z-30 w-full h-16 border-b border-slate-800/80 bg-[#070b13]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
          {/* Left: Mobile Trigger & Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => {
                playClick();
                setMobileOpen(true);
              }}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Quick Toggle Sidebar Button */}
            <button
              onClick={() => {
                playClick();
                handleToggleCollapse();
              }}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/70 border border-slate-800 transition-colors cursor-pointer"
              aria-label={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
              title={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
            >
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4 text-cyan-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {/* Breadcrumb Path Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
              <Link href="/" className="text-slate-400 hover:text-cyan-300 transition-colors">
                CyberLab
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-slate-200 font-semibold capitalize">
                {getSectionName()}
              </span>
            </div>
          </div>

          {/* Right: Sound Control, Language, Notifications, User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg border border-slate-800 bg-[#0a0f1d] hover:bg-slate-800/80 text-slate-400 hover:text-slate-100 transition-colors"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {user && (user.unreadNotifications ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-black text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {user.unreadNotifications}
                </span>
              )}
            </Link>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border border-slate-800 bg-[#0a0f1d] hover:bg-slate-800/80 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              title="Ganti Bahasa / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold">{locale.toUpperCase()}</span>
            </button>

            {/* Procedural Sound Control */}
            <SoundControl />

            {/* User Profile Quick Pill */}
            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-slate-800 bg-[#0a0f1d] hover:border-cyan-500/40 transition-colors"
                title="Profil Saya"
              >
                <span className="hidden md:inline text-xs font-mono text-slate-300 font-medium">
                  {user.displayName || user.username}
                </span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-black font-mono text-xs font-bold">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </div>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-semibold transition-colors"
              >
                Masuk
              </Link>
            )}
          </div>
        </header>

        {/* Page Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
