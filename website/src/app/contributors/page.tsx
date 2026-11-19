"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GitPullRequest,
  PlusCircle,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Tag,
  Send,
  HelpCircle,
  User,
  Shield,
  BookOpen,
} from "lucide-react";
import { Badge, Card, CardHeader, CardContent } from "@/components/ui";

interface Submission {
  id: string;
  type: string;
  title: string;
  description: string;
  tags: string;
  status: string;
  created_at: string;
  author_name?: string;
  author_username?: string;
  reviewer_feedback?: string;
}

export default function ContributorsPage() {
  const [published, setPublished] = useState<Submission[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [subType, setSubType] = useState("module");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchContributions();
  }, []);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/contributors/submissions");
      const json = await res.json();
      if (json.success) {
        setPublished(json.published || []);
        setMySubmissions(json.mySubmissions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/contributors/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: subType,
          title: title.trim(),
          description: description.trim(),
          content: content.trim(),
          tags: tagList,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim proposal kontribusi");

      setMessage({
        type: "success",
        text: "Proposal kontribusi Anda berhasil dikirim! Tim reviewer akan segera meninjau materi Anda.",
      });
      setShowModal(false);
      setTitle("");
      setDescription("");
      setContent("");
      setTags("");
      fetchContributions();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
      case "approved":
        return <Badge variant="accent" size="sm">DITERIMA</Badge>;
      case "in_review":
        return <Badge variant="secondary" size="sm">SEDANG DITINJAU</Badge>;
      case "rejected":
        return <Badge variant="destructive" size="sm">REVISI DIBUTUHKAN</Badge>;
      default:
        return <Badge variant="default" size="sm">TERKIRIM</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono">
              <GitPullRequest className="w-4 h-4" />
              <span>CyberLab-ID Open-Source Contributor Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Pusat Kontributor & <span className="text-[var(--color-accent)]">Komunitas Kreator</span>
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Berkontribusilah dengan menulis materi kurikulum, membuat tantangan CTF baru, mengembangkan tools open-source, atau membagikan riset keamanan digital.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-black font-mono font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-[var(--color-accent)]/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ajukan Kontribusi Baru</span>
            </button>
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

        {/* My Submissions Tracker (if any) */}
        {mySubmissions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-base font-bold flex items-center gap-2 text-white">
                <Clock className="w-5 h-5 text-[var(--color-accent)]" />
                <span>Pengajuan Kontribusi Saya ({mySubmissions.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mySubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-xl border border-[var(--color-border)] bg-[#0d1222] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)]">
                      {sub.type}
                    </span>
                    {getStatusBadge(sub.status)}
                  </div>
                  <h4 className="font-bold text-sm text-white">{sub.title}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                    {sub.description}
                  </p>

                  {sub.reviewer_feedback && (
                    <div className="p-3 rounded bg-black/40 border border-[var(--color-border)] font-mono text-xs text-[var(--color-text-muted)] space-y-1">
                      <span className="font-bold text-[var(--color-accent)] block">Catatan Reviewer:</span>
                      <p>{sub.reviewer_feedback}</p>
                    </div>
                  )}

                  <div className="text-[10px] font-mono text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-subtle)]">
                    Diajukan: {new Date(sub.created_at).toLocaleDateString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Community Contributions Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-lg font-bold flex items-center gap-2 text-white">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Etalase Kontribusi Komunitas</span>
            </h3>
            <span className="text-xs font-mono text-[var(--color-text-muted)]">
              Materi & Tantangan Buatan Komunitas
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
              Memuat kontribusi komunitas...
            </div>
          ) : published.length === 0 ? (
            <div className="p-8 rounded-xl border border-[var(--color-border)] bg-[#0d121f] text-center font-mono text-xs text-[var(--color-text-muted)] space-y-3">
              <FileText className="w-8 h-8 mx-auto text-[var(--color-text-muted)] opacity-50" />
              <p>Belum ada kontribusi publik. Jadilah yang pertama mengajukan modul atau lab!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {published.map((pub) => {
                let tagArray: string[] = [];
                try {
                  tagArray = typeof pub.tags === "string" ? JSON.parse(pub.tags) : pub.tags;
                } catch {
                  tagArray = [];
                }

                return (
                  <Card
                    key={pub.id}
                    className="flex flex-col justify-between bg-[#0d121f] hover:border-[var(--color-accent)]/40 transition-colors"
                  >
                    <CardHeader className="space-y-3 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]">
                          {pub.type}
                        </span>
                        <Badge variant="accent" size="sm">
                          TERVERIFIKASI
                        </Badge>
                      </div>
                      <h4 className="font-bold text-base text-[var(--color-text)]">{pub.title}</h4>
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                        {pub.description}
                      </p>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-4">
                      {tagArray.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {tagArray.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/30 border border-[var(--color-border)] text-[var(--color-text-muted)]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)] text-xs font-mono text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                          <span>{pub.author_name || pub.author_username || "Kontributor"}</span>
                        </span>
                        <span>{new Date(pub.created_at).toLocaleDateString("id-ID")}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Submit Proposal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[#0d1222] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <div className="space-y-1">
                  <h3 className="font-mono text-lg font-bold text-white flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-[var(--color-accent)]" />
                    <span>Ajukan Proposal Kontribusi</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Kirimkan draf materi, tantangan CTF, atau modul praktikum Anda.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[var(--color-text-muted)] hover:text-white font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[var(--color-text-secondary)]">Tipe Kontribusi</label>
                    <select
                      value={subType}
                      onChange={(e) => setSubType(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="module">Modul Pembelajaran</option>
                      <option value="challenge">CTF Challenge</option>
                      <option value="lab">Praktikum Lab Interaktif</option>
                      <option value="tutorial">Tutorial Praktis</option>
                      <option value="writeup">Technical Write-up</option>
                      <option value="tool">Security Tool & Script</option>
                      <option value="research">Riset & Dokumentasi</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[var(--color-text-secondary)]">Tags (Pisahkan koma)</label>
                    <input
                      type="text"
                      placeholder="linux, bash, privilege-escalation"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[var(--color-text-secondary)]">Judul Proposal</label>
                  <input
                    type="text"
                    placeholder="cth: Analisis Eksploitasi Stack-Based Buffer Overflow di x86_64"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[var(--color-text-secondary)]">Ringkasan / Sinopsis Singkat</label>
                  <textarea
                    rows={2}
                    placeholder="Jelaskan secara ringkas tujuan, prasyarat, dan audiens target..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[var(--color-text-secondary)]">
                    Isi Konten / Panduan Materi (Markdown Format)
                  </label>
                  <textarea
                    rows={8}
                    placeholder="# Pendahuluan&#10;&#10;Jelaskan materi, langkah-langkah, kode perintah, atau solusi praktikum di sini..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-mono text-[11px]"
                  />
                </div>

                <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-black/30 text-[11px] text-[var(--color-text-muted)] space-y-1">
                  <span className="font-bold text-[var(--color-accent)] block">Pedoman Kontribusi:</span>
                  <p>
                    Pastikan materi original, legal untuk edukasi defensif, dan tidak memuat flag CTF aktif secara terbuka tanpa enkripsi/spoiler guard.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
                    <span>{submitting ? "Mengirim..." : "Kirim Proposal"}</span>
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
