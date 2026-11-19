import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
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
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:pointer-events-none rounded cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[var(--color-accent)] text-[#05080e] hover:bg-[var(--color-accent-dark)] font-semibold shadow-sm hover:shadow-[0_0_15px_rgba(0,255,157,0.25)]",
      secondary:
        "bg-[var(--color-surface-elevated)] text-[var(--color-text)] hover:bg-[#202b3f] border border-[var(--color-border)]",
      outline:
        "border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] bg-transparent",
      ghost:
        "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] bg-transparent",
      danger:
        "bg-[var(--color-danger)] text-white hover:bg-red-600 font-semibold",
      accent:
        "bg-[var(--color-accent)] text-[#05080e] hover:bg-[var(--color-accent-dark)] font-semibold shadow-sm hover:shadow-[0_0_15px_rgba(0,255,157,0.25)]",
    };

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-5 py-2.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
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
