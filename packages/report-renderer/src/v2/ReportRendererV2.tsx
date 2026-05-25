"use client";

import type { ProductConfig, ReportAction, ReportSectionV2, ReportV2 } from "@astro/tenant-config";
import { getVisualPackForReport } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { VisualPackScope } from "@astro/theme-engine";
import { Button } from "@astro/ui";
import { LockedSectionBlock } from "../LockedSection";
import { CtaSection } from "./CtaSection";
import { DisclaimerSection } from "./DisclaimerSection";
import { HeroSection } from "./HeroSection";
import { InsightSection } from "./InsightSection";
import { PlanetCardSection } from "./PlanetCardSection";
import { SummarySection } from "./SummarySection";

interface ReportRendererV2Props {
  report: ReportV2;
  products?: ProductConfig[];
  onAction?: (action: ReportAction) => void;
  onProductClick?: (productId?: string) => void;
}

function renderSection(
  section: ReportSectionV2,
  onProductClick?: (productId?: string) => void
) {
  switch (section.type) {
    case "hero":
      return <HeroSection key={section.id} section={section} />;
    case "planet_card":
      return <PlanetCardSection key={section.id} section={section} />;
    case "insight":
      return <InsightSection key={section.id} section={section} />;
    case "summary":
      return <SummarySection key={section.id} section={section} />;
    case "locked_preview":
      return (
        <LockedSectionBlock
          key={section.id}
          section={{ id: section.id, title: section.title, teaser: section.content }}
          onUnlock={() => section.productId && onProductClick?.(section.productId)}
        />
      );
    case "cta":
      return (
        <CtaSection
          key={section.id}
          section={section}
          onAction={onProductClick}
        />
      );
    case "disclaimer":
      return <DisclaimerSection key={section.id} section={section} />;
    default:
      return null;
  }
}

export function ReportRendererV2({
  report,
  products: _products = [],
  onAction,
  onProductClick,
}: ReportRendererV2Props) {
  const t = useT();
  const visualPack = getVisualPackForReport(report);
  const sections = [...report.sections].sort((a, b) => a.order - b.order);

  return (
    <VisualPackScope pack={visualPack}>
      <div className="flex flex-col gap-4">
        <header className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--vp-accent,var(--color-accent,var(--color-primary)))]">
            {t("report.yourReading")}
          </p>
          <h2 className="text-xl font-bold text-[var(--vp-text,var(--color-text))]">{report.title}</h2>
          {report.subtitle && (
            <p className="text-sm text-[var(--vp-text-muted,var(--color-text-muted))]">{report.subtitle}</p>
          )}
        </header>

        {sections.map((section) => renderSection(section, onProductClick))}

        {report.actions && report.actions.length > 0 && (
          <div className="flex flex-col gap-2">
            {report.actions.map((action) => (
              <Button
                key={action.id}
                fullWidth
                variant={action.type === "open_paywall" ? "ghost" : "secondary"}
                onClick={() => onAction?.(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {report.createdAt && (
          <p className="text-center text-xs text-[var(--vp-text-muted,var(--color-text-muted))]">
            {t("report.preparedOn", {
              date: new Date(report.createdAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
            })}
          </p>
        )}
      </div>
    </VisualPackScope>
  );
}
