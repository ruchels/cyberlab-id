"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, CardFooter, Badge, Button, Input } from "@/components/ui";
import {
  Trophy,
  Flag,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Unlock,
  KeyRound,
  Filter,
  Sparkles,
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  category: "cryptography" | "networking" | "forensics" | "web" | "reverse";
  difficulty: "beginner" | "intermediate" | "advanced";
  points: number;
  description: string;
  hint: string;
  flag: string;
  acceptedFlags: string[];
  solution: string;
}

const CHALLENGES_DATA: Challenge[] = [
  {
    id: "caesar-says-hello",
    title: "Caesar Says Hello",
    category: "cryptography",
    difficulty: "beginner",
    points: 50,
    description:
      "Julius Caesar mengirimkan ciphertext rahasia: 'Fdhvdu flskhu lv ixq'. Pecahkan pesan asli dan serahkan flag-nya!",
    hint: "Gunakan teknik geser mundur alfabet (Caesar Cipher Shift 3) atau gunakan CyberLab-ID Cipher Toolkit.",
    flag: "CYBERLAB{Caesar cipher is fun}",
    acceptedFlags: ["CYBERLAB{Caesar cipher is fun}", "Caesar cipher is fun"],
    solution:
      "Setiap huruf digeser mundur sebanyak 3 langkah: F->C, d->a, h->e, v->s, d->a, u->r. Plaintext yang dihasilkan adalah 'Caesar cipher is fun'.",
  },
  {
    id: "base64-basics",
    title: "Base64 Encoding Basics",
    category: "cryptography",
    difficulty: "beginner",
    points: 25,
    description:
      "Seorang sysadmin mencurigai string berikut di file konfigurasi: 'Q3liZXJMYWItSUQ='. Temukan data aslinya!",
    hint: "Ingat bahwa Base64 adalah skema encoding biner-ke-teks dengan karakter padding '=', bukan algoritma enkripsi rahasia.",
    flag: "CYBERLAB{CyberLab-ID}",
    acceptedFlags: ["CYBERLAB{CyberLab-ID}", "CyberLab-ID"],
    solution:
      "Lakukan decode Base64 menggunakan terminal (`echo 'Q3liZXJMYWItSUQ=' | base64 -d`) atau gunakan Cipher Toolkit CyberLab-ID. Hasil aslinya adalah 'CyberLab-ID'.",
  },
  {
    id: "hash-match",
    title: "Hash Signature Identifier",
    category: "cryptography",
    difficulty: "beginner",
    points: 50,
    description:
      "Seorang analis menemukan nilai hash 'a59f94ef98caeb4cac0c900c2fa730a6' yang berasal dari kata 'cyberlab'. Algoritma hash apa yang menghasilkan digest sepanjang 32 karakter hexadecimal ini?",
    hint: "Hitung jumlah karakter hex (32 karakter * 4 bit = 128 bit). Algoritma legendaris karya Ron Rivest dari tahun 1991.",
    flag: "CYBERLAB{MD5}",
    acceptedFlags: ["CYBERLAB{MD5}", "MD5", "md5"],
    solution:
      "Output memiliki panjang 32 digit heksadesimal yang setara dengan 128 bit. Ini adalah karakteristik khas dari algoritma MD5 (Message Digest 5).",
  },
  {
    id: "file-identity",
    title: "File Identity & Magic Bytes",
    category: "forensics",
    difficulty: "beginner",
    points: 50,
    description:
      "Sebuah file rusak tidak memiliki ekstensi, namun 8 byte pertamanya terbaca di hex editor: '89 50 4E 47 0D 0A 1A 0A'. Format file apakah ini?",
    hint: "Perhatikan karakter ASCII dari byte 50 4E 47 ('P', 'N', 'G'). Format gambar lossless web populer.",
    flag: "CYBERLAB{PNG}",
    acceptedFlags: ["CYBERLAB{PNG}", "PNG", "png"],
    solution:
      "Magic bytes 89 50 4E 47 0D 0A 1A 0A adalah tanda tangan resmi untuk file citra PNG (Portable Network Graphics).",
  },
  {
    id: "subnet-sleuth",
    title: "Subnet Sleuth: Host Capacity",
    category: "networking",
    difficulty: "intermediate",
    points: 75,
    description:
      "Departemen IT perusahaan menetapkan subnet blok '172.16.50.0/22'. Berapa jumlah pasti host IP yang dapat digunakan secara valid (usable hosts) oleh komputer klien?",
    hint: "Panjang IPv4 adalah 32 bit. Dengan prefix /22, berapa sisa bit untuk host? Gunakan rumus 2^h - 2 (dikurangi alamat Network dan Broadcast).",
    flag: "CYBERLAB{1022}",
    acceptedFlags: ["CYBERLAB{1022}", "1022"],
    solution:
      "Host bits = 32 - 22 = 10 bits. Total alamat = 2^10 = 1024. Usable hosts = 1024 - 2 = 1022 alamat (karena network address dan broadcast address dicadangkan).",
  },
  {
    id: "xor-key-hunt",
    title: "XOR Key Hunt",
    category: "cryptography",
    difficulty: "intermediate",
    points: 100,
    description:
      "Sebuah payload malware di-obfuscate menggunakan single-byte XOR key. Hex stream yang ditemukan: '2a 20 2b 2c 3b 25 28 34 20 3a 36 28 3e 2c 24 2c'. Dekripsi pesan bahasa Inggris tersebut!",
    hint: "Coba gunakan brute-force single byte (0 s.d 255) atau cari karakter pertama yang seharusnya berupa flag pembuka 'C'. Jika 0x2A XOR Key = 'C' (0x43), maka Key = 0x2A XOR 0x43 = 0x69.",
    flag: "CYBERLAB{CYBERLAB_SECRET}",
    acceptedFlags: ["CYBERLAB{CYBERLAB_SECRET}", "CYBERLAB_SECRET"],
    solution:
      "Key yang digunakan adalah 0x69 (desimal 105 atau karakter 'i'). Melakukan operasi XOR pada setiap byte menghasilkan pesan 'CYBERLAB_SECRET'.",
  },
];

export default function ChallengesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [flagInputs, setFlagInputs] = useState<{ [key: string]: string }>({});
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    [key: string]: { status: "correct" | "wrong"; message: string };
  }>({});
  const [revealedHints, setRevealedHints] = useState<{ [key: string]: boolean }>({});
  const [revealedSolutions, setRevealedSolutions] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const saved = localStorage.getItem("cyberlab_solved_challenges");
    if (saved) {
      try {
        setSolvedIds(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const totalPoints = CHALLENGES_DATA.reduce((acc, curr) => acc + curr.points, 0);
  const earnedPoints = CHALLENGES_DATA.filter((c) => solvedIds.includes(c.id)).reduce(
    (acc, curr) => acc + curr.points,
    0
  );

  const handleFlagSubmit = (challenge: Challenge) => {
    const input = (flagInputs[challenge.id] || "").trim();
    if (!input) return;

    const isCorrect = challenge.acceptedFlags.some(
      (f) => f.toLowerCase() === input.toLowerCase()
    );

    if (isCorrect) {
      setSubmissionFeedback((prev) => ({
        ...prev,
        [challenge.id]: {
          status: "correct",
          message: `Selamat! Flag benar (+${challenge.points} Poin)`,
        },
      }));
      if (!solvedIds.includes(challenge.id)) {
        const updated = [...solvedIds, challenge.id];
        setSolvedIds(updated);
        localStorage.setItem("cyberlab_solved_challenges", JSON.stringify(updated));
      }
    } else {
      setSubmissionFeedback((prev) => ({
        ...prev,
        [challenge.id]: {
          status: "wrong",
          message: "Flag salah! Periksa kembali jawaban Anda atau buka petunjuk.",
        },
      }));
    }
  };

  const filteredChallenges = CHALLENGES_DATA.filter((c) => {
    const matchCat = selectedCategory === "all" || c.category === selectedCategory;
    const matchDiff = selectedDifficulty === "all" || c.difficulty === selectedDifficulty;
    return matchCat && matchDiff;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header & Scoreboard Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>CyberLab-ID CTF &amp; Lab Challenges</span>
          </div>
          <h1 className="text-3xl font-mono font-bold text-[var(--color-text)]">
            Tantangan Praktikum &amp; CTF
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">
            Asah pemahaman praktis Anda melalui skenario Capture The Flag (CTF) yang legal, aman, dan mendidik.
          </p>
        </div>

        {/* User Scorecard */}
        <div className="p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-4 font-mono">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Skor Anda</div>
            <div className="text-base font-bold text-[var(--color-text)]">
              <span className="text-[var(--color-accent)]">{earnedPoints}</span>
              <span className="text-xs text-[var(--color-text-muted)]"> / {totalPoints} Pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {["all", "cryptography", "networking", "forensics"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer capitalize ${
                selectedCategory === cat
                  ? "bg-[var(--color-accent)] text-[#05080e] font-bold"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
              }`}
            >
              {cat === "all" ? "Semua Kategori" : cat}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {["all", "beginner", "intermediate"].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer capitalize ${
                selectedDifficulty === diff
                  ? "bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-accent)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              }`}
            >
              {diff === "all" ? "Semua Level" : diff}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-6">
        {filteredChallenges.map((challenge) => {
          const isSolved = solvedIds.includes(challenge.id);
          const feedback = submissionFeedback[challenge.id];
          const hintRevealed = revealedHints[challenge.id];
          const solutionRevealed = revealedSolutions[challenge.id];

          return (
            <Card
              key={challenge.id}
              className={`transition-all ${
                isSolved ? "border-emerald-800/80 bg-emerald-950/10" : ""
              }`}
            >
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center font-mono text-xs font-bold ${
                      isSolved
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                    }`}
                  >
                    {isSolved ? <CheckCircle2 className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-mono text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                      <span>{challenge.title}</span>
                      {isSolved && (
                        <Badge variant="success" size="sm">
                          Solved
                        </Badge>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono text-[var(--color-text-muted)] uppercase">
                        {challenge.category}
                      </span>
                      <span className="text-[var(--color-text-muted)]">·</span>
                      <Badge
                        variant={challenge.difficulty === "beginner" ? "default" : "warning"}
                        size="sm"
                      >
                        {challenge.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="font-mono text-sm font-bold text-[var(--color-accent)]">
                  +{challenge.points} Pts
                </div>
              </CardHeader>

              <CardBody className="space-y-4">
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-mono">
                  {challenge.description}
                </p>

                {/* Flag Submission Form */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Masukkan Flag (Contoh: CYBERLAB{...})"
                    value={flagInputs[challenge.id] || ""}
                    onChange={(e) =>
                      setFlagInputs({ ...flagInputs, [challenge.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFlagSubmit(challenge);
                    }}
                    className="flex-1 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded px-3 py-2 text-xs font-mono text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleFlagSubmit(challenge)}
                    className="whitespace-nowrap"
                  >
                    Submit Flag
                  </Button>
                </div>

                {/* Feedback Alert */}
                {feedback && (
                  <div
                    className={`p-3 rounded text-xs font-mono flex items-center gap-2 ${
                      feedback.status === "correct"
                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                        : "bg-rose-950/60 text-rose-300 border border-rose-800"
                    }`}
                  >
                    {feedback.status === "correct" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{feedback.message}</span>
                  </div>
                )}

                {/* Hint & Solution Accordions */}
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[var(--color-border-subtle)] text-xs font-mono">
                  <button
                    onClick={() =>
                      setRevealedHints({
                        ...revealedHints,
                        [challenge.id]: !hintRevealed,
                      })
                    }
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>{hintRevealed ? "Tutup Petunjuk" : "Buka Petunjuk (Hint)"}</span>
                  </button>

                  <button
                    onClick={() =>
                      setRevealedSolutions({
                        ...revealedSolutions,
                        [challenge.id]: !solutionRevealed,
                      })
                    }
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5 text-sky-400" />
                    <span>{solutionRevealed ? "Tutup Pembahasan" : "Buka Solusi Pembelajaran"}</span>
                  </button>
                </div>

                {/* Revealed Hint Content */}
                {hintRevealed && (
                  <div className="p-3 rounded bg-amber-950/20 border border-amber-900/50 text-xs font-mono text-amber-300">
                    💡 <strong>Petunjuk:</strong> {challenge.hint}
                  </div>
                )}

                {/* Revealed Solution Content */}
                {solutionRevealed && (
                  <div className="p-3.5 rounded bg-[var(--color-surface-elevated)]/60 border border-[var(--color-border)] text-xs font-mono space-y-1.5">
                    <div className="text-[var(--color-accent)] font-bold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Pembahasan Lengkap:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{challenge.solution}</p>
                    <div className="text-[11px] text-[var(--color-text-muted)] pt-1">
                      Flag Resmi: <code>{challenge.flag}</code>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
