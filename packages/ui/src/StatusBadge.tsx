"use client";

import { useT } from "@astro/i18n";
import { Badge } from "./Badge";

export type TenantStatus = "active" | "draft" | "paused" | string;

interface StatusBadgeProps {
  status: TenantStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const t = useT();

  const statusLabels: Record<string, { label: string; variant: "success" | "warning" | "neutral" | "info" | "error" }> = {
    active: { label: t("ui.live"), variant: "success" },
    draft: { label: t("ui.draft"), variant: "warning" },
    paused: { label: t("ui.paused"), variant: "neutral" },
  };

  const config = statusLabels[status] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    variant: "neutral" as const,
  };

  return (
    <span className={className}>
      <Badge variant={config.variant}>{config.label}</Badge>
    </span>
  );
}
