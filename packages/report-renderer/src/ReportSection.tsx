import type { ReportSection } from "@astro/tenant-config";
import { Card } from "@astro/ui";

export function ReportSectionBlock({ section }: { section: ReportSection }) {
  const variantClass =
    section.variant === "quote"
      ? "border-l-4 border-[var(--color-accent,var(--color-primary))] pl-4 italic"
      : section.variant === "highlight"
        ? "border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))]"
        : "";

  return (
    <Card className={variantClass}>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {section.title}
      </h3>
      <p className="max-w-prose text-sm leading-relaxed text-[var(--color-text)]">
        {section.content}
      </p>
    </Card>
  );
}
