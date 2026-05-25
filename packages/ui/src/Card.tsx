import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glass?: boolean;
}

export function Card({ children, className = "", glass, ...props }: CardProps) {
  const glassStyle = glass
    ? { backdropFilter: "blur(12px)", backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)" }
    : { backgroundColor: "var(--color-surface)" };

  return (
    <div
      className={`border border-[var(--color-border)] p-4 ${className}`}
      style={{
        ...glassStyle,
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}
