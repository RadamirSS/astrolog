"use client";

import type { ReportHighlight } from "@astro/tenant-config";
import { useT } from "@astro/i18n";

export function normalizeHighlight(
  item: ReportHighlight,
  insightFallback: string
): { label: string; value: string } {
  return {
    label: item.label ?? item.title ?? insightFallback,
    value: item.value ?? item.text ?? "",
  };
}

export function useNormalizeHighlight() {
  const t = useT();
  return (item: ReportHighlight) => normalizeHighlight(item, t("report.insightFallback"));
}
