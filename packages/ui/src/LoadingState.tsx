"use client";

import { useT } from "@astro/i18n";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message, className = "" }: LoadingStateProps) {
  const t = useT();

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border,#334155)] border-t-[var(--color-primary,#8b5cf6)]"
        aria-hidden
      />
      <p className="text-sm text-[var(--color-text-muted,#94a3b8)]">{message ?? t("ui.loading")}</p>
    </div>
  );
}
