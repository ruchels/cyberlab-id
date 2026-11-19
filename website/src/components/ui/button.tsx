"use client";

import React from "react";
import { soundEngine } from "@/lib/sound-engine";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent" | "cyan";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  enableSound?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      enableSound = true,
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070a13] disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer active:scale-[0.98] select-none";

    const variantStyles = {
      primary:
        "bg-[var(--color-accent)] text-[#05080e] hover:bg-[var(--color-accent-dark)] font-semibold shadow-sm hover:shadow-[0_0_15px_rgba(0,255,157,0.25)]",
      secondary:
        "bg-[var(--color-surface-elevated)] text-[var(--color-text)] hover:bg-[#1a2942] border border-[var(--color-border)] hover:border-slate-600 shadow-sm",
      outline:
        "border border-[var(--color-border)] text-[var(--color-text)] hover:border-cyan-400 hover:text-cyan-400 hover:bg-cyan-950/20 bg-transparent",
      ghost:
        "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] bg-transparent",
      danger:
        "bg-[var(--color-danger)] text-white hover:bg-red-600 font-semibold shadow-sm hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]",
      accent:
        "bg-[var(--color-accent)] text-[#05080e] hover:bg-[var(--color-accent-dark)] font-semibold shadow-sm hover:shadow-[0_0_15px_rgba(0,255,157,0.25)]",
      cyan:
        "bg-gradient-to-r from-cyan-400 to-blue-500 text-[#05080e] hover:from-cyan-300 hover:to-blue-400 font-semibold shadow-sm hover:shadow-[0_0_18px_rgba(6,182,212,0.35)]",
    };

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-5 py-2.5 gap-2.5",
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableSound) {
        soundEngine.playClick();
      }
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
