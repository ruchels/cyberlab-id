"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  RefreshCw,
  Search,
  BookOpen,
} from "lucide-react";
import { Badge, Card, CardHeader, CardContent } from "@/components/ui";

interface QuizItem {
  id: string;
  topic: string;
  category: string;
  difficulty: string;
  question: string;
  options: string[];
  explanation: string;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  // Current Question Player State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [evaluation, setEvaluation] = useState<{ isCorrect: boolean; correctAnswer: string; explanation: string; xpAwarded: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, [selectedCategory, selectedDifficulty]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      let url = "/api/ai/quizzes?status=approved";
      if (selectedCategory !== "all") url += `&category=${selectedCategory}`;
      if (selectedDifficulty !== "all") url += `&difficulty=${selectedDifficulty}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.quizzes) {
        setQuizzes(json.quizzes);
        setCurrentIndex(0);
        setSelectedOption(null);
        setSubmitted(false);
        setEvaluation(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentQuiz = quizzes[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!currentQuiz || !selectedOption || submitting) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/ai/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_quiz",
          quizId: currentQuiz.id,
          selectedAnswer: selectedOption,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim jawaban");

      setEvaluation(data);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setSubmitted(false);
      setEvaluation(null);
    } else {
      // Loop or restart
      setCurrentIndex(0);
      setSelectedOption(null);
      setSubmitted(false);
      setEvaluation(null);
    }
  };

  const categories = [
    { key: "all", label: "Semua Kategori" },
    { key: "linux", label: "Linux & System" },
    { key: "networking", label: "Jaringan TCP/IP" },
    { key: "web", label: "Web Security" },
    { key: "cryptography", label: "Kriptografi" },
    { key: "reverse-engineering", label: "Reverse Engineering" },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-[var(--color-text)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono">
            <Sparkles className="w-4 h-4" />
            <span>AI Adaptive Quiz & Knowledge Retention</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Latihan Kuis Adaptif <span className="text-[var(--color-accent)]">CyberLab-ID</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto">
            Uji pemahaman konsep keamanan siber melalui soal skenario interaktif yang disesuaikan dengan kurikulum pembelajaran.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCategory(c.key)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedCategory === c.key
                  ? "bg-[var(--color-accent)] text-black font-bold"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Quiz Player */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-[var(--color-text-muted)]">
            Menyiapkan bank kuis adaptif...
          </div>
        ) : quizzes.length === 0 ? (
          <div className="p-8 rounded-2xl border border-[var(--color-border)] bg-[#0d121f] text-center font-mono text-xs text-[var(--color-text-muted)] space-y-3">
            <HelpCircle className="w-8 h-8 mx-auto text-[var(--color-text-muted)] opacity-40" />
            <p>Belum ada kuis yang disetujui untuk kategori ini.</p>
          </div>
        ) : currentQuiz ? (
          <div className="p-6 sm:p-10 rounded-3xl border border-[var(--color-border)] bg-[#0d1222] shadow-2xl space-y-6">
            {/* Question Progress and Category Badge */}
            <div className="flex items-center justify-between font-mono text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)] pb-4">
              <span className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] uppercase text-[10px]">
                  {currentQuiz.category}
                </span>
                <span className="text-white font-bold">{currentQuiz.topic}</span>
              </span>
              <span>
                Soal {currentIndex + 1} dari {quizzes.length}
              </span>
            </div>

            {/* Question Title */}
            <h2 className="text-lg sm:text-xl font-bold text-white font-sans leading-snug">
              {currentQuiz.question}
            </h2>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQuiz.options?.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                let optionStyle =
                  "border-[var(--color-border)] bg-[#0c101c] hover:border-[var(--color-accent)]/50 text-[var(--color-text)]";

                if (submitted && evaluation) {
                  if (opt === evaluation.correctAnswer) {
                    optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold";
                  } else if (isSelected && !evaluation.isCorrect) {
                    optionStyle = "border-rose-500 bg-rose-500/10 text-rose-300 line-through";
                  } else {
                    optionStyle = "border-[var(--color-border)] bg-[#0c101c] opacity-40";
                  }
                } else if (isSelected) {
                  optionStyle = "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => !submitted && setSelectedOption(opt)}
                    disabled={submitted}
                    className={`w-full p-4 rounded-xl border text-left font-mono text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                  >
                    <span>{opt}</span>
                    {submitted && evaluation && opt === evaluation.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {submitted && evaluation && isSelected && !evaluation.isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Evaluation Result Banner */}
            {submitted && evaluation && (
              <div
                className={`p-5 rounded-2xl border space-y-2 font-mono text-xs ${
                  evaluation.isCorrect
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {evaluation.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Benar! +{evaluation.xpAwarded} XP ditambahkan.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Belum tepat. Jawaban benar: {evaluation.correctAnswer}</span>
                    </>
                  )}
                </div>
                <p className="text-[var(--color-text-secondary)] font-sans text-xs leading-relaxed pt-1">
                  <strong>Penjelasan Edukatif:</strong> {evaluation.explanation}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-[var(--color-border-subtle)]">
              {!submitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption || submitting}
                  className="px-6 py-3 rounded-xl bg-[var(--color-accent)] text-black font-mono font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>{submitting ? "Memeriksa..." : "Kirim Jawaban"}</span>
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 rounded-xl bg-[var(--color-accent)] text-black font-mono font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
                >
                  <span>{currentIndex < quizzes.length - 1 ? "Soal Berikutnya" : "Mulai Ulang Kuis"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                Tingkat: <strong className="capitalize text-white">{currentQuiz.difficulty}</strong>
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
