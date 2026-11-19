"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSound } from "@/lib/sound-context";
import { useLanguage } from "@/lib/i18n";
import {
  Shield,
  Terminal,
  Activity,
  Bell,
  GraduationCap,
  BookOpen,
  Sparkles,
  Award,
  Wrench,
  FlaskConical,
  Trophy,
  Swords,
  Medal,
  ShieldAlert,
  Bot,
  Compass,
  MessageSquare,
  FileText,
  GitPullRequest,
  Calendar,
  Building2,
  Globe,
  Code,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
  X,
  Lock,
} from "lucide-react";
import { GithubIcon } from "@/components/ui";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  adminOnly?: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  mobileOpen,
  onMobileClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { playClick, playTab } = useSound();
  const { locale, t } = useLanguage();

  // Collapsible groups state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Navigation structure based on actual real routes
  const navGroups: NavGroup[] = useMemo(() => [
    {
      id: "overview",
      title: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", href: "/", icon: Terminal },
        { id: "security-center", label: "Security Center", href: "/security-center", icon: Activity },
        {
          id: "notifications",
          label: "Notifikasi",
          href: "/notifications",
          icon: Bell,
          badge: user && (user.unreadNotifications ?? 0) > 0 ? String(user.unreadNotifications) : undefined,
          badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
        },
      ],
    },
    {
      id: "learn",
      title: "Kurikulum & Belajar",
      items: [
        { id: "academy", label: "Academy", href: "/academy", icon: GraduationCap },
        { id: "learning", label: "Modul Pembelajaran", href: "/learning", icon: BookOpen },
        { id: "ai-path", label: "AI Learning Path", href: "/learning/ai-path", icon: Sparkles },
        { id: "progress", label: "Progres Belajar", href: "/progress", icon: Award },
      ],
    },
    {
      id: "practice",
      title: "Praktik & Cyber Range",
      items: [
        { id: "tools", label: "Security Tools", href: "/tools", icon: Wrench },
        { id: "range", label: "Cyber Range", href: "/range", icon: Activity, badge: "Virtual", badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
        { id: "labs", label: "Praktikum Lab", href: "/labs", icon: FlaskConical },
        { id: "challenges", label: "CTF Challenges", href: "/challenges", icon: Trophy },
        { id: "arena", label: "Arena Kompetisi", href: "/arena", icon: Swords },
        { id: "leaderboard", label: "Peringkat", href: "/leaderboard", icon: Medal },
      ],
    },
    {
      id: "defense",
      title: "Cyber Defense (SOC)",
      items: [
        { id: "soc", label: "SOC Workspace", href: "/soc", icon: ShieldAlert, badge: "Blue Team", badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
      ],
    },
    {
      id: "intelligence",
      title: "AI & Intelligence",
      items: [
        { id: "assistant", label: "AI Security Tutor", href: "/assistant", icon: Bot },
        { id: "quizzes", label: "Kuis Adaptif", href: "/quizzes", icon: Award },
        { id: "knowledge", label: "Knowledge Explorer", href: "/knowledge-explorer", icon: Compass },
      ],
    },
    {
      id: "community",
      title: "Komunitas & Riset",
      items: [
        { id: "community", label: "Forum Komunitas", href: "/community", icon: MessageSquare },
        { id: "research", label: "Pusat Riset", href: "/research", icon: FileText },
        { id: "contributors", label: "Hub Kontributor", href: "/contributors", icon: GitPullRequest },
        { id: "events", label: "Events & Webinar", href: "/events", icon: Calendar },
        { id: "opensource", label: "Open Source", href: "/opensource", icon: GithubIcon },
      ],
    },
    {
      id: "institution",
      title: "Ekosistem & Institusi",
      items: [
        { id: "institutions", label: "Portal Institusi", href: "/institutions", icon: Building2 },
        { id: "partnerships", label: "Mitra Global", href: "/partnerships", icon: Globe },
        { id: "developers", label: "Developer API", href: "/developers", icon: Code },
      ],
    },
    {
      id: "management",
      title: "Sistem & Administrasi",
      items: [
        { id: "admin", label: "Admin Console", href: "/admin", icon: Lock, adminOnly: true, badge: "Admin", badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
        { id: "profile", label: "Pengaturan Akun", href: "/profile", icon: Settings },
        { id: "docs", label: "Dokumentasi", href: "/docs", icon: FileText },
      ],
    },
  ], [user]);

  const toggleGroup = (groupId: string) => {
    playClick();
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleLinkClick = () => {
    playTab();
    onMobileClose();
  };

  const handleLogout = async () => {
    playClick();
    await logout();
    onMobileClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#070b13]/98 backdrop-blur-xl border-r border-slate-800/90 transition-all duration-300 ease-in-out select-none ${
          /* Desktop Width */
          isCollapsed ? "lg:w-[72px]" : "lg:w-64"
        } ${
          /* Mobile Drawer Position */
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Sidebar Header / Brand */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <Link
            href="/"
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 font-mono text-sm font-bold text-slate-100 hover:opacity-90 transition-opacity overflow-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <Shield className="w-4 h-4" />
            </div>
            {(!isCollapsed || mobileOpen) && (
              <span className="truncate">
                CyberLab<span className="text-cyan-400 font-extrabold">-ID</span>
              </span>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Tutup navigasi"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={() => {
              playClick();
              onToggleCollapse();
            }}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
            aria-label={isCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            title={isCollapsed ? "Perluas navigasi (Expand)" : "Ciutkan navigasi (Collapse)"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {navGroups.map((group) => {
            // Check role filter for entire group if needed
            const visibleItems = group.items.filter((item) => {
              if (item.adminOnly && user?.role !== "admin") return false;
              return true;
            });

            if (visibleItems.length === 0) return null;

            const isGroupCollapsed = collapsedGroups[group.id] && !isCollapsed;

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Heading (Expanded only) */}
                {(!isCollapsed || mobileOpen) && (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 hover:text-cyan-300 transition-colors group cursor-pointer"
                  >
                    <span>{group.title}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isGroupCollapsed ? "-rotate-90" : "rotate-0"
                      }`}
                    />
                  </button>
                )}

                {/* Group Items */}
                {!isGroupCollapsed && (
                  <div className="space-y-1 pt-0.5">
                    {visibleItems.map((item) => {
                      const isActive =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href);
                      const IconComponent = item.icon;

                      return (
                        <div key={item.id} className="relative group/item">
                          <Link
                            href={item.href}
                            onClick={handleLinkClick}
                            className={`flex items-center gap-3 px-2.5 py-2 rounded-lg font-mono text-xs font-medium transition-all duration-150 ${
                              isCollapsed && !mobileOpen ? "justify-center" : ""
                            } ${
                              isActive
                                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.12)] font-semibold"
                                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent"
                            }`}
                          >
                            <div className="relative shrink-0">
                              <IconComponent className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400 group-hover/item:text-cyan-300"}`} />
                              {/* Small indicator dot in collapsed mode if badge exists */}
                              {isCollapsed && !mobileOpen && item.badge && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400" />
                              )}
                            </div>

                            {(!isCollapsed || mobileOpen) && (
                              <span className="truncate flex-1">{item.label}</span>
                            )}

                            {(!isCollapsed || mobileOpen) && item.badge && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${
                                  item.badgeColor || "bg-slate-800 text-slate-300 border-slate-700"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </Link>

                          {/* Tooltip for Collapsed Mode */}
                          {isCollapsed && !mobileOpen && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#0c1220] border border-cyan-500/30 text-slate-100 text-xs font-mono rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/item:opacity-100 group-focus-within/item:opacity-100 transition-opacity z-50">
                              <div className="flex items-center gap-2">
                                <span>{item.label}</span>
                                {item.badge && (
                                  <span className={`text-[9px] px-1 rounded border ${item.badgeColor || "bg-slate-800 text-slate-300"}`}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Profile & Account Footer */}
        <div className="p-3 border-t border-slate-800/90 shrink-0 bg-[#060910]">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/profile"
                onClick={handleLinkClick}
                className={`flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-slate-800/60 transition-colors flex-1 overflow-hidden ${
                  isCollapsed && !mobileOpen ? "justify-center" : ""
                }`}
                title={user.displayName || user.username}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-mono text-xs font-bold shrink-0 shadow-sm">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </div>

                {(!isCollapsed || mobileOpen) && (
                  <div className="truncate">
                    <div className="text-xs font-mono font-bold text-slate-200 truncate">
                      {user.displayName || user.username}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 capitalize flex items-center gap-1">
                      <span>{user.role}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-emerald-400">{user.totalXp} XP</span>
                    </div>
                  </div>
                )}
              </Link>

              {(!isCollapsed || mobileOpen) && (
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <Link
                href="/auth/login"
                onClick={handleLinkClick}
                className={`w-full py-2 px-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isCollapsed && !mobileOpen ? "justify-center" : "justify-center"
                }`}
                title="Masuk ke Akun"
              >
                <UserIcon className="w-3.5 h-3.5" />
                {(!isCollapsed || mobileOpen) && <span>Masuk / Akun</span>}
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
