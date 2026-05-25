"use client";

import type { ReportSectionV2 } from "@astro/tenant-config";
import { StoryReportCard } from "@astro/ui";

interface HeroSectionProps {
  section: ReportSectionV2;
}

export function HeroSection({ section }: HeroSectionProps) {
  return (
    <StoryReportCard
      variant="hero"
      eyebrow="✦"
      title={section.title}
      content={section.content}
    />
  );
}
