"use client";

import type { ReportSectionV2 } from "@astro/tenant-config";

interface DisclaimerSectionProps {
  section: ReportSectionV2;
}

export function DisclaimerSection({ section }: DisclaimerSectionProps) {
  return (
    <p className="rounded-lg border border-dashed border-[color-mix(in_srgb,var(--color-text-muted)_30%,transparent)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
      <strong>{section.title}:</strong> {section.content}
    </p>
  );
}
