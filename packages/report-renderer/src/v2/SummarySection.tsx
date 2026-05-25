"use client";

import type { ReportSectionV2 } from "@astro/tenant-config";
import { StoryReportCard } from "@astro/ui";

interface SummarySectionProps {
  section: ReportSectionV2;
}

export function SummarySection({ section }: SummarySectionProps) {
  return (
    <StoryReportCard
      title={section.title}
      content={section.content}
      eyebrow="✦"
    />
  );
}
