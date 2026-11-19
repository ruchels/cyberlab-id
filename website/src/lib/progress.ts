"use client";

import { useState, useEffect } from "react";

export interface ActivityItem {
  id: string;
  type: "lesson" | "lab" | "challenge" | "badge";
  title: string;
  timestamp: string;
}

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "linux" | "network" | "crypto" | "forensics" | "web" | "reverse" | "general";
  requiredPoints?: number;
}

export const BADGES_LIST: BadgeItem[] = [
  {
    id: "terminal-initiate",
    title: "Terminal Initiate",
    description: "Selesaikan praktikum lab Linux Command Line Fundamentals.",
    icon: "Terminal",
    category: "linux",
  },
  {
    id: "packet-detective",
    title: "Packet Detective",
    description: "Selesaikan praktikum analisis packet sniffing & inspeksi HTTP/DNS.",
    icon: "Network",
    category: "network",
  },
  {
    id: "web-defender",
    title: "Web App Defender",
    description: "Selesaikan praktikum identifikasi SQL Injection & XSS mitigations.",
    icon: "Globe",
    category: "web",
  },
  {
    id: "cipher-breaker",
    title: "Cipher Breaker",
    description: "Pecahkan lab dekripsi multi-stage (Base64 + XOR stream cipher).",
    icon: "KeyRound",
    category: "crypto",
  },
  {
    id: "forensic-sleuth",
    title: "Forensic Sleuth",
    description: "Pulihkan berkas rusak menggunakan rekonstruksi Magic Bytes header.",
    icon: "Binary",
    category: "forensics",
  },
  {
    id: "reverse-apprentice",
    title: "Reverse Apprentice",
    description: "Eksplorasi register CPU x86 dan analisis instruksi assembly crackme.",
    icon: "Cpu",
    category: "reverse",
  },
  {
    id: "centurion-scholar",
    title: "Centurion Scholar",
    description: "Kumpulkan 100+ Poin XP dari CTF challenges dan modul pembelajaran.",
    icon: "Trophy",
    category: "general",
    requiredPoints: 100,
  },
  {
    id: "master-defender",
    title: "Master of CyberLab-ID",
    description: "Kumpulkan 250+ Poin XP dan selesaikan minimal 4 praktikum lab.",
    icon: "Shield",
    category: "general",
    requiredPoints: 250,
  },
];

const STORAGE_KEY = "cyberlab_user_progress_v2";

export interface UserProgress {
  completedLessons: string[];
  completedLabs: string[];
  solvedChallenges: string[];
  unlockedBadges: string[];
  quizScores: Record<string, number>;
  activityLog: ActivityItem[];
}

const DEFAULT_PROGRESS: UserProgress = {
  completedLessons: [],
  completedLabs: [],
  solvedChallenges: [],
  unlockedBadges: [],
  quizScores: {},
  activityLog: [],
};

export function getStoredProgress(): UserProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse progress from localStorage:", err);
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event("cyberlab_progress_updated"));
  } catch (err) {
    console.error("Failed to save progress to localStorage:", err);
  }
}

export function useProgress() {
  const [progress, setProgressState] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [mounted, setMounted] = useState(false);

  const refresh = () => {
    setProgressState(getStoredProgress());
  };

  useEffect(() => {
    setMounted(true);
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener("cyberlab_progress_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("cyberlab_progress_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const toggleLessonComplete = (lessonId: string, lessonTitle: string) => {
    const current = getStoredProgress();
    const isCompleted = current.completedLessons.includes(lessonId);
    let updatedLessons: string[];

    if (isCompleted) {
      updatedLessons = current.completedLessons.filter((id) => id !== lessonId);
    } else {
      updatedLessons = [...current.completedLessons, lessonId];
    }

    const activity: ActivityItem = {
      id: `act_${Date.now()}`,
      type: "lesson",
      title: isCompleted ? `Dibatalkan: ${lessonTitle}` : `Menyelesaikan: ${lessonTitle}`,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    const newProgress: UserProgress = {
      ...current,
      completedLessons: updatedLessons,
      activityLog: [activity, ...current.activityLog.slice(0, 19)],
    };

    saveProgress(newProgress);
    setProgressState(newProgress);
  };

  const completeLab = (labId: string, labTitle: string, badgeToUnlock?: string) => {
    const current = getStoredProgress();
    if (current.completedLabs.includes(labId)) return;

    const updatedLabs = [...current.completedLabs, labId];
    const updatedBadges = [...current.unlockedBadges];

    if (badgeToUnlock && !updatedBadges.includes(badgeToUnlock)) {
      updatedBadges.push(badgeToUnlock);
    }

    const activity: ActivityItem = {
      id: `act_${Date.now()}`,
      type: "lab",
      title: `Menyelesaikan Lab: ${labTitle}`,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    const newProgress: UserProgress = {
      ...current,
      completedLabs: updatedLabs,
      unlockedBadges: updatedBadges,
      activityLog: [activity, ...current.activityLog.slice(0, 19)],
    };

    saveProgress(newProgress);
    setProgressState(newProgress);
  };

  const recordChallengeSolved = (challengeId: string, challengeTitle: string, points: number) => {
    const current = getStoredProgress();
    if (current.solvedChallenges.includes(challengeId)) return;

    const updatedChallenges = [...current.solvedChallenges, challengeId];
    const newProgress: UserProgress = {
      ...current,
      solvedChallenges: updatedChallenges,
      activityLog: [
        {
          id: `act_${Date.now()}`,
          type: "challenge",
          title: `Solved CTF: ${challengeTitle} (+${points} Pts)`,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
        ...current.activityLog.slice(0, 19),
      ],
    };

    saveProgress(newProgress);
    setProgressState(newProgress);
  };

  const recordQuizResult = (lessonId: string, score: number, total: number) => {
    const current = getStoredProgress();
    const newScores = { ...current.quizScores, [lessonId]: score };
    const newProgress: UserProgress = {
      ...current,
      quizScores: newScores,
    };
    saveProgress(newProgress);
    setProgressState(newProgress);
  };

  const resetAllProgress = () => {
    saveProgress(DEFAULT_PROGRESS);
    setProgressState(DEFAULT_PROGRESS);
  };

  return {
    progress,
    mounted,
    toggleLessonComplete,
    completeLab,
    recordChallengeSolved,
    recordQuizResult,
    resetAllProgress,
  };
}
