"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import {
  MessageSquare,
  Heart,
  Share2,
  Flag,
  PlusCircle,
  Search,
  Filter,
  Sparkles,
  Pin,
  Shield,
  Send,
  MoreVertical,
  Trash2,
  Edit,
  AlertTriangle,
  User,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Author {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
  comments?: Comment[];
}

const CATEGORIES = [
  "All",
  "General Discussion",
  "Linux & System Administration",
  "Networking",
  "Web Security",
  "Cryptography",
  "Digital Forensics",
  "Reverse Engineering",
  "CTF & Challenges",
  "Career & Certifications",
];

export default function CommunityPage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<"newest" | "popular">("newest");
  const [search, setSearch] = useState("");

  // Create post modal state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("General Discussion");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Expanded comments state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [activeComments, setActiveComments] = useState<Record<string, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});

  // Report modal state
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.append("category", category);
      if (search.trim()) params.append("search", search.trim());
      params.append("sort", sort);

      const res = await fetch(`/api/community/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to load community posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [category, sort, user]);

  const handleLike = async (postId: string) => {
    if (!user) {
      alert("Silakan masuk (login) terlebih dahulu untuk menyukai postingan.");
      return;
    }

    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, isLiked: data.isLiked, likesCount: data.likesCount }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }

    setExpandedPostId(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveComments((prev) => ({
          ...prev,
          [postId]: data.post.comments || [],
        }));
      }
    } catch (err) {
      console.error("Failed to fetch post comments:", err);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user) {
      alert("Silakan login untuk mengirimkan komentar.");
      return;
    }

    const text = newCommentText[postId];
    if (!text || text.trim().length === 0) return;

    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment],
        }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
          )
        );
        setNewCommentText((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (err) {
      console.error("Comment submit error:", err);
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsCreating(false);
        setNewTitle("");
        setNewContent("");
        fetchPosts();
      } else {
        setCreateError(data.error || "Gagal membuat diskusi.");
      }
    } catch {
      setCreateError("Tidak dapat terhubung ke server.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus diskusi ini?")) return;

    try {
      const res = await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        alert("Gagal menghapus diskusi.");
      }
    } catch (err) {
      console.error("Delete post error:", err);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPostId) return;

    try {
      const res = await fetch(`/api/community/posts/${reportingPostId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });
      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportingPostId(null);
          setReportReason("");
          setReportSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Report error:", err);
    }
  };

  return (
    <div className="min-h-screen py-8 space-y-8 max-w-6xl mx-auto font-mono">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm">
            <MessageSquare className="w-3.5 h-3.5 mr-1" />
            KOMUNITAS CYBERLAB-ID
          </Badge>
          <span className="text-xs text-[var(--color-text-muted)]">
            Forum Edukasi, Tanya Jawab &amp; Kolaborasi
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)]">
              Diskusi Komunitas
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
              Ruang berbagi pengetahuan, pemecahan kendala lab, writeup tantangan CTF, dan diskusi tren keamanan digital di Indonesia.
            </p>
          </div>

          <Button
            onClick={() => {
              if (!user) {
                alert("Silakan masuk (login) terlebih dahulu untuk membuat diskusi.");
                return;
              }
              setIsCreating(true);
            }}
            variant="primary"
            size="sm"
            className="flex items-center gap-2 text-xs font-mono self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Buat Diskusi Baru
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchPosts();
              }}
              placeholder="Cari topik diskusi atau kata kunci..."
              className="pl-9 font-mono text-xs"
            />
            <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setSort("newest")}
              className={`px-3 py-1.5 rounded transition-colors ${
                sort === "newest"
                  ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Terbaru
            </button>
            <button
              onClick={() => setSort("popular")}
              className={`px-3 py-1.5 rounded transition-colors ${
                sort === "popular"
                  ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Terpopuler
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--color-border-subtle)]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                category === cat
                  ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/50 font-bold"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border-subtle)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[var(--color-text-muted)]">
          Memuat postingan diskusi...
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] space-y-2">
          <MessageSquare className="w-8 h-8 mx-auto text-[var(--color-border)]" />
          <div>Belum ada diskusi dalam kategori ini. Jadilah yang pertama memulai topik!</div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isCommentsOpen = expandedPostId === post.id;
            const commentsList = activeComments[post.id] || [];
            const isAuthorOrAdmin = user && (user.id === post.author.id || user.role === "admin");

            return (
              <Card key={post.id} className="border-[var(--color-border)] overflow-hidden">
                <CardBody className="p-5 space-y-4 text-xs">
                  {/* Top bar: Author & Category & Actions */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-accent)] font-bold text-xs">
                        {post.author.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--color-text)]">
                            {post.author.displayName}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            @{post.author.username}
                          </span>
                          {post.author.role === "admin" && (
                            <Badge variant="accent" size="sm">
                              ADMIN
                            </Badge>
                          )}
                          {post.author.role === "moderator" && (
                            <Badge variant="warning" size="sm">
                              MOD
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {new Date(post.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {post.isPinned && (
                        <Badge variant="warning" size="sm" className="flex items-center gap-1">
                          <Pin className="w-3 h-3" /> Pinned
                        </Badge>
                      )}
                      <Badge variant="default" size="sm">
                        {post.category}
                      </Badge>

                      {isAuthorOrAdmin && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-[var(--color-text-muted)] hover:text-red-400 p-1"
                          title="Hapus Postingan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => setReportingPostId(post.id)}
                        className="text-[var(--color-text-muted)] hover:text-amber-400 p-1"
                        title="Laporkan Konten"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="space-y-2">
                    <h2 className="text-base font-bold text-[var(--color-text)]">
                      {post.title}
                    </h2>
                    <p className="text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  {/* Bottom Bar: Likes & Comments */}
                  <div className="flex items-center gap-4 pt-3 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.isLiked
                          ? "text-red-400 font-bold"
                          : "hover:text-[var(--color-text)]"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${post.isLiked ? "fill-red-400 text-red-400" : ""}`}
                      />
                      <span>{post.likesCount} Suka</span>
                    </button>

                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1.5 hover:text-[var(--color-accent)] transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.commentsCount} Komentar</span>
                    </button>
                  </div>

                  {/* Expandable Comments Drawer */}
                  {isCommentsOpen && (
                    <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4">
                      {/* Comment Input */}
                      <div className="flex items-center gap-2">
                        <Input
                          value={newCommentText[post.id] || ""}
                          onChange={(e) =>
                            setNewCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(post.id);
                          }}
                          placeholder={
                            user
                              ? "Tulis balasan atau penjelasan Anda..."
                              : "Silakan login untuk membalas diskusi..."
                          }
                          disabled={!user}
                          className="font-mono text-xs"
                        />
                        <Button
                          onClick={() => handleAddComment(post.id)}
                          disabled={
                            !user ||
                            commentLoading[post.id] ||
                            !newCommentText[post.id]?.trim()
                          }
                          variant="primary"
                          size="sm"
                          className="flex items-center gap-1 whitespace-nowrap text-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Kirim
                        </Button>
                      </div>

                      {/* Comments List */}
                      {commentsList.length > 0 ? (
                        <div className="space-y-2.5">
                          {commentsList.map((c) => (
                            <div
                              key={c.id}
                              className="p-3 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                                <span className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
                                  {c.author.displayName}
                                  {c.author.role === "admin" && (
                                    <span className="text-[10px] text-[var(--color-accent)] font-bold">
                                      [ADMIN]
                                    </span>
                                  )}
                                </span>
                                <span>
                                  {new Date(c.createdAt).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
                                {c.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 text-xs text-[var(--color-text-muted)]">
                          Belum ada balasan. Jadilah yang pertama memberikan tanggapan!
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Discussion Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[var(--color-accent)]" />
                Buat Topik Diskusi Baru
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs"
              >
                Tutup ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs font-mono">
              {createError && (
                <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400">
                  {createError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] block">Kategori Diskusi</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-md bg-[var(--color-background)] border border-[var(--color-border)] p-2.5 text-xs text-[var(--color-text)] font-mono focus:border-[var(--color-accent)] focus:outline-none"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] block">Judul Diskusi</label>
                <Input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Pertanyaan seputar implementasi parameterized query pada SQLite"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] block">Isi Pembahasan / Pertanyaan</label>
                <textarea
                  required
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Jelaskan pertanyaan atau topik Anda secara terperinci. Sertakan cuplikan kode atau skenario jika relevan..."
                  className="w-full rounded-md bg-[var(--color-background)] border border-[var(--color-border)] p-2.5 text-xs text-[var(--color-text)] font-mono focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
                <Button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  variant="outline"
                  size="sm"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createLoading}
                  variant="primary"
                  size="sm"
                >
                  {createLoading ? "Mempublikasikan..." : "Publikasikan Diskusi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingPostId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400" />
                Laporkan Konten Tidak Pantas
              </h3>
              <button
                onClick={() => setReportingPostId(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs"
              >
                Tutup ✕
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-bold">
                Laporan Anda telah berhasil diajukan untuk ditinjau oleh tim moderator.
              </div>
            ) : (
              <form onSubmit={handleReport} className="space-y-4 text-xs font-mono">
                <p className="text-[var(--color-text-muted)]">
                  Bantu kami menjaga ekosistem belajar CyberLab-ID tetap aman, ramah, dan profesional.
                </p>

                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)] block">Alasan Pelaporan:</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                    className="w-full rounded-md bg-[var(--color-background)] border border-[var(--color-border)] p-2.5 text-xs text-[var(--color-text)] font-mono focus:border-[var(--color-accent)] focus:outline-none"
                  >
                    <option value="">-- Pilih Kategori Pelanggaran --</option>
                    <option value="Spam atau Iklan Tidak Relevan">Spam atau Iklan Tidak Relevan</option>
                    <option value="Pelecehan atau Ujaran Kebencian">Pelecehan atau Ujaran Kebencian</option>
                    <option value="Distribusi Malware atau Script Berbahaya">Distribusi Malware atau Script Berbahaya</option>
                    <option value="Bocoran Flag CTF Tanpa Penjelasan / Spoiler">Bocoran Flag CTF Tanpa Penjelasan / Spoiler</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
                  <Button
                    type="button"
                    onClick={() => setReportingPostId(null)}
                    variant="outline"
                    size="sm"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={!reportReason}
                    variant="primary"
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Kirim Laporan
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
