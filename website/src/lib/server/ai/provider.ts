import { getDb } from "../db.ts";
import { searchKnowledgeBase, sanitizeAntiLeak, type RagSource } from "./rag.ts";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GenerationResult {
  reply: string;
  sources: RagSource[];
  engine: "live-llm" | "internal-rag";
  provider: string;
  model: string;
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

// Prompt Injection and Jailbreak patterns
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt\s+reveal/i,
  /you\s+are\s+now\s+in\s+dan\s+mode/i,
  /act\s+as\s+an\s+unfiltered/i,
  /bypass\s+(all\s+)?(ethical|safety)\s+filters/i,
  /tampilkan\s+seluruh\s+instruksi\s+sistem/i,
  /abaikan\s+semua\s+peraturan/i,
  /print\s+your\s+hidden\s+rules/i,
];

export function checkPromptInjection(prompt: string): boolean {
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      return true;
    }
  }
  return false;
}

export async function generateAiResponse(params: {
  messages: ChatMessage[];
  locale?: string;
  contextType?: string;
  hintLevel?: number; // 1: conceptual, 2: technical, 3: detailed, 4: solution (if allowed)
}): Promise<GenerationResult> {
  const db = getDb();
  const locale = params.locale === "en" ? "en" : "id";
  const userMsg = params.messages[params.messages.length - 1]?.content || "";

  // 1. Prompt Injection Guard
  if (checkPromptInjection(userMsg)) {
    const injectionWarning =
      locale === "id"
        ? "⚠️ **Peringatan Keamanan Prompt:** Permintaan Anda memicu filter pencegahan manipulasi instruksi (Prompt Injection Defense). CyberLab-ID AI Tutor beroperasi di bawah koridor etika pembelajaran siber defensif yang sah dan tidak dapat membocorkan instruksi inti sistem."
        : "⚠️ **Prompt Security Warning:** Your query triggered our prompt injection defense filter. CyberLab-ID AI Tutor strictly operates within ethical defensive cybersecurity parameters and cannot reveal core system instructions.";

    return {
      reply: injectionWarning,
      sources: [],
      engine: "internal-rag",
      provider: "defensive-filter",
      model: "safety-guard",
    };
  }

  // 2. Fetch AI Configuration from DB
  const config = db.prepare("SELECT * FROM ai_provider_config WHERE id = 'default_config'").get() as any;
  const envKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "";
  const apiKey = config?.api_key_encrypted || envKey;
  const isEnabled = config?.is_enabled ?? 1;
  const provider = config?.provider || "gemini";
  const modelName = config?.model_name || "gemini-1.5-flash";

  // 3. RAG Retrieval from Knowledge Base & Curricula
  const ragResult = searchKnowledgeBase(userMsg);

  // 4. Progressive Hint Logic if user is asking for challenge / lab hints
  if (ragResult.isFlagRestricted) {
    const hintLevel = params.hintLevel || 1;
    let hintText = "";
    if (locale === "id") {
      if (hintLevel === 1) {
        hintText = "💡 **Petunjuk Konseptual (Level 1):**\nUntuk tantangan ini, fokuslah pada tipe enkripsi atau encoding data yang digunakan. Perhatikan format karakter (misalnya jika diakhiri tanda '=' atau hanya terdiri dari karakter alfabet hex 0-9a-f). Identifikasi mekanisme dasarnya sebelum mencoba dekripsi.";
      } else if (hintLevel === 2) {
        hintText = "🛠️ **Petunjuk Teknis (Level 2):**\nGunakan alat bantu yang tersedia di CyberLab-ID Security Tools (`/tools`). Untuk encoding Base64 atau Caesar, gunakan Cipher Toolkit. Untuk file berkas, periksa Magic Bytes header awal berkas menggunakan File Signature Checker.";
      } else {
        hintText = "🔍 **Petunjuk Terperinci (Level 3):**\nPeriksa urutan byte dan padding. Jika menggunakan substitusi cipher, hitung pergeseran frekuensi karakter. Sistem CyberLab-ID tidak akan membocorkan raw string flag secara langsung demi menjaga integritas evaluasi praktik Anda.";
      }
    } else {
      if (hintLevel === 1) {
        hintText = "💡 **Conceptual Hint (Level 1):**\nFocus on the underlying encoding or cryptographic scheme. Observe padding characters (e.g., trailing '=' for Base64 or hexadecimal sequences). Identify the foundational data format before decoding.";
      } else if (hintLevel === 2) {
        hintText = "🛠️ **Technical Guidance (Level 2):**\nLeverage our built-in CyberLab-ID Security Tools (`/tools`). For classical ciphers or stream encodings, utilize the Cipher Toolkit. For file artifacts, inspect Magic Bytes headers using File Signature Checker.";
      } else {
        hintText = "🔍 **Detailed Direction (Level 3):**\nAnalyze character offsets and entropy. If evaluating substitution ciphers, calculate frequency shifts. The platform intentionally refrains from revealing active CTF flags to preserve the authenticity of your learning path.";
      }
    }

    return {
      reply: hintText,
      sources: ragResult.sources,
      engine: "internal-rag",
      provider: "cyberlab-tutor",
      model: "progressive-hint-engine",
    };
  }

  // 5. If live API key is configured, execute external LLM call
  if (apiKey && isEnabled) {
    try {
      if (provider === "gemini") {
        const promptEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const systemPrompt = `You are CyberLab-ID's Senior Cybersecurity AI Tutor, dedicated to Indonesian IT students, SMK TKJ/RPL, and security practitioners.
Language requested: ${locale === "id" ? "Bahasa Indonesia" : "English"}.
Ground your response primarily in this verified CyberLab-ID knowledge:
${ragResult.contextText}

Guidelines:
1. Provide accurate, clear, and step-by-step educational explanations.
2. If discussing commands, explain what each parameter/flag does.
3. For defensive mitigations, suggest concrete configuration or code fixes.
4. Strictly do NOT provide malicious offensive exploit code intended for real targets.
5. If the information is not within your verified domain knowledge, state so honestly.`;

        const response = await fetch(promptEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\nUser Question:\n${userMsg}` }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1024,
            },
          }),
        });

        if (response.ok) {
          const json = await response.json();
          const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            // Update token usage in DB
            db.prepare("UPDATE ai_provider_config SET total_requests = total_requests + 1, total_tokens = total_tokens + 250, updated_at = datetime('now') WHERE id = 'default_config'").run();

            return {
              reply: sanitizeAntiLeak(candidateText),
              sources: ragResult.sources,
              engine: "live-llm",
              provider: "gemini",
              model: modelName,
              tokenUsage: { promptTokens: 300, completionTokens: 250, totalTokens: 550 },
            };
          }
        }
      }
    } catch (err) {
      console.warn("External AI call failed or timed out, falling back to internal RAG engine:", err);
    }
  }

  // 6. Intelligent Internal Educational RAG Formulation (when no external API key or network fallback)
  const formulatedReply = formulateInternalRagAnswer(userMsg, ragResult.sources, locale);

  // Update request count
  db.prepare("UPDATE ai_provider_config SET total_requests = total_requests + 1, updated_at = datetime('now') WHERE id = 'default_config'").run();

  return {
    reply: sanitizeAntiLeak(formulatedReply),
    sources: ragResult.sources,
    engine: "internal-rag",
    provider: "cyberlab-local-rag",
    model: "grounded-curriculum-v1",
  };
}

function formulateInternalRagAnswer(query: string, sources: RagSource[], locale: string): string {
  const isId = locale === "id";

  if (sources.length === 0) {
    if (isId) {
      return `Halo! Saya AI Learning Assistant CyberLab-ID. Pertanyaan Anda mengenai **"${query}"** saat ini belum ditemukan secara spesifik di indeks basis materi lokal kami.

Untuk mempelajari topik ini lebih lanjut:
1. Jelajahi katalog lengkap kurikulum di **[Akademi CyberLab-ID](/academy)**.
2. Gunakan alat inspeksi interaktif di **[Security Tools](/tools)**.
3. Anda juga dapat mendiskusikannya dengan komunitas di **[Forum Komunitas](/community)** atau mengajukan bimbingan di **[Mentorship](/mentorship)**.`;
    } else {
      return `Hello! I am CyberLab-ID's AI Learning Assistant. Your query regarding **"${query}"** does not match a verified internal knowledge entry in our local index yet.

To explore related topics:
1. Review structured curricula on **[CyberLab-ID Academy](/academy)**.
2. Experiment with hands-on utilities on **[Security Tools](/tools)**.
3. Collaborate with peers on the **[Community Forum](/community)** or request 1-on-1 guidance at **[Mentorship](/mentorship)**.`;
    }
  }

  const primary = sources[0];

  if (isId) {
    return `Berdasarkan materi terverifikasi di **CyberLab-ID (${primary.title})**:

### Ringkasan Konsep
${primary.snippet}

### Poin Pembelajaran Kunci
- **Kategori Domain:** \`${primary.category.toUpperCase()}\`
- **Topik Relevan:** ${primary.topic}
- **Langkah Praktik:** Anda dapat mempraktikkan simulasi materi ini secara interaktif di laboratorium virtual CyberLab-ID.
- **Referensi Internal:** Pelajari kurikulum lengkapnya melalui tautan referensi terlampir di bawah ini.

*Catatan: Jawaban ini diformulasikan secara deterministik berdasarkan repositori kurikulum resmi CyberLab-ID.*`;
  } else {
    return `Based on verified materials from **CyberLab-ID (${primary.title})**:

### Conceptual Overview
${primary.snippet}

### Key Learning Takeaways
- **Domain Category:** \`${primary.category.toUpperCase()}\`
- **Topic Area:** ${primary.topic}
- **Hands-on Practice:** You can practice this concept hands-on in the CyberLab-ID virtual cyber range.
- **Internal Reference:** Review the full module documentation via the cited source link below.

*Note: This response is grounded in CyberLab-ID's verified curriculum knowledge base.*`;
  }
}
