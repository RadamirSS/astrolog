"use client";

import type { IntegrationModuleStatus } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { Badge } from "./Badge";
import { Card } from "./Card";

const STATUS_VARIANTS: Record<
  IntegrationModuleStatus,
  "neutral" | "info" | "success" | "warning" | "error"
> = {
  not_configured: "neutral",
  coming_later: "warning",
  mock_only: "info",
  active: "success",
  error: "error",
};

interface IntegrationStatusCardProps {
  title: string;
  description?: string;
  status: IntegrationModuleStatus;
}

export function IntegrationStatusCard({ title, description, status }: IntegrationStatusCardProps) {
  const t = useT();

  const statusLabels: Record<IntegrationModuleStatus, string> = {
    not_configured: t("ui.notConfigured"),
    coming_later: t("ui.comingLater"),
    mock_only: t("ui.mockOnly"),
    active: t("ui.active"),
    error: t("ui.error"),
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-slate-100">{title}</h3>
          {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
        </div>
        <Badge variant={STATUS_VARIANTS[status]}>{statusLabels[status]}</Badge>
      </div>
    </Card>
  );
}
