"use client";

import type { ProductConfig, Report } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { Button, Card, SectionHeader } from "@astro/ui";
import { LockedSectionBlock } from "./LockedSection";
import { RecommendedProducts } from "./RecommendedProducts";
import { ReportHighlights } from "./ReportHighlights";
import { ReportSectionBlock } from "./ReportSection";

interface ReportRendererV1Props {
  report: Report;
  products?: ProductConfig[];
  onCta?: (action: NonNullable<Report["cta"]>) => void;
  onUnlock?: (productId?: string) => void;
  onProductClick?: (productId: string) => void;
}

export function ReportRendererV1({
  report,
  products = [],
  onCta,
  onUnlock,
  onProductClick,
}: ReportRendererV1Props) {
  const t = useT();
  const freeSections = [...report.sections]
    .filter((s) => s.access !== "locked" && s.access !== "paid")
    .sort((a, b) => a.order - b.order);

  const lockedFromSections = [...report.sections]
    .filter((s) => s.access === "locked" || s.access === "paid")
    .sort((a, b) => a.order - b.order);

  const recommended =
    report.recommendedProducts?.length && products.length
      ? products.filter((p) => report.recommendedProducts!.includes(p.id))
      : [];

  const ctaLabel = report.cta?.buttonLabel ?? report.cta?.label;

  const productById = (id?: string) => (id ? products.find((p) => p.id === id) : undefined);

  return (
    <div className="flex flex-col gap-5">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-accent,var(--color-primary))]">
          {t("report.yourReading")}
        </p>
        <h2 className="text-xl font-bold text-[var(--color-text)]">{report.title}</h2>
        {report.subtitle && (
          <p className="text-sm text-[var(--color-text-muted)]">{report.subtitle}</p>
        )}
      </header>

      <Card className="border border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))]">
        <p className="text-base leading-relaxed text-[var(--color-text)]">{report.summary}</p>
      </Card>

      {report.highlights.length > 0 && <ReportHighlights highlights={report.highlights} />}

      {freeSections.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title={t("report.keyInsights")} />
          {freeSections.map((section) => (
            <ReportSectionBlock key={section.id} section={section} />
          ))}
        </div>
      )}

      {lockedFromSections.map((section) => (
        <LockedSectionBlock
          key={section.id}
          section={{
            id: section.id,
            title: section.title,
            teaser: section.content,
          }}
          onUnlock={onUnlock}
        />
      ))}

      {report.lockedSections?.map((section) => (
        <LockedSectionBlock
          key={section.id}
          section={section}
          unlockProduct={productById(section.unlockProductId)}
          onUnlock={onUnlock}
        />
      ))}

      {recommended.length > 0 && (
        <RecommendedProducts products={recommended} onProductClick={onProductClick} />
      )}

      {report.cta && (
        <Card className="border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] text-center">
          {report.cta.title && (
            <h3 className="font-semibold text-[var(--color-text)]">{report.cta.title}</h3>
          )}
          {report.cta.subtitle && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{report.cta.subtitle}</p>
          )}
          <Button fullWidth className="mt-4" variant="secondary" onClick={() => onCta?.(report.cta!)}>
            {ctaLabel}
          </Button>
        </Card>
      )}

      {report.generatedAt && (
        <p className="text-center text-xs text-[var(--color-text-muted)]">
          {t("report.preparedOn", {
            date: new Date(report.generatedAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
          })}
        </p>
      )}
    </div>
  );
}

export { ReportHighlights } from "./ReportHighlights";
export { ReportSectionBlock } from "./ReportSection";
export { LockedSectionBlock } from "./LockedSection";
export { RecommendedProducts } from "./RecommendedProducts";
