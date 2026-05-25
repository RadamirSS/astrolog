"use client";

import type { FunnelTopic, VisualPack } from "@astro/tenant-config";
import { getVisualPackForTopic } from "@astro/tenant-config";
import { VisualPackScope } from "@astro/theme-engine";
import type { ReactNode } from "react";

interface TopicCardProps {
  topic: FunnelTopic;
  label: string;
  description: string;
  selected?: boolean;
  onSelect: () => void;
  ctaLabel?: string;
  visualPack?: VisualPack;
  action?: ReactNode;
}

function TopicIcon({ topic }: { topic: FunnelTopic }) {
  const color = "var(--vp-accent)";
  if (topic === "money") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
        <path d="M12 7v10M9 9.5c0-1.1 1.3-2 3-2s3 .9 3 2-1.3 2-3 2.5-3 2.5-1.3.5-3 1.4-3 2.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (topic === "relationships") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 21s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 11c0 5.5-7 10-7 10z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M6 20c0-4 2.7-6 6-6s6 2 6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 2v2M4 8l1.5 1.5M20 8l-1.5 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TopicCard({
  topic,
  label,
  description,
  selected = false,
  onSelect,
  ctaLabel,
  visualPack,
  action,
}: TopicCardProps) {
  const pack = visualPack ?? getVisualPackForTopic(topic);

  return (
    <VisualPackScope pack={pack}>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
          selected
            ? "border-[var(--vp-accent)] ring-2 ring-[var(--vp-accent-muted)]"
            : "border-[var(--vp-card-border)] hover:border-[var(--vp-accent-muted)]"
        }`}
        style={{
          background: "var(--vp-card-bg)",
          boxShadow: "var(--vp-card-glow)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--vp-accent-muted)" }}
          >
            <TopicIcon topic={topic} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[var(--vp-text)]">{label}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--vp-text-muted)]">{description}</p>
            {(action || ctaLabel) && (
              <div className="mt-3">
                {action ?? (
                  <span className="text-sm font-medium text-[var(--vp-accent)]">{ctaLabel}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>
    </VisualPackScope>
  );
}
