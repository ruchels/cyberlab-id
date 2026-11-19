import { getDb } from "../db.ts";

export interface RagSource {
  title: string;
  category: string;
  topic: string;
  sourceUrl: string;
  snippet: string;
  relevanceScore: number;
}

export interface RagResult {
  sources: RagSource[];
  contextText: string;
  isFlagRestricted: boolean;
  detectedKeywords: string[];
}

const STOPWORDS = new Set([
  "dan", "di", "ke", "dari", "ini", "itu", "yang", "untuk", "pada", "adalah", "sebagai",
  "bagaimana", "cara", "apa", "mengapa", "kapan", "siapa", "tolong", "bisa", "jelaskan",
  "and", "in", "to", "from", "this", "that", "which", "for", "on", "is", "are", "was",
  "were", "how", "what", "why", "when", "who", "please", "can", "could", "explain", "about"
]);

export function extractKeywords(text: string): string[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9_\-\s]/g, " ");
  const tokens = normalized.split(/\s+/).filter(Boolean);
  return tokens.filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

export function searchKnowledgeBase(query: string, limit: number = 4): RagResult {
  const db = getDb();
  const keywords = extractKeywords(query);

  // Check if user is asking directly for a CTF flag
  const lowerQuery = query.toLowerCase();
  const isFlagRestricted =
    lowerQuery.includes("flag") ||
    lowerQuery.includes("cyberlab{") ||
    lowerQuery.includes("jawaban ctf") ||
    lowerQuery.includes("kunci jawaban") ||
    lowerQuery.includes("give me the flag");

  // Fetch all active knowledge documents
  const docs = db
    .prepare(`
      SELECT id, title, category, topic, content, tags, source_url
      FROM ai_knowledge_docs
      WHERE is_enabled = 1
    `)
    .all() as any[];

  // Fetch academy paths
  const paths = db
    .prepare(`
      SELECT id, title, category, difficulty, description
      FROM academy_paths
    `)
    .all() as any[];

  const scoredSources: RagSource[] = [];

  for (const doc of docs) {
    let score = 0;
    const docLowerTitle = doc.title.toLowerCase();
    const docLowerContent = doc.content.toLowerCase();
    const docLowerTopic = doc.topic.toLowerCase();
    let tags: string[] = [];
    try {
      tags = JSON.parse(doc.tags);
    } catch {}

    for (const kw of keywords) {
      if (docLowerTitle.includes(kw)) score += 5;
      if (docLowerTopic.includes(kw)) score += 4;
      if (tags.some((t) => t.toLowerCase().includes(kw))) score += 4;
      if (docLowerContent.includes(kw)) score += 1;
    }

    if (score > 0) {
      scoredSources.push({
        title: doc.title,
        category: doc.category,
        topic: doc.topic,
        sourceUrl: doc.source_url || `/learning`,
        snippet: doc.content.slice(0, 280) + "...",
        relevanceScore: score,
      });
    }
  }

  // Also check academy curricula if relevant
  for (const p of paths) {
    let score = 0;
    const pTitle = p.title.toLowerCase();
    const pDesc = p.description.toLowerCase();

    for (const kw of keywords) {
      if (pTitle.includes(kw)) score += 3;
      if (pDesc.includes(kw)) score += 1;
    }

    if (score > 0) {
      scoredSources.push({
        title: `Akademi: ${p.title}`,
        category: p.category,
        topic: "CyberLab Curriculum",
        sourceUrl: `/academy/${p.id}`,
        snippet: p.description.slice(0, 240) + "...",
        relevanceScore: score,
      });
    }
  }

  // Sort by relevance score descending
  scoredSources.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topSources = scoredSources.slice(0, limit);

  // Compile context text for LLM/RAG formulation
  const contextChunks = topSources.map((s, idx) => {
    return `[Sumber ${idx + 1}: ${s.title} (${s.category} - ${s.topic})]\n${s.snippet}\nLink: ${s.sourceUrl}`;
  });

  const contextText = contextChunks.join("\n\n");

  return {
    sources: topSources,
    contextText,
    isFlagRestricted,
    detectedKeywords: keywords,
  };
}

/**
 * Sanitizes generated text to ensure no raw active CTF flag strings ever leak to client.
 */
export function sanitizeAntiLeak(content: string): string {
  // Redact any simulated or leaked flag pattern like CYBERLAB{...}
  return content.replace(/CYBERLAB\{[a-zA-Z0-9_\-!@#$%^&*]+\}/gi, "CYBERLAB{REDACTED_BY_DEFENSIVE_GUARD}");
}
