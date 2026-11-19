"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Compass,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Award,
  Search,
} from "lucide-react";
import { Badge, Card, CardHeader, CardContent } from "@/components/ui";

interface Mentor {
  id: string;
  display_name: string;
  bio: string;
  specialties: string[];
  is_available: number;
  avatar?: string;
  total_xp?: number;
}

interface MentorshipRequest {
  id: string;
  mentor_id: string;
  mentor_name: string;
  learning_goals: string;
  status: string;
  created_at: string;
}

export default function MentorshipPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [myRequests, setMyRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Request modal state
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [learningGoals, setLearningGoals] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchMentorshipData();
  }, []);

  const fetchMentorshipData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/mentorship/mentors");
      const json = await res.json();
      if (json.success) {
        setMentors(json.mentors || []);
        setMyRequests(json.myRequests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;

    try {
      setSubmitting(true);
      setMessage(null);
      const res = await fetch("/api/mentorship/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: selectedMentor.id,
          learningGoals: learningGoals.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim permohonan bimbingan");

      setMessage({
        type: "success",
        text: `Permohonan mentorship berhasil dikirim ke ${selectedMentor.display_name}! Tunggu konfirmasi di notifikasi.`,
      });
      setSelectedMentor(null);
      setLearningGoals("");
      fetchMentorshipData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMentors = mentors.filter((m) => {
    const term = search.toLowerCase();
    const matchesName = m.display_name.toLowerCase().includes(term);
    const matchesBio = m.bio.toLowerCase().includes(term);
    const matchesSpecialty = m.specialties.some((s) => s.toLowerCase().includes(term));
    return matchesName || matchesBio || matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono">
              <Compass className="w-4 h-4" />
              <span>CyberLab-ID Community Mentorship</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Bimbingan & <span className="text-[var(--color-accent)]">Direktori Mentor Komunitas</span>
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Konsultasikan roadmap belajar, kendala praktikum teknis, atau persiapan sertifikasi industri secara 1-on-1 dengan praktisi cybersecurity berpengalaman.
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

        {/* Active Requests (if any) */}
        {myRequests.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-mono text-base font-bold flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-[var(--color-accent)]" />
              <span>Permohonan Mentorship Saya</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-xl border border-[var(--color-border)] bg-[#0d1222] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Mentor: {req.mentor_name}</span>
                    <Badge
                      variant={
                        req.status === "accepted"
                          ? "accent"
                          : req.status === "rejected"
                          ? "destructive"
                          : "default"
                      }
                      size="sm"
                    >
                      {req.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] font-mono">
                    Tujuan Belajar: {req.learning_goals}
                  </p>
                  <div className="text-[10px] font-mono text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-subtle)]">
                    Diajukan: {new Date(req.created_at).toLocaleDateString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Cari nama mentor atau spesialisasi (web, crypto, reverse)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {/* Mentors Grid */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
            Memuat daftar mentor terverifikasi...
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
            Tidak ada mentor yang cocok dengan pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map((mentor) => (
              <Card
                key={mentor.id}
                className="flex flex-col justify-between bg-[#0d121f] hover:border-[var(--color-accent)]/40 transition-colors"
              >
                <CardHeader className="space-y-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center font-mono font-bold text-base text-[var(--color-accent)]">
                        {mentor.display_name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-base text-white">{mentor.display_name}</h4>
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        </div>
                        <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                          Mentor Terverifikasi
                        </span>
                      </div>
                    </div>

                    <Badge variant={mentor.is_available === 1 ? "accent" : "secondary"} size="sm">
                      {mentor.is_available === 1 ? "Tersedia" : "Penuh"}
                    </Badge>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                    {mentor.bio}
                  </p>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  {/* Specialties Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.specialties?.map((spec, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedMentor(mentor)}
                      disabled={mentor.is_available === 0}
                      className="w-full py-2 px-3 rounded-lg bg-[var(--color-surface-elevated)] hover:bg-[var(--color-accent)] hover:text-black border border-[var(--color-border)] font-mono text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ajukan Mentorship</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: Request Mentorship */}
        {selectedMentor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#0d1222] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <div className="space-y-1">
                  <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[var(--color-accent)]" />
                    <span>Permohonan Mentorship</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Mentor: <strong className="text-white">{selectedMentor.display_name}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMentor(null)}
                  className="text-[var(--color-text-muted)] hover:text-white font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendRequest} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-[var(--color-text-secondary)]">
                    Target Pembelajaran & Masalah yang Ingin Dikonsultasikan
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Contoh: Saya ingin memahami cara kerja eksploitasi SQLi time-based dan butuh masukan untuk persiapan sertifikasi..."
                    value={learningGoals}
                    onChange={(e) => setLearningGoals(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-black/30 text-[11px] text-[var(--color-text-muted)]">
                  Mentor akan meninjau tujuan Anda dan mengirimkan tautan sesi diskusi melalui notifikasi platform.
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMentor(null)}
                    className="px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-lg bg-[var(--color-accent)] text-black font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? "Mengirim..." : "Kirim Permohonan"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
