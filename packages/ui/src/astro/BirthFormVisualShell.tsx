"use client";

import type { ReactNode } from "react";
import { ProgressSteps } from "../ProgressSteps";

interface BirthFormVisualShellProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  topicLabel?: string;
  timeAccuracyHint?: string;
  children: ReactNode;
}

export function BirthFormVisualShell({
  currentStep,
  totalSteps,
  stepLabels,
  topicLabel,
  timeAccuracyHint,
  children,
}: BirthFormVisualShellProps) {
  return (
    <div className="flex flex-col gap-4">
      <ProgressSteps current={currentStep} total={totalSteps} labels={stepLabels} />

      {topicLabel && (
        <div
          className="rounded-xl border px-4 py-3"
          style={{
            background: "var(--vp-card-bg, var(--color-surface))",
            borderColor: "var(--vp-card-border, var(--color-border))",
          }}
        >
          <p className="text-xs text-[var(--vp-text-muted, var(--color-text-muted))]">
            {topicLabel}
          </p>
        </div>
      )}

      <div
        className="rounded-2xl border p-4"
        style={{
          background: "var(--vp-card-bg, var(--color-surface))",
          borderColor: "var(--vp-card-border, var(--color-border))",
          boxShadow: "var(--vp-card-glow, var(--shadow-card))",
        }}
      >
        {children}
      </div>

      {timeAccuracyHint && (
        <div
          className="rounded-xl border border-dashed px-4 py-3 text-xs leading-relaxed"
          style={{
            borderColor: "var(--vp-accent-muted, color-mix(in srgb, var(--color-primary) 30%, transparent))",
            color: "var(--vp-text-muted, var(--color-text-muted))",
          }}
        >
          {timeAccuracyHint}
        </div>
      )}
    </div>
  );
}
