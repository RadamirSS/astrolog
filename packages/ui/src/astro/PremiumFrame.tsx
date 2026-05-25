"use client";

import type { ReactNode } from "react";

interface PremiumFrameProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function PremiumFrame({ children, title, className = "" }: PremiumFrameProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 p-5 ${className}`}
      style={{
        background: "var(--vp-card-bg, color-mix(in srgb, #1a1810 95%, var(--color-surface)))",
        borderColor: "var(--vp-accent, #c9a84c)",
        boxShadow: "var(--vp-card-glow, 0 4px 32px color-mix(in srgb, #c9a84c 15%, transparent))",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-4 top-2 h-px opacity-40"
        style={{ background: "linear-gradient(90deg, transparent, var(--vp-accent, #c9a84c), transparent)" }}
        aria-hidden
      />
      {title && (
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--vp-accent,var(--color-accent))]">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
