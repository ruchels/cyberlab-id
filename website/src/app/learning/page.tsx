"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import {
  BookOpen,
  Terminal,
  Network,
  Globe,
  Lock,
  Search,
  Cpu,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { MODULES_DATA } from "@/data/modules";
import { useProgress } from "@/lib/progress";

export default function LearningPage() {
  const { progress } = useProgress();
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    linux: true,
    networking: true,
    "web-security": true,
    cryptography: true,
    "digital-forensics": true,
    "reverse-engineering": true,
  });

  const iconMap: Record<string, React.ElementType> = {
    linux: Terminal,
    networking: Network,
    "web-security": Globe,
    cryptography: Lock,
    "digital-forensics": Search,
    "reverse-engineering": Cpu,
  };

  const toggleExpand = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredModules = MODULES_DATA.filter((m) => {
    const matchesDifficulty =
      selectedDifficulty === "all" || m.difficulty === selectedDifficulty;
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      m.topics.some((top) => top.title.toLowerCase().includes(search.toLowerCase()));
    return matchesDifficulty && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Structured Cybersecurity Tracks</span>
          </div>
          <h1 className="text-3xl font-mono font-bold text-[var(--color-text)]">
            Kurikulum &amp; Manajemen Pembelajaran
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">
            Jalur pembelajaran terstruktur dari fondasi sistemik hingga teknik audit forensik. Lengkap dengan target capaian, studi kasus praktis, dan evaluasi pemahaman mandiri.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="accent" size="md">
            6 Kategori Inti
          </Badge>
          <Link href="/progress">
            <Button variant="secondary" size="sm" className="font-mono">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Progres Saya
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {["all", "beginner", "intermediate", "advanced"].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer capitalize ${
                selectedDifficulty === diff
                  ? "bg-[var(--color-accent)] text-[#05080e] font-bold"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
              }`}
            >
              {diff === "all" ? "Semua Tingkat" : diff}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Cari modul atau topik bahasan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        {filteredModules.map((module) => {
          const Icon = iconMap[module.id] || BookOpen;
          const isExpanded = expandedModules[module.id];
          const completedCount = module.topics.filter((t) =>
            progress.completedLessons.includes(t.id)
          ).length;
          const progressPercent = Math.round((completedCount / module.topics.length) * 100);

          return (
            <Card key={module.id} className="transition-all duration-200">
              <CardHeader
                className="cursor-pointer hover:bg-[var(--color-surface-elevated)]/40 transition-colors"
                onClick={() => toggleExpand(module.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-mono font-bold text-[var(--color-text)]">
                          {module.title}
                        </h2>
                        <Badge variant="default" size="sm">
                          {module.level}
                        </Badge>
                        <span className="text-[11px] font-mono text-[var(--color-text-muted)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {module.estimatedHours}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-3xl line-clamp-2">
                        {module.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right font-mono text-xs">
                      <div className="text-[var(--color-accent)] font-semibold">
                        {completedCount} / {module.topics.length} Selesai
                      </div>
                      <div className="w-24 h-1.5 rounded-full bg-[var(--color-surface-elevated)] mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-accent)] transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <button
                      className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      aria-label="Toggle Topic List"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardBody className="pt-2 pb-5 border-t border-[var(--color-border-subtle)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {module.topics.map((topic) => {
                      const isReady = topic.status === "ready";
                      const isDone = progress.completedLessons.includes(topic.id);

                      return (
                        <Link
                          key={topic.id}
                          href={isReady ? `/learning/${module.id}/${topic.id}` : "#"}
                          className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 text-xs font-mono transition-all ${
                            isReady
                              ? isDone
                                ? "bg-emerald-950/20 border-emerald-800/80 hover:border-emerald-600"
                                : "bg-[var(--color-surface-elevated)]/60 border-[var(--color-border)] hover:border-[var(--color-accent)] hover:shadow-sm"
                              : "bg-[var(--color-surface)]/40 border-[var(--color-border-subtle)] opacity-60 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="text-[var(--color-text-muted)] w-5 text-right font-bold">
                              {topic.order}.
                            </span>
                            <span
                              className={`font-semibold truncate ${
                                isDone ? "text-emerald-300" : "text-[var(--color-text)]"
                              }`}
                            >
                              {topic.title}
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {topic.durationMinutes && (
                              <span className="text-[10px] text-[var(--color-text-muted)] hidden sm:inline">
                                {topic.durationMinutes}m
                              </span>
                            )}
                            {isReady ? (
                              isDone ? (
                                <Badge variant="success" size="sm">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Selesai</span>
                                </Badge>
                              ) : (
                                <Badge variant="accent" size="sm">
                                  <span>Buka Pelajaran →</span>
                                </Badge>
                              )
                            ) : (
                              <Badge variant="default" size="sm">
                                <span>Segera Rilis</span>
                              </Badge>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardBody>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
