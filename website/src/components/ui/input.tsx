import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, leftIcon, className = "", id, ...props },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[var(--color-text-muted)] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[var(--color-surface)] border ${
              error
                ? "border-[var(--color-danger)] focus:border-[var(--color-danger)]"
                : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
            } rounded px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none transition-colors duration-150 ${
              leftIcon ? "pl-9" : ""
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-[var(--color-danger)] font-mono">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
