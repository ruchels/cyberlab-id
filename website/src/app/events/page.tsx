"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Search,
} from "lucide-react";
import { Badge, Card, CardHeader, CardContent } from "@/components/ui";

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  speaker_name: string;
  start_time: string;
  end_time: string;
  location_url: string;
  max_participants: number;
  registered_count: number;
  status: string;
  isRegistered?: boolean;
  isFull?: boolean;
}

export default function EventsPage() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events");
      const json = await res.json();
      if (json.success) {
        setEvents(json.events || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRegistration = async (event: CommunityEvent) => {
    try {
      setActionLoading(event.id);
      setMessage(null);
      const action = event.isRegistered ? "cancel" : "register";

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses pendaftaran");

      setMessage({ type: "success", text: data.message });
      fetchEvents();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const types = [
    { key: "all", label: "Semua Acara" },
    { key: "workshop", label: "Workshop Praktis" },
    { key: "webinar", label: "Webinar Nasional" },
    { key: "study_group", label: "Kelompok Belajar" },
    { key: "ctf", label: "CTF Gathering" },
  ];

  const filteredEvents = events.filter((ev) => {
    if (typeFilter === "all") return true;
    return ev.type === typeFilter;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono">
              <Calendar className="w-4 h-4" />
              <span>CyberLab-ID Community Events & Workshops</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Agenda Acara, Webinar & <span className="text-[var(--color-accent)]">Workshop Siber</span>
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Tingkatkan wawasan keamanan digital melalui sesi bedah materi praktis bersama praktisi industri, akademisi, dan sesama anggota komunitas.
            </p>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-lg font-mono text-xs flex items-center justify-between border ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="underline hover:opacity-80">
              Tutup
            </button>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {types.map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`px-4 py-2 rounded-lg text-xs font-mono whitespace-nowrap transition-colors ${
                typeFilter === t.key
                  ? "bg-[var(--color-accent)] text-black font-bold"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
            Memuat kalender acara komunitas...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
            Belum ada jadwal acara untuk kategori ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => (
              <Card
                key={ev.id}
                className="flex flex-col justify-between bg-[#0d121f] hover:border-[var(--color-accent)]/40 transition-colors"
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]">
                      {ev.type}
                    </span>
                    <Badge variant={ev.isFull ? "destructive" : "accent"} size="sm">
                      {ev.isFull ? "KUOTA PENUH" : "TERBUKA"}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-base text-[var(--color-text)] leading-snug">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                    {ev.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0 space-y-4 font-mono text-xs text-[var(--color-text-muted)]">
                  <div className="space-y-2 pt-2 border-t border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                      <span className="text-[var(--color-text)] font-semibold truncate">
                        {ev.speaker_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>
                        {new Date(ev.start_time).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Peserta:</span>
                      </span>
                      <span className="font-bold text-[var(--color-text)]">
                        {ev.registered_count} / {ev.max_participants}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {ev.isRegistered ? (
                      <div className="space-y-2">
                        <a
                          href={ev.location_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-lg bg-emerald-500 text-black font-bold flex items-center justify-center gap-2 text-xs hover:opacity-90 transition-opacity"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Masuk Ruang Sesi</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleToggleRegistration(ev)}
                          disabled={actionLoading === ev.id}
                          className="w-full py-1.5 text-[11px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Batalkan Pendaftaran
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleToggleRegistration(ev)}
                        disabled={ev.isFull || actionLoading === ev.id}
                        className="w-full py-2 px-3 rounded-lg bg-[var(--color-surface-elevated)] hover:bg-[var(--color-accent)] hover:text-black border border-[var(--color-border)] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{actionLoading === ev.id ? "Memproses..." : "Daftar Acara Gratis"}</span>
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
