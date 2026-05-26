"use client";

import { useEffect } from "react";
import { useT } from "@astro/i18n";
import { LoadingState } from "@astro/ui";
import { useDashboard } from "../../components/DashboardProvider";
import { CreatorControlCenter } from "../../../components/CreatorControlCenter";
import { useDashboardAnalytics } from "../../../lib/useDashboardAnalytics";

export default function OverviewPage() {
  const t = useT();
  const { config, loading, tenantId, isDirty } = useDashboard();
  const track = useDashboardAnalytics(tenantId, config?.slug);

  useEffect(() => {
    if (config) track("dashboard_opened");
  }, [config, track]);

  if (loading || !config) {
    return (
      <LoadingState message={t("dashboard.controlCenter.loading")} className="text-slate-400" />
    );
  }

  return <CreatorControlCenter config={config} tenantId={tenantId} isDirty={isDirty} />;
}
