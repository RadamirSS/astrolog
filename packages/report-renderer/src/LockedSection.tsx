"use client";

import type { LockedSection, ProductConfig } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { Button, Card } from "@astro/ui";

interface LockedSectionBlockProps {
  section: LockedSection;
  unlockProduct?: ProductConfig;
  onUnlock?: (productId?: string) => void;
}

export function LockedSectionBlock({
  section,
  unlockProduct,
  onUnlock,
}: LockedSectionBlockProps) {
  const t = useT();
  const ctaLabel = unlockProduct?.ctaLabel ?? t("report.unlockFull");

  return (
    <Card className="relative overflow-hidden border-[color-mix(in_srgb,var(--color-accent,var(--color-primary))_25%,transparent)]">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-accent,var(--color-primary))]">
        {t("report.premiumInsight")}
      </p>
      <h3 className="mb-2 font-semibold text-[var(--color-text)]">{section.title}</h3>
      <p className="select-none blur-[6px] text-sm leading-relaxed text-[var(--color-text-muted)]">
        {section.teaser}
      </p>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[color-mix(in_srgb,var(--color-bg)_55%,transparent)] px-6 backdrop-blur-[3px]">
        <span className="text-sm font-medium text-[var(--color-text)]">{t("report.unlockHeading")}</span>
        <span className="text-center text-xs text-[var(--color-text-muted)]">
          {unlockProduct
            ? t("report.availableWith", { productTitle: unlockProduct.title })
            : t("report.availableWithReading")}
        </span>
        <Button variant="secondary" className="mt-1" onClick={() => onUnlock?.(section.unlockProductId)}>
          {ctaLabel}
        </Button>
      </div>
    </Card>
  );
}
