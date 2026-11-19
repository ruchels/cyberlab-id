export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const REDACT_KEYS = new Set([
  "password",
  "token",
  "secret",
  "flag",
  "flag_hash",
  "cookie",
  "authorization",
  "salt",
]);

function redactSensitive(data: any): any {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(redactSensitive);

  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (REDACT_KEYS.has(key.toLowerCase())) {
      cleaned[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null) {
      cleaned[key] = redactSensitive(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export function log(level: LogLevel, message: string, context: Record<string, any> = {}, correlationId?: string) {
  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    correlationId: correlationId || (context.correlationId as string) || undefined,
    context: redactSensitive(context),
  };

  const jsonString = JSON.stringify(payload);
  if (level === "error") {
    console.error(jsonString);
  } else if (level === "warn") {
    console.warn(jsonString);
  } else {
    console.log(jsonString);
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, any>, cid?: string) => log("debug", msg, ctx, cid),
  info: (msg: string, ctx?: Record<string, any>, cid?: string) => log("info", msg, ctx, cid),
  warn: (msg: string, ctx?: Record<string, any>, cid?: string) => log("warn", msg, ctx, cid),
  error: (msg: string, ctx?: Record<string, any>, cid?: string) => log("error", msg, ctx, cid),
};
