"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Heart,
  User,
  ShieldAlert,
  Share2,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Lock,
  Unlock,
} from "lucide-react";
import { Badge } from "@/components/ui";

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealSpoiler, setRevealSpoiler] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/research/articles/${slug}`);
      const json = await res.json();
      if (json.success && json.article) {
        setArticle(json.article);
        setLikes(json.article.likes_count || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (hasLiked) return;
    try {
      const res = await fetch(`/api/research/articles/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      });
      if (res.ok) {
        setLikes((prev) => prev + 1);
        setHasLiked(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center font-mono text-xs text-[var(--color-text-muted)]">
        Memuat artikel riset...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center space-y-4">
        <p className="font-mono text-sm text-[var(--color-text-muted)]">Artikel tidak ditemukan.</p>
        <Link
          href="/research"
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Research Hub
        </Link>
      </div>
    );
  }

  const isSpoilerGated = article.has_spoilers === 1 && !revealSpoiler;

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/research"
            className="inline-flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Research Hub</span>
          </Link>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono hover:bg-[var(--color-surface-elevated)] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Link Tersalin" : "Bagikan"}</span>
          </button>
        </div>

        {/* Article Header */}
        <div className="space-y-4 border-b border-[var(--color-border)] pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]">
              {article.is_writeup ? "CTF Write-up" : article.category}
            </span>
            {article.has_spoilers === 1 && (
              <Badge variant="destructive" size="sm">
                MEMUAT SPOILER
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {article.title}
          </h1>

          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[#0d1222] font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <span className="font-bold text-[var(--color-accent)] block mb-1">Abstrak Riset:</span>
            {article.abstract}
          </div>

          {/* Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 font-mono text-xs text-[var(--color-text-muted)]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[var(--color-text)]">
                <User className="w-4 h-4 text-[var(--color-accent)]" />
                <span className="font-bold">{article.author_name}</span>
                {article.author_username && (
                  <span className="text-[var(--color-text-muted)] font-normal">(@{article.author_username})</span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(article.published_at || article.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-400" /> {article.views_count} views
              </span>
              <button
                onClick={handleLike}
                disabled={hasLiked}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  hasLiked
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-rose-500/40 text-[var(--color-text-muted)] hover:text-rose-400"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-rose-400" : ""}`} />
                <span>{likes}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Spoiler Guard Overlay if active */}
        {isSpoilerGated && (
          <div className="p-6 rounded-2xl border border-rose-500/40 bg-rose-500/5 text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-mono text-base font-bold text-rose-300">
                Peringatan Spoiler Tantangan CTF
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
                Artikel ini memuat alur penyelesaian (exploit path) dan flag tantangan. Pastikan Anda sudah mencoba tantangan tersebut terlebih dahulu.
              </p>
            </div>
            <button
              onClick={() => setRevealSpoiler(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-500 text-white font-mono text-xs font-bold hover:bg-rose-600 transition-colors cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka & Tampilkan Solusi Lengkap</span>
            </button>
          </div>
        )}

        {/* Article Markdown Body */}
        <article
          className={`space-y-4 font-sans text-sm leading-relaxed text-[var(--color-text)] transition-all ${
            isSpoilerGated ? "blur-md select-none pointer-events-none opacity-20" : ""
          }`}
        >
          <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed bg-[#0c101c] p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] overflow-x-auto">
            {article.content}
          </div>
        </article>

        {/* References Section */}
        {article.references && article.references.length > 0 && !isSpoilerGated && (
          <div className="space-y-3 pt-6 border-t border-[var(--color-border)]">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Sitasi & Referensi Eksternal</span>
            </h4>
            <ul className="space-y-2 font-mono text-xs">
              {article.references.map((ref: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-text-muted)]">[{idx + 1}]</span>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 break-all"
                  >
                    <span>{ref}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
