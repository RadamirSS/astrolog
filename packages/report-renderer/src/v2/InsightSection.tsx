"use client";

import type { ReportSectionV2 } from "@astro/tenant-config";
import { StoryReportCard } from "@astro/ui";

interface InsightSectionProps {
  section: ReportSectionV2;
}

export function InsightSection({ section }: InsightSectionProps) {
  return (
    <StoryReportCard
      title={section.title}
      content={section.content}
    />
  );
}
