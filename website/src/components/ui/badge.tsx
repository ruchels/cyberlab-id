import React from "react";

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "accent" | "secondary" | "destructive";
  size?: "sm" | "md";
  className?: string;
}) {
  const variantStyles = {
    default:
      "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]",
    secondary:
      "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]",
    success:
      "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60",
    warning:
      "bg-amber-950/60 text-amber-400 border border-amber-800/60",
    danger:
      "bg-rose-950/60 text-rose-400 border border-rose-800/60",
    destructive:
      "bg-rose-950/60 text-rose-400 border border-rose-800/60",
    info:
      "bg-sky-950/60 text-sky-400 border border-sky-800/60",
    accent:
      "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30",
  };

  const sizeStyles = {
    sm: "text-[11px] font-mono px-2 py-0.5 rounded",
    md: "text-xs font-mono px-2.5 py-1 rounded-md",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium tracking-wide ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
