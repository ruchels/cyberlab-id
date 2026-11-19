import React from "react";

export interface TerminalLine {
  type: "command" | "output" | "error" | "success" | "comment";
  text: string;
}

export function Terminal({
  title = "bash - cyberlab-id",
  lines,
  className = "",
}: {
  title?: string;
  lines: TerminalLine[];
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-[var(--color-border)] bg-[#070b12] overflow-hidden text-xs font-mono shadow-xl ${className}`}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border-subtle)] bg-[#0d131f]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
        </div>
        <span className="text-[11px] text-[var(--color-text-muted)] select-none">
          {title}
        </span>
        <div className="w-8" />
      </div>

      {/* Terminal Body */}
      <div className="p-4 space-y-1.5 overflow-x-auto leading-relaxed">
        {lines.map((line, idx) => {
          if (line.type === "command") {
            return (
              <div key={idx} className="flex items-baseline gap-2 text-[var(--color-text)]">
                <span className="text-[var(--color-accent)] font-bold select-none">$</span>
                <span className="font-semibold text-emerald-300">{line.text}</span>
              </div>
            );
          }
          if (line.type === "error") {
            return (
              <div key={idx} className="text-rose-400 pl-4 font-mono">
                {line.text}
              </div>
            );
          }
          if (line.type === "success") {
            return (
              <div key={idx} className="text-emerald-400 pl-4 font-mono">
                {line.text}
              </div>
            );
          }
          if (line.type === "comment") {
            return (
              <div key={idx} className="text-[var(--color-text-muted)] italic select-none">
                # {line.text}
              </div>
            );
          }
          return (
            <div key={idx} className="text-[var(--color-text-secondary)] pl-4">
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
