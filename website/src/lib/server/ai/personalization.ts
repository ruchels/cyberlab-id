import { getDb } from "../db.ts";

export interface DomainScore {
  domain: string;
  name: string;
  score: number; // 0 to 100
  completedCount: number;
  totalModules: number;
  level: "Novice" | "Apprentice" | "Practitioner" | "Specialist";
}

export interface RecommendationItem {
  id: string;
  title: string;
  type: "lesson" | "lab" | "challenge" | "academy_path";
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  url: string;
  rationale: string;
}

export interface PersonalizedPathResult {
  isPersonalizationEnabled: boolean;
  overallLevel: string;
  totalXp: number;
  weeklyTargetHours: number;
  weeklyCompletedHours: number;
  domainScores: DomainScore[];
  strongestDomain: string;
  weakestDomain: string;
  recommendedNextActivity: RecommendationItem;
  recommendedChallenges: RecommendationItem[];
  suggestedLabs: RecommendationItem[];
  learningMilestones: { title: string; isAchieved: boolean; xpReward: number }[];
}

export function generatePersonalizedPath(userId: string): PersonalizedPathResult {
  const db = getDb();

  // 1. Check user preferences
  const pref = db.prepare("SELECT * FROM ai_user_preferences WHERE user_id = ?").get(userId) as any;
  const isEnabled = pref ? pref.is_personalization_enabled === 1 : true;
  const targetHours = pref?.weekly_target_hours || 5;

  // 2. Fetch User Stats
  const user = db.prepare("SELECT id, username, display_name, total_xp FROM users WHERE id = ?").get(userId) as any;
  const totalXp = user?.total_xp || 0;

  // 3. Fetch Solved CTFs & Completed Labs
  const ctfSolves = db.prepare("SELECT challenge_id FROM ctf_solves WHERE user_id = ?").all(userId) as any[];
  const labCompletions = db.prepare("SELECT template_id FROM lab_completions WHERE user_id = ?").all(userId) as any[];
  const academyEnrollments = db.prepare("SELECT path_id, progress_percent, completed_items FROM academy_enrollments WHERE user_id = ?").all(userId) as any[];

  const solvedChallengeIds = new Set(ctfSolves.map((s) => s.challenge_id));
  const completedLabIds = new Set(labCompletions.map((l) => l.template_id));

  // Domain definitions
  const domains = [
    { key: "linux", name: "Linux & SysAdmin", total: 4 },
    { key: "networking", name: "Networking & Protocols", total: 4 },
    { key: "web-security", name: "Web Application Security", total: 4 },
    { key: "cryptography", name: "Applied Cryptography", total: 4 },
    { key: "digital-forensics", name: "Digital Forensics", total: 4 },
    { key: "reverse-engineering", name: "Reverse Engineering", total: 4 },
  ];

  const domainScores: DomainScore[] = domains.map((d) => {
    // Heuristic: compute points based on academy enrollments + completed items + labs
    let completedCount = 0;
    for (const enr of academyEnrollments) {
      if (enr.path_id.includes(d.key)) {
        try {
          const items = JSON.parse(enr.completed_items);
          completedCount += items.length;
        } catch {}
      }
    }

    // Also factor labs completed
    if (d.key === "linux" && completedLabIds.has("tpl-linux-core")) completedCount += 2;
    if (d.key === "networking" && completedLabIds.has("tpl-net-topo")) completedCount += 2;
    if (d.key === "web-security" && completedLabIds.has("tpl-web-owasp")) completedCount += 2;
    if (d.key === "digital-forensics" && completedLabIds.has("tpl-forensic-disk")) completedCount += 2;
    if (d.key === "reverse-engineering" && completedLabIds.has("tpl-rev-x86")) completedCount += 2;

    const percentage = Math.min(100, Math.round((completedCount / d.total) * 100));
    let level: "Novice" | "Apprentice" | "Practitioner" | "Specialist" = "Novice";
    if (percentage >= 75) level = "Specialist";
    else if (percentage >= 50) level = "Practitioner";
    else if (percentage >= 25) level = "Apprentice";

    return {
      domain: d.key,
      name: d.name,
      score: percentage,
      completedCount,
      totalModules: d.total,
      level,
    };
  });

  // Sort domains by score
  const sortedDomains = [...domainScores].sort((a, b) => b.score - a.score);
  const strongestDomain = sortedDomains[0]?.name || "Linux";
  const weakestDomain = sortedDomains[sortedDomains.length - 1]?.name || "Reverse Engineering";
  const weakestKey = sortedDomains[sortedDomains.length - 1]?.domain || "reverse-engineering";

  // Calculate Overall Level
  let overallLevel = "Beginner (Tingkat Pemula)";
  if (totalXp >= 800) overallLevel = "Advanced (Tingkat Lanjut)";
  else if (totalXp >= 300) overallLevel = "Intermediate (Tingkat Menengah)";

  // Recommended Next Activity based on weakest domain
  const recommendedNextActivity: RecommendationItem = {
    id: `rec-next-${weakestKey}`,
    title: `Penguatan Domain: ${weakestDomain}`,
    type: "academy_path",
    category: weakestKey,
    difficulty: totalXp > 300 ? "intermediate" : "beginner",
    url: `/academy/path-${weakestKey === "web-security" ? "web-appsec" : weakestKey === "reverse-engineering" ? "reverse-engineering" : weakestKey}`,
    rationale: isEnabled
      ? `AI mendeteksi domain ${weakestDomain} memiliki progres paling sedikit (${sortedDomains[sortedDomains.length - 1]?.score}%). Menyelesaikan jalur ini akan menyeimbangkan kompetensi siber Anda.`
      : "Rekomendasi kurikulum standar untuk memulai eksplorasi keamanan terstruktur.",
  };

  // Recommended Challenges: match skill level and avoid already solved
  const allChallenges = [
    { id: "base64-mystery", title: "Base64 Mystery", cat: "cryptography", diff: "beginner", pts: 25 },
    { id: "caesar-salat", title: "Caesar Salad", cat: "cryptography", diff: "beginner", pts: 30 },
    { id: "linux-privilege-audit", title: "Linux Privilege Audit", cat: "linux", diff: "intermediate", pts: 50 },
    { id: "multi-stage-flag-hunt", title: "Multi-Stage Flag Hunt", cat: "forensics", diff: "intermediate", pts: 75 },
    { id: "sql-injection-bypass", title: "Auth Bypass SQLi", cat: "web-security", diff: "intermediate", pts: 60 },
  ];

  const recommendedChallenges: RecommendationItem[] = allChallenges
    .filter((c) => !solvedChallengeIds.has(c.id))
    .slice(0, 3)
    .map((c) => ({
      id: c.id,
      title: c.title,
      type: "challenge",
      category: c.cat,
      difficulty: c.diff as any,
      url: `/challenges`,
      rationale: `Tantangan tingkat ${c.diff} yang ideal untuk menguji pemahaman praktis Anda (+${c.pts} XP).`,
    }));

  // Suggested Labs
  const suggestedLabs: RecommendationItem[] = [
    {
      id: "tpl-linux-core",
      title: "Linux System Hardening Sandbox",
      type: "lab",
      category: "linux",
      difficulty: "beginner",
      url: "/range",
      rationale: "Praktik langsung perizinan berkas dan SUID bit di terminal terisolasi.",
    },
    {
      id: "tpl-web-owasp",
      title: "OWASP Vulnerability Lab",
      type: "lab",
      category: "web-security",
      difficulty: "intermediate",
      url: "/range",
      rationale: "Simulasi eksploitasi dan remediasi SQL Injection dan XSS.",
    },
    {
      id: "tpl-net-topo",
      title: "Network Routing & Gateway Topology",
      type: "lab",
      category: "networking",
      difficulty: "intermediate",
      url: "/range",
      rationale: "Analisis rute paket TCP/IP dan filter subnet.",
    },
  ];

  // Milestones
  const milestones = [
    { title: "Selesaikan 1 Praktikum Cyber Range", isAchieved: labCompletions.length >= 1, xpReward: 60 },
    { title: "Pecahkan Tantangan CTF Pertama", isAchieved: ctfSolves.length >= 1, xpReward: 50 },
    { title: "Raih Kelulusan Jalur Akademi", isAchieved: academyEnrollments.some((e: any) => e.progress_percent === 100), xpReward: 100 },
    { title: "Koleksi Total 500 XP Ekosistem", isAchieved: totalXp >= 500, xpReward: 150 },
  ];

  return {
    isPersonalizationEnabled: isEnabled,
    overallLevel,
    totalXp,
    weeklyTargetHours: targetHours,
    weeklyCompletedHours: Math.min(targetHours, Math.round((totalXp / 50) * 0.5)),
    domainScores,
    strongestDomain,
    weakestDomain,
    recommendedNextActivity,
    recommendedChallenges,
    suggestedLabs,
    learningMilestones: milestones,
  };
}
