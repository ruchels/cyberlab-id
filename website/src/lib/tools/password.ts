/**
 * Password Analyzer Tool - Core Logic
 * Evaluates password entropy, brute-force resistance, and bad patterns.
 * NEVER transmits, logs, or stores passwords.
 */

export interface PasswordAnalysis {
  score: number; // 0 - 100
  strength: "Sangat Lemah" | "Lemah" | "Sedang" | "Kuat" | "Sangat Kuat";
  length: number;
  entropyBits: number;
  estimatedCrackTime: string;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  detectedPatterns: string[];
  suggestions: string[];
}

const COMMON_PASSWORDS = new Set([
  "password",
  "123456",
  "12345678",
  "123456789",
  "12345",
  "qwerty",
  "111111",
  "1234567",
  "dragon",
  "pussy",
  "baseball",
  "football",
  "monkey",
  "letmein",
  "master",
  "sunshine",
  "princess",
  "welcome",
  "shadow",
  "login",
  "admin",
  "admin123",
  "iloveyou",
  "superman",
  "trustno1",
  "indonesia",
  "rahasia",
  "bismillah",
  "merdeka",
  "cyberlab",
]);

export function analyzePassword(pw: string): PasswordAnalysis {
  if (!pw) {
    return {
      score: 0,
      strength: "Sangat Lemah",
      length: 0,
      entropyBits: 0,
      estimatedCrackTime: "Instan (< 1 ms)",
      hasLower: false,
      hasUpper: false,
      hasNumber: false,
      hasSymbol: false,
      detectedPatterns: [],
      suggestions: ["Masukkan password untuk mulai menganalisis."],
    };
  }

  const length = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw);

  // Calculate Character Pool Size (N)
  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasNumber) poolSize += 10;
  if (hasSymbol) poolSize += 33;

  // Information Entropy: E = L * log2(N)
  const entropyBits = poolSize > 0 ? Math.round(length * Math.log2(poolSize)) : 0;

  // Patterns check
  const detectedPatterns: string[] = [];
  const suggestions: string[] = [];
  const lowerPw = pw.toLowerCase();

  if (COMMON_PASSWORDS.has(lowerPw)) {
    detectedPatterns.push("Password ini termasuk dalam daftar password paling sering bocor di dunia.");
  }

  if (/(.)\1{2,}/.test(pw)) {
    detectedPatterns.push("Terdapat pengulangan karakter berturut-turut (misal: 'aaa', '111').");
  }

  if (/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi)/i.test(pw)) {
    detectedPatterns.push("Terdapat urutan angka atau huruf berurutan (sequential sequence).");
  }

  if (/(qwerty|asdfgh|zxcvbn|qazwsx)/i.test(lowerPw)) {
    detectedPatterns.push("Terdapat pola keyboard fisik (keyboard walk pattern).");
  }

  // Recommendations
  if (length < 8) {
    suggestions.push("Panjang sangat pendek. Gunakan minimal 12 karakter untuk akun standar.");
  } else if (length < 12) {
    suggestions.push("Tingkatkan panjang password menjadi 14-16 karakter untuk ketahanan terhadap GPU cluster.");
  }

  if (!hasUpper) suggestions.push("Tambahkan huruf kapital (A-Z).");
  if (!hasLower) suggestions.push("Tambahkan huruf kecil (a-z).");
  if (!hasNumber) suggestions.push("Tambahkan angka (0-9).");
  if (!hasSymbol) suggestions.push("Tambahkan simbol/karakter khusus (@, #, $, !, %, dll).");

  if (detectedPatterns.length > 0) {
    suggestions.push("Hindari kata umum atau pola urutan yang mudah ditebak oleh kamus wordlist (SecLists / RockYou).");
  }

  // Scoring
  let score = 0;
  // Length points: up to 40
  score += Math.min(40, length * 3);
  // Diversity points: up to 30
  if (hasLower) score += 7;
  if (hasUpper) score += 8;
  if (hasNumber) score += 7;
  if (hasSymbol) score += 8;
  // Entropy bonus: up to 30
  if (entropyBits > 60) score += 30;
  else if (entropyBits > 45) score += 20;
  else if (entropyBits > 30) score += 10;

  // Penalties
  if (COMMON_PASSWORDS.has(lowerPw)) score = Math.min(10, score);
  if (detectedPatterns.length > 0) score = Math.max(5, score - detectedPatterns.length * 15);

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Strength Level
  let strength: "Sangat Lemah" | "Lemah" | "Sedang" | "Kuat" | "Sangat Kuat" = "Sangat Lemah";
  if (score >= 80) strength = "Sangat Kuat";
  else if (score >= 60) strength = "Kuat";
  else if (score >= 40) strength = "Sedang";
  else if (score >= 20) strength = "Lemah";

  // Estimated crack time assuming 10 Billion guesses/sec (modern RTX 4090 hashcat rig)
  const guessesPerSec = 10_000_000_000;
  const totalCombinations = Math.pow(poolSize, length);
  const seconds = totalCombinations / (2 * guessesPerSec); // Average time to find

  let estimatedCrackTime = "Instan (< 1 detik)";
  if (seconds < 1) estimatedCrackTime = "Instan (< 1 detik)";
  else if (seconds < 60) estimatedCrackTime = `${Math.round(seconds)} detik`;
  else if (seconds < 3600) estimatedCrackTime = `${Math.round(seconds / 60)} menit`;
  else if (seconds < 86400) estimatedCrackTime = `${Math.round(seconds / 3600)} jam`;
  else if (seconds < 86400 * 30) estimatedCrackTime = `${Math.round(seconds / 86400)} hari`;
  else if (seconds < 86400 * 365) estimatedCrackTime = `${Math.round(seconds / (86400 * 30))} bulan`;
  else if (seconds < 86400 * 365 * 100) estimatedCrackTime = `${Math.round(seconds / (86400 * 365))} tahun`;
  else if (seconds < 86400 * 365 * 1_000_000) estimatedCrackTime = `${(seconds / (86400 * 365 * 1000)).toFixed(1)} ribu tahun`;
  else estimatedCrackTime = "Miliaran tahun (Tak dapat ditembus saat ini)";

  return {
    score,
    strength,
    length,
    entropyBits,
    estimatedCrackTime,
    hasLower,
    hasUpper,
    hasNumber,
    hasSymbol,
    detectedPatterns,
    suggestions,
  };
}
