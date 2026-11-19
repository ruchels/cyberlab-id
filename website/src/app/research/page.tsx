"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  PlusCircle,
  Eye,
  Heart,
  Calendar,
  User,
  ShieldAlert,
  Lock,
  Tag,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { Badge, Card, CardHeader, CardContent } from "@/components/ui";

interface ArticleItem {
  id: string;
  author_name: string;
  author_username?: string;
  title: string;
  slug: string;
  abstract: string;
  category: string;
  keywords: string;
  is_writeup: number;
  has_spoilers: number;
  views_count: number;
  likes_count: number;
  published_at: string;
}

export default function ResearchHubPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [category, setCategory] = useState("web-sec");
  const [keywords, setKeywords] = useState("");
  const [content, setContent] = useState("");
  const [isWriteup, setIsWriteup] = useState(false);
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [references, setReferences] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/research/articles");
      const json = await res.json();
      if (json.success) {
        setArticles(json.articles || []);
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

      const kwList = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      const refList = references
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await fetch("/api/research/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          abstract: abstract.trim(),
          category,
          keywords: kwList,
          content: content.trim(),
          isWriteup,
          hasSpoilers,
          references: refList,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mempublikasikan artikel");

      setMessage({
        type: "success",
        text: "Artikel riset berhasil dikirim dan siap ditinjau/dipublikasikan!",
      });
      setShowModal(false);
      setTitle("");
      setAbstract("");
      setContent("");
      setKeywords("");
      setReferences("");
      fetchArticles();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { key: "all", label: "Semua Kategori" },
    { key: "writeup", label: "CTF Write-up" },
    { key: "web-sec", label: "Web Security" },
    { key: "forensics", label: "Digital Forensics" },
    { key: "reverse-engineering", label: "Reverse Engineering" },
    { key: "cryptography", label: "Kriptografi" },
    { key: "defense", label: "Defensive Sec & Blue Team" },
  ];

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.abstract.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "writeup" ? a.is_writeup === 1 : a.category === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono">
              <FileText className="w-4 h-4" />
              <span>CyberLab-ID Research Hub & Technical Write-ups</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Pusat Riset & <span className="text-[var(--color-accent)]">Dokumentasi Teknis</span>
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Kumpulan analisis kerentanan, investigasi insiden, dokumentasi reverse engineering, dan solusi write-up CTF berkualitas tinggi dari praktisi keamanan Indonesia.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-black font-mono font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-[var(--color-accent)]/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tulis Riset / Write-up Baru</span>
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

        {/* Search & Category Pills */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Cari judul riset atau kata kunci..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 scrollbar-thin">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategoryFilter(c.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono whitespace-nowrap transition-colors ${
                  categoryFilter === c.key
                    ? "bg-[var(--color-accent)] text-black font-bold"
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
            Memuat arsip penelitian dan write-up...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
            Tidak ada artikel riset yang cocok dengan kriteria pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((art) => {
              let kwList: string[] = [];
              try {
                kwList = typeof art.keywords === "string" ? JSON.parse(art.keywords) : art.keywords;
              } catch {
                kwList = [];
              }

              return (
                <Card
                  key={art.id}
                  className="flex flex-col justify-between bg-[#0d121f] hover:border-[var(--color-accent)]/40 transition-colors"
                >
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]">
                        {art.is_writeup ? "CTF Write-up" : art.category}
                      </span>
                      {art.has_spoilers === 1 && (
                        <Badge variant="destructive" size="sm">
                          SPOILER
                        </Badge>
                      )}
                    </div>
                    <Link href={`/research/${art.slug}`}>
                      <h3 className="font-bold text-base text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                        {art.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                      {art.abstract}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    {kwList.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {kwList.slice(0, 3).map((kw, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[var(--color-text-muted)] border border-[var(--color-border)]"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)] text-xs font-mono text-[var(--color-text-muted)]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-blue-400" /> {art.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-rose-400" /> {art.likes_count}
                        </span>
                      </div>
                      <Link
                        href={`/research/${art.slug}`}
                        className="text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Baca</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal: Write New Article */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-3xl bg-[#0d1222] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <div className="space-y-1">
                  <h3 className="font-mono text-lg font-bold text-white flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-[var(--color-accent)]" />
                    <span>Publikasikan Riset Keamanan / Write-up</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Format penulisan Markdown didukung penuh untuk kode, diagram, dan sitasi.
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
                    <label className="text-[var(--color-text-secondary)]">Kategori Riset</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="web-sec">Web Security & Exploitation</option>
                      <option value="reverse-engineering">Reverse Engineering & Binaries</option>
                      <option value="forensics">Digital Forensics & Incident Response</option>
                      <option value="cryptography">Cryptanalysis & Modern Ciphers</option>
                      <option value="defense">Defensive Hardening & Detection Engineering</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[var(--color-text-secondary)]">Keywords (Pisahkan koma)</label>
                    <input
                      type="text"
                      placeholder="xss, csp-bypass, memory-corruption"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[var(--color-text-secondary)]">Judul Artikel Riset</label>
                  <input
                    type="text"
                    placeholder="cth: Analisis Bypass CSP Menggunakan Gadgets JSONP pada Aplikasi Modern"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[var(--color-text-secondary)]">Abstrak / Ringkasan Eksekutif</label>
                  <textarea
                    rows={2}
                    placeholder="Rangkum temuan, metodologi pengujian, dan dampak teknis artikel..."
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[var(--color-text-secondary)]">
                    Konten Lengkap Riset (Markdown)
                  </label>
                  <textarea
                    rows={8}
                    placeholder="## Metodologi Analisis&#10;&#10;Jelaskan detail eksperimen, snippet kode, dan bukti konsep (PoC) secara bertanggung jawab..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[var(--color-text-secondary)]">
                    Daftar Referensi & Sitasi (Satu per baris)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="https://cve.mitre.org/...&#10;https://owasp.org/..."
                    value={references}
                    onChange={(e) => setReferences(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isWriteup}
                      onChange={(e) => setIsWriteup(e.target.checked)}
                      className="rounded accent-[var(--color-accent)]"
                    />
                    <span>Ini adalah CTF Write-up</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSpoilers}
                      onChange={(e) => setHasSpoilers(e.target.checked)}
                      className="rounded accent-[var(--color-accent)]"
                    />
                    <span>Memuat Spoiler / Solusi Langsung</span>
                  </label>
                </div>

                {/* Anti-Leak Warning */}
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-300 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Perlindungan Anti-Leak CTF:
                  </span>
                  <p>
                    Sistem kami memindai secara otomatis. Jangan mencantumkan raw string flag CTF aktif tanpa disamarkan (misalnya `CYBERLAB&#123;REDACTED&#125;`).
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
                    className="px-6 py-2 rounded-lg bg-[var(--color-accent)] text-black font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Menerbitkan..." : "Kirim Publikasi"}
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
