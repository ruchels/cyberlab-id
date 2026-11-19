"use client";

import React from "react";
import { soundEngine } from "@/lib/sound-engine";

export function Card({
  children,
  className = "",
  variant = "default",
  id,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "interactive";
  id?: string;
  onClick?: () => void;
}) {
  const variantStyles = {
    default:
      "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.25)]",
    elevated:
      "bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
    interactive:
      "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl transition-all duration-200 hover:border-cyan-500/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.45),0_0_20px_rgba(6,182,212,0.12)] hover:-translate-y-1 cursor-pointer active:scale-[0.99]",
  };

  const handleClick = () => {
    if (variant === "interactive") {
      soundEngine.playClick();
    }
    if (onClick) onClick();
  };

  const handleMouseEnter = () => {
    if (variant === "interactive") {
      soundEngine.playHover();
    }
  };

  return (
    <div
      id={id}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`overflow-hidden ${variantStyles[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`px-5 py-4 border-b border-[var(--color-border-subtle)] bg-[#0c1222]/50 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>;
}

export const CardContent = CardBody;

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-5 py-3 border-t border-[var(--color-border-subtle)] bg-[#0a0f1d]/60 text-xs text-[var(--color-text-muted)] ${className}`}
    >
      {children}
    </div>
  );
}
