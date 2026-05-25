"use client";

import type { ReportSectionV2 } from "@astro/tenant-config";
import { Button, StoryReportCard } from "@astro/ui";

interface CtaSectionProps {
  section: ReportSectionV2;
  onAction?: (productId?: string) => void;
}

export function CtaSection({ section, onAction }: CtaSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <StoryReportCard
        variant="cta"
        title={section.title}
        content={section.content}
      />
      {section.productId && (
        <Button
          fullWidth
          onClick={() => onAction?.(section.productId)}
        >
          {section.title}
        </Button>
      )}
    </div>
  );
}
