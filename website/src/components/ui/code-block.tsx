"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({
  code,
  language = "bash",
  filename,
  showLineNumbers = false,
}: {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const lines = code.trim().split("\n");

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden my-4 text-xs font-mono">
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/50 text-[var(--color-text-secondary)]">
          <span className="flex items-center gap-2 text-xs font-mono">
            {filename ? (
              <span className="text-[var(--color-text)] font-semibold">{filename}</span>
            ) : (
              <span className="text-[var(--color-accent)] uppercase tracking-wider">{language}</span>
            )}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-surface-elevated)] hover:bg-[#202b3f] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            title="Salin kode"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Salin</span>
              </>
            )}
          </button>
        </div>
      )}
      <div className="p-4 overflow-x-auto">
        <pre className="text-[var(--color-text)] leading-relaxed">
          {lines.map((line, idx) => (
            <div key={idx} className="flex">
              {showLineNumbers && (
                <span className="select-none pr-4 text-[var(--color-text-muted)] text-right w-8 inline-block opacity-40">
                  {idx + 1}
                </span>
              )}
              <span className="flex-1">{line}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
