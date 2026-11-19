"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  User,
  Send,
  Plus,
  Trash2,
  Sparkles,
  ShieldAlert,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronRight,
  Globe,
  Lightbulb,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: { title: string; category: string; topic: string; sourceUrl: string; snippet: string }[];
  feedback?: "up" | "down" | null;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  context_type: string;
  message_count: number;
  updated_at: string;
}

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [locale, setLocale] = useState<"id" | "en">("id");
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [feedbackNotes, setFeedbackNotes] = useState<string | null>(null);
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/ai/chat");
      const json = await res.json();
      if (json.success && json.conversations) {
        setConversations(json.conversations);
        if (!currentConvId && json.conversations.length > 0) {
          loadConversation(json.conversations[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadConversation = async (convId: string) => {
    try {
      setCurrentConvId(convId);
      const res = await fetch(`/api/ai/chat?conversationId=${convId}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    setInputPrompt("");
  };

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() || loading) return;

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      role: "user",
      content: promptToSend.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend.trim(),
          conversationId: currentConvId,
          locale,
          hintLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mendapatkan respon AI");

      if (data.conversationId && !currentConvId) {
        setCurrentConvId(data.conversationId);
        fetchConversations();
      }

      const assistantMsg: Message = {
        id: data.messageId,
        role: "assistant",
        content: data.reply,
        sources: data.sources || [],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: `Maaf, terjadi kendala saat memproses jawaban: ${err.message}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm("Hapus percakapan ini?")) return;
    try {
      const res = await fetch(`/api/ai/chat?conversationId=${convId}`, { method: "DELETE" });
      if (res.ok) {
        if (currentConvId === convId) {
          handleStartNewChat();
        }
        fetchConversations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Hapus seluruh riwayat percakapan AI Anda?")) return;
    try {
      const res = await fetch("/api/ai/chat?action=clear_all", { method: "DELETE" });
      if (res.ok) {
        setConversations([]);
        handleStartNewChat();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFeedback = async (msgId: string, feedback: "up" | "down") => {
    try {
      const res = await fetch(`/api/ai/messages/${msgId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, notes: feedbackNotes || "" }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, feedback } : m))
        );
        setFeedbackTargetId(null);
        setFeedbackNotes(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const samplePrompts = [
    "Bagaimana cara kerja proses TCP 3-Way Handshake?",
    "Apa itu SUID bit di Linux dan bagaimana cara eskalasi hak aksesnya?",
    "Jelaskan mekanisme serangan SQL Injection dan cara mencegahnya.",
    "Bagaimana cara mendeteksi malware melalui inspeksi Magic Bytes?",
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar: Conversations History */}
        <aside className="w-full md:w-72 bg-[#0c101c] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col justify-between shrink-0 h-[82vh]">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* New Chat Button */}
            <button
              onClick={handleStartNewChat}
              className="w-full py-2.5 px-3 rounded-xl bg-[var(--color-accent)] text-black font-mono font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Percakapan Baru</span>
            </button>

            {/* Conversation History List */}
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 font-mono text-xs scrollbar-thin">
              <span className="text-[10px] uppercase text-[var(--color-text-muted)] px-2 block font-bold">
                Riwayat Sesi Belajar
              </span>

              {conversations.length === 0 ? (
                <div className="py-8 text-center text-[var(--color-text-muted)] text-[11px]">
                  Belum ada percakapan tersimpan.
                </div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`group flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-pointer ${
                      currentConvId === c.id
                        ? "bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-white"
                    }`}
                    onClick={() => loadConversation(c.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Bot className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate text-xs">{c.title}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-rose-400 p-1"
                      title="Hapus percakapan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-muted)]">Bahasa:</span>
              <button
                onClick={() => setLocale(locale === "id" ? "en" : "id")}
                className="px-2 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)] hover:bg-white/5"
              >
                {locale === "id" ? "Bahasa Indonesia" : "English"}
              </button>
            </div>

            {conversations.length > 0 && (
              <button
                onClick={handleClearAll}
                className="w-full text-center text-rose-400/80 hover:text-rose-400 py-1 transition-colors block text-[10px]"
              >
                Hapus Seluruh Riwayat Percakapan
              </button>
            )}
          </div>
        </aside>

        {/* Main Chat Interface */}
        <main className="flex-1 bg-[#0c101c] border border-[var(--color-border)] rounded-2xl flex flex-col h-[82vh] overflow-hidden">
          {/* Header Bar */}
          <div className="p-4 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 bg-[#090d16]/60 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-mono text-sm font-bold text-white">CyberLab AI Learning Assistant</h2>
                  <Badge variant="accent" size="sm">
                    RAG Grounded
                  </Badge>
                </div>
                <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  Tutor siber berbasis materi kurikulum terverifikasi & panduan etis
                </p>
              </div>
            </div>

            {/* Hint Escalation Selector */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[var(--color-text-muted)] text-[11px] hidden sm:inline">
                Mode Petunjuk:
              </span>
              <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
                {[
                  { lvl: 1, label: "Konseptual" },
                  { lvl: 2, label: "Teknis" },
                  { lvl: 3, label: "Detail" },
                ].map((item) => (
                  <button
                    key={item.lvl}
                    onClick={() => setHintLevel(item.lvl)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                      hintLevel === item.lvl
                        ? "bg-[var(--color-accent)] text-black"
                        : "text-[var(--color-text-muted)] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6 py-12">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)]">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-mono text-base font-bold text-white">
                    Ada materi keamanan siber yang ingin Anda pelajari?
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Tanyakan seputar Linux, jaringan, eksploitasi web, kriptografi, forensik digital, atau minta penjelasan langkah praktikum lab.
                  </p>
                </div>

                {/* Quick Prompts */}
                <div className="w-full space-y-2 text-left font-mono text-xs">
                  {samplePrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(undefined, p)}
                      className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 text-[var(--color-text-secondary)] hover:text-white transition-all flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="truncate">{p}</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-2 text-[var(--color-accent)]" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/40 flex items-center justify-center text-[var(--color-accent)] shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 space-y-3 font-sans text-xs sm:text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-white"
                        : "bg-[#0d1222] border border-[var(--color-border)] text-[var(--color-text)] shadow"
                    }`}
                  >
                    {/* Content */}
                    <div className="whitespace-pre-wrap font-sans leading-relaxed">
                      {msg.content}
                    </div>

                    {/* Grounded Sources Pills (if present) */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-2">
                        <span className="font-mono text-[10px] uppercase text-[var(--color-accent)] font-bold block flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" />
                          <span>Referensi Materi Terverifikasi:</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((s, idx) => (
                            <Link
                              key={idx}
                              href={s.sourceUrl}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-[var(--color-border)] hover:border-[var(--color-accent)] font-mono text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                            >
                              <span>{s.title}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assistant Message Feedback Controls */}
                    {msg.role === "assistant" && (
                      <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[var(--color-text-muted)] border-t border-[var(--color-border-subtle)]/40">
                        <span className="text-[10px]">Edukasi Defensif CyberLab-ID</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFeedback(msg.id, "up")}
                            className={`p-1 rounded hover:bg-white/10 ${
                              msg.feedback === "up" ? "text-emerald-400 font-bold" : ""
                            }`}
                            title="Jawaban membantu"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, "down")}
                            className={`p-1 rounded hover:bg-white/10 ${
                              msg.feedback === "down" ? "text-rose-400 font-bold" : ""
                            }`}
                            title="Jawaban kurang memuaskan"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-white shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/40 flex items-center justify-center text-[var(--color-accent)] shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-[#0d1222] border border-[var(--color-border)] font-mono text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-ping" />
                  <span>AI Assistant sedang menelaah basis materi dan menyusun penjelasan...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Prompt Box */}
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className="p-4 border-t border-[var(--color-border)] bg-[#090d16] flex items-center gap-3"
          >
            <input
              type="text"
              placeholder={
                locale === "id"
                  ? "Tanyakan konsep keamanan siber, perintah Linux, atau minta petunjuk lab..."
                  : "Ask about cybersecurity concepts, Linux commands, or progressive lab hints..."
              }
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs sm:text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="px-5 py-3 rounded-xl bg-[var(--color-accent)] text-black font-mono font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
