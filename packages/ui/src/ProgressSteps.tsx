"use client";

import { useT } from "@astro/i18n";

interface ProgressStepsProps {
  current: number;
  total: number;
  labels?: string[];
}

export function ProgressSteps({ current, total, labels }: ProgressStepsProps) {
  const t = useT();

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor:
                i <= current
                  ? "var(--color-primary)"
                  : "color-mix(in srgb, var(--color-border) 80%, transparent)",
            }}
          />
        ))}
      </div>
      {labels?.[current] && (
        <p className="text-xs text-[var(--color-text-muted)]">
          {t("ui.stepOf", { current: current + 1, total, label: labels[current] })}
        </p>
      )}
    </div>
  );
}
