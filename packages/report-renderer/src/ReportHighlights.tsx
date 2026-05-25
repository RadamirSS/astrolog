"use client";

import type { ReportHighlight } from "@astro/tenant-config";
import { Card } from "@astro/ui";
import { useNormalizeHighlight } from "./utils";

const iconMap: Record<string, string> = {
  sun: "☀️",
  moon: "🌙",
  rising: "⬆️",
  venus: "💫",
  mars: "🔥",
  mercury: "✦",
  jupiter: "🌟",
  saturn: "🪐",
};

export function ReportHighlights({ highlights }: { highlights: ReportHighlight[] }) {
  const normalizeHighlight = useNormalizeHighlight();

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {highlights.map((item, index) => {
        const { label, value } = normalizeHighlight(item);
        return (
          <Card
            key={item.id}
            className={`text-center ${index < highlights.length - 1 ? "" : ""}`}
          >
            <div className="text-2xl" aria-hidden>
              {item.icon ? (iconMap[item.icon] ?? "✨") : "✨"}
            </div>
            <div className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              {label}
            </div>
            <div className="text-sm font-bold text-[var(--color-text)]">{value}</div>
          </Card>
        );
      })}
    </div>
  );
}
