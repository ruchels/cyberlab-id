import React from "react";

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
      "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg",
    elevated:
      "bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg shadow-md",
    interactive:
      "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg transition-all duration-200 hover:border-[var(--color-accent)] hover:shadow-[0_4px_20px_rgba(0,255,157,0.08)] hover:-translate-y-0.5 cursor-pointer",
  };

  return (
    <div
      id={id}
      onClick={onClick}
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
      className={`px-5 py-4 border-b border-[var(--color-border-subtle)] ${className}`}
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
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-5 py-3 bg-[var(--color-surface-elevated)]/40 border-t border-[var(--color-border-subtle)] ${className}`}
    >
      {children}
    </div>
  );
}
