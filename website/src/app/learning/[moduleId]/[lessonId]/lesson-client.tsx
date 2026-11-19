"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lesson } from "@/data/lessons";
import { ModuleTrack, Topic } from "@/data/modules";
import { useProgress } from "@/lib/progress";
import { Card, CardHeader, CardBody, Badge, Button, CodeBlock } from "@/components/ui";
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Check,
  X,
  Wrench,
  FlaskConical,
  ListOrdered,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

interface Props {
  lesson: Lesson;
  moduleTrack: ModuleTrack;
  prevTopic: Topic | null;
  nextTopic: Topic | null;
}

export function LessonViewerClient({ lesson, moduleTrack, prevTopic, nextTopic }: Props) {
  const { progress, toggleLessonComplete, recordQuizResult } = useProgress();
  const isCompleted = progress.completedLessons.includes(lesson.id);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submittedQuiz) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const calculateScore = () => {
    let correct = 0;
    lesson.knowledgeCheck.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return correct;
  };

  const handleQuizSubmit = () => {
    const score = calculateScore();
    setSubmittedQuiz(true);
    recordQuizResult(lesson.id, score, lesson.knowledgeCheck.length);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setSubmittedQuiz(false);
  };

  const score = submittedQuiz ? calculateScore() : 0;
  const totalQuestions = lesson.knowledgeCheck.length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]">
        <Link href="/learning" className="hover:text-[var(--color-accent)] transition-colors">
          Pembelajaran
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          href={`/learning#${moduleTrack.id}`}
          className="hover:text-[var(--color-accent)] transition-colors"
        >
          {moduleTrack.title}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[var(--color-text)] font-semibold truncate max-w-xs">
          {lesson.title}
        </span>
      </div>

      {/* Lesson Header Banner */}
      <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="accent" size="sm">
                {moduleTrack.title}
              </Badge>
              <Badge variant="default" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                {lesson.durationMinutes} Menit
              </Badge>
              <Badge
                variant={
                  lesson.difficulty === "beginner"
                    ? "default"
                    : lesson.difficulty === "intermediate"
                    ? "warning"
                    : "danger"
                }
                size="sm"
              >
                {lesson.difficulty.toUpperCase()}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-[var(--color-text)]">
              {lesson.title}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-3xl leading-relaxed">
              {lesson.description}
            </p>
          </div>

          <div className="flex sm:flex-col items-center gap-2 shrink-0">
            <Button
              variant={isCompleted ? "primary" : "secondary"}
              size="md"
              className="font-mono w-full"
              onClick={() => toggleLessonComplete(lesson.id, lesson.title)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isCompleted ? "Selesai Dipelajari" : "Tandai Selesai"}
            </Button>
          </div>
        </div>

        {/* Learning Objectives Box */}
        <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)]/60 border border-[var(--color-border-subtle)] space-y-2">
          <div className="text-xs font-mono font-bold text-[var(--color-accent)] flex items-center gap-1.5 uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Target Capaian Pembelajaran (Learning Objectives)</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
            {lesson.objectives.map((obj, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[var(--color-accent)] font-bold">✓</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Content Sections */}
          <div className="space-y-8">
            {lesson.sections.map((section, idx) => (
              <section key={idx} className="space-y-4">
                <h2 className="text-lg font-mono font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2 flex items-center gap-2">
                  <span className="text-[var(--color-accent)]">{idx + 1}.</span>
                  <span>{section.title}</span>
                </h2>
                <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line font-sans">
                  {section.content}
                </div>
                {section.codeSnippet && (
                  <CodeBlock
                    language={section.codeSnippet.language}
                    filename={section.codeSnippet.filename}
                    code={section.codeSnippet.code}
                    showLineNumbers={true}
                  />
                )}
              </section>
            ))}
          </div>

          {/* Related Tools / Lab CTA */}
          {(lesson.relatedToolId || lesson.relatedLabId) && (
            <div className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                Praktik &amp; Eksperimen Terkait:
              </h3>
              <div className="flex flex-wrap gap-3">
                {lesson.relatedLabId && (
                  <Link href={`/labs#${lesson.relatedLabId}`}>
                    <Button variant="secondary" size="sm" className="font-mono">
                      <FlaskConical className="w-4 h-4 mr-1.5 text-amber-400" />
                      Buka Hands-on Lab
                    </Button>
                  </Link>
                )}
                {lesson.relatedToolId && (
                  <Link href={`/tools/${lesson.relatedToolId}`}>
                    <Button variant="secondary" size="sm" className="font-mono">
                      <Wrench className="w-4 h-4 mr-1.5 text-[var(--color-accent)]" />
                      Buka Interactive Tool
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Interactive Knowledge Check (Quiz) */}
          {lesson.knowledgeCheck.length > 0 && (
            <Card className="border-[var(--color-border)]">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-mono text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[var(--color-accent)]" />
                    Knowledge Check &amp; Refleksi Pemahaman
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Uji pemahaman Anda terhadap konsep yang baru dipelajari. Jawaban dinilai instan dengan pembahasan detail.
                  </p>
                </div>
                {submittedQuiz && (
                  <Badge variant={score === totalQuestions ? "success" : "warning"} size="md">
                    Skor: {score}/{totalQuestions}
                  </Badge>
                )}
              </CardHeader>

              <CardBody className="space-y-6">
                {lesson.knowledgeCheck.map((q, qIdx) => {
                  const userAnswer = selectedAnswers[q.id];
                  const isAnswered = userAnswer !== undefined;
                  const isCorrect = userAnswer === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-lg bg-[var(--color-surface-elevated)]/40 border border-[var(--color-border-subtle)] space-y-3 font-mono text-xs"
                    >
                      <div className="font-bold text-[var(--color-text)] flex items-start gap-2">
                        <span className="text-[var(--color-accent)]">Q{qIdx + 1}.</span>
                        <span>{q.question}</span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAnswer === optIdx;
                          let optStyle =
                            "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]";

                          if (submittedQuiz) {
                            if (optIdx === q.correctIndex) {
                              optStyle =
                                "border-emerald-700 bg-emerald-950/40 text-emerald-300 font-bold";
                            } else if (isSelected && !isCorrect) {
                              optStyle = "border-rose-700 bg-rose-950/40 text-rose-300";
                            }
                          } else if (isSelected) {
                            optStyle =
                              "border-[var(--color-accent)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] font-semibold";
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={submittedQuiz}
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              className={`w-full text-left p-3 rounded border transition-colors flex items-center justify-between gap-3 cursor-pointer ${optStyle}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {submittedQuiz && optIdx === q.correctIndex && (
                                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                              {submittedQuiz && isSelected && !isCorrect && (
                                <X className="w-4 h-4 text-rose-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {submittedQuiz && (
                        <div
                          className={`p-3 rounded mt-2 text-[11px] leading-relaxed border ${
                            isCorrect
                              ? "bg-emerald-950/30 border-emerald-800/80 text-emerald-200"
                              : "bg-amber-950/30 border-amber-800/80 text-amber-200"
                          }`}
                        >
                          <strong>💡 Pembahasan:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-2">
                  {!submittedQuiz ? (
                    <Button
                      size="sm"
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(selectedAnswers).length < totalQuestions}
                    >
                      Periksa Jawaban
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={handleResetQuiz}>
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Ulangi Kuis
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Navigation Controls: Prev & Next Lesson */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--color-border)]">
            {prevTopic ? (
              <Link
                href={`/learning/${moduleTrack.id}/${prevTopic.id}`}
                className="w-full sm:w-auto"
              >
                <Button variant="secondary" size="sm" className="w-full sm:w-auto font-mono">
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Sebelumnya: {prevTopic.title}
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {nextTopic && (
              <Link
                href={`/learning/${moduleTrack.id}/${nextTopic.id}`}
                className="w-full sm:w-auto"
              >
                <Button variant="primary" size="sm" className="w-full sm:w-auto font-mono">
                  Selanjutnya: {nextTopic.title}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar: Module Outline & Navigation */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="sticky top-20">
            <CardHeader>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)] flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-[var(--color-accent)]" />
                Daftar Topik: {moduleTrack.title}
              </h3>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-[var(--color-border-subtle)] text-xs font-mono">
                {moduleTrack.topics.map((t) => {
                  const isActive = t.id === lesson.id;
                  const isLessonDone = progress.completedLessons.includes(t.id);

                  return (
                    <Link
                      key={t.id}
                      href={`/learning/${moduleTrack.id}/${t.id}`}
                      className={`px-4 py-3 flex items-center justify-between gap-2 transition-colors ${
                        isActive
                          ? "bg-[var(--color-surface-elevated)] text-[var(--color-accent)] font-bold border-l-2 border-[var(--color-accent)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]/40 hover:text-[var(--color-text)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="opacity-50 text-[10px] w-4">{t.order}.</span>
                        <span className="truncate">{t.title}</span>
                      </div>
                      {isLessonDone && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
