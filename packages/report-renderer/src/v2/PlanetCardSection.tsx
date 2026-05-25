"use client";

import type { ReportSectionV2 } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { StoryReportCard } from "@astro/ui";

interface PlanetCardSectionProps {
  section: ReportSectionV2;
}

const PLANET_GLYPHS: Record<string, string> = {
  sun: "☉",
  moon: "☽",
  ascendant: "↑",
};

export function PlanetCardSection({ section }: PlanetCardSectionProps) {
  const t = useT();
  const glyph =
    section.icon ??
    (section.planet ? PLANET_GLYPHS[section.planet] : undefined);

  return (
    <StoryReportCard
      title={section.title}
      content={section.content}
      icon={glyph ? <span>{glyph}</span> : undefined}
      uncertain={section.uncertain}
      uncertainLabel={section.uncertain ? t("report.ascendantUncertain") : undefined}
    />
  );
}
