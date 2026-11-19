"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, Badge, Button } from "@/components/ui";
import {
  Bell,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Flag,
  Shield,
  Info,
  Clock,
  ArrowRight,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "achievement" | "ctf" | "comment" | "admin";
  link: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user, refreshUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        await refreshUser();
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await refreshUser();
    } catch (err) {
      console.error("Error marking single read:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "achievement":
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case "ctf":
        return <Flag className="w-4 h-4 text-emerald-400" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-[var(--color-accent)]" />;
      case "admin":
        return <Shield className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-sky-400" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto font-mono">
        <Bell className="w-12 h-12 text-[var(--color-border)]" />
        <h1 className="text-xl font-bold text-[var(--color-text)]">
          Pusat Notifikasi
        </h1>
        <p className="text-xs text-[var(--color-text-muted)]">
          Silakan masuk ke akun Anda untuk melihat pemberitahuan lencana, balasan komentar, dan aktivitas CTF.
        </p>
        <Link href="/auth/login">
          <Button variant="primary" size="sm" className="text-xs font-mono">
            Masuk Akun
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 space-y-8 max-w-4xl mx-auto font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent" size="sm">
              <Bell className="w-3 h-3 mr-1" />
              NOTIFIKASI
            </Badge>
            {unreadCount > 0 && (
              <span className="text-xs font-bold text-amber-400">
                {unreadCount} Belum Dibaca
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            Aktivitas &amp; Pengumuman
          </h1>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            size="sm"
            className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[var(--color-text-muted)]">
          Memuat notifikasi...
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] space-y-2">
          <Bell className="w-8 h-8 mx-auto text-[var(--color-border)]" />
          <div>Belum ada notifikasi baru untuk akun Anda.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.isRead) handleMarkSingleRead(notif.id);
              }}
              className={`p-4 rounded-xl border transition-all text-xs flex items-start justify-between gap-4 cursor-pointer ${
                notif.isRead
                  ? "bg-[var(--color-surface)] border-[var(--color-border-subtle)] opacity-70"
                  : "bg-[var(--color-surface-elevated)] border-[var(--color-accent)]/40 shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--color-text)]">
                      {notif.title}
                    </span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                    )}
                  </div>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="text-[10px] text-[var(--color-text-muted)] pt-1 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(notif.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {notif.link && (
                <Link
                  href={notif.link}
                  className="text-[var(--color-accent)] hover:underline flex items-center gap-1 flex-shrink-0 pt-1"
                >
                  Buka <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
