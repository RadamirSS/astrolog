import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  fullWidth,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center px-5 py-3 font-medium transition-opacity disabled:opacity-50";
  const variants = {
    primary: "bg-[var(--color-primary)] text-white",
    secondary: "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]",
    ghost: "bg-transparent text-[var(--color-primary)]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      style={{ borderRadius: "var(--radius-button)" }}
      {...props}
    >
      {children}
    </button>
  );
}
