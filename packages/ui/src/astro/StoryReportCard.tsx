"use client";

import type { ReactNode } from "react";

interface StoryReportCardProps {
  title: string;
  content: string;
  icon?: ReactNode;
  eyebrow?: string;
  uncertain?: boolean;
  uncertainLabel?: string;
  variant?: "default" | "hero" | "cta";
}

export function StoryReportCard({
  title,
  content,
  icon,
  eyebrow,
  uncertain = false,
  uncertainLabel,
  variant = "default",
}: StoryReportCardProps) {
  const isHero = variant === "hero";
  const isCta = variant === "cta";

  return (
    <article
      className={`rounded-2xl border p-5 ${
        uncertain ? "border-dashed opacity-90" : ""
      } ${isHero ? "text-center" : ""} ${isCta ? "border-[var(--vp-accent,var(--color-primary))]" : ""}`}
      style={{
        background: isHero
          ? "color-mix(in srgb, var(--vp-card-bg, var(--color-surface)) 95%, var(--vp-accent, var(--color-primary)))"
          : "var(--vp-card-bg, var(--color-surface))",
        borderColor: uncertain
          ? "color-mix(in srgb, var(--color-text-muted) 40%, transparent)"
          : "var(--vp-card-border, var(--color-border))",
        boxShadow: "var(--vp-card-glow, var(--shadow-card))",
      }}
    >
      {eyebrow && (
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--vp-accent,var(--color-accent,var(--color-primary)))]">
          {eyebrow}
        </p>
      )}
      <div className={`flex gap-4 ${isHero ? "flex-col items-center" : "items-start"}`}>
        {icon && (
          <div
            className={`flex shrink-0 items-center justify-center rounded-xl ${
              isHero ? "h-14 w-14 text-3xl" : "h-10 w-10 text-xl"
            }`}
            style={{ background: "var(--vp-accent-muted, color-mix(in srgb, var(--color-primary) 15%, transparent))" }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold text-[var(--vp-text,var(--color-text))] ${isHero ? "text-lg" : "text-base"}`}>
            {title}
          </h3>
          {uncertain && uncertainLabel && (
            <span className="mt-1 inline-block rounded-full bg-[color-mix(in_srgb,var(--color-text-muted)_15%,transparent)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
              {uncertainLabel}
            </span>
          )}
          <p className={`mt-2 leading-relaxed text-[var(--vp-text-muted,var(--color-text-muted))] ${isHero ? "text-base" : "text-sm"}`}>
            {content}
          </p>
        </div>
      </div>
    </article>
  );
}
