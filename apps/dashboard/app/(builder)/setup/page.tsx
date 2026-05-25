"use client";

import { useT } from "@astro/i18n";
import { useDashboard } from "../../components/DashboardProvider";
import { SetupWizard } from "../../../components/SetupWizard";

export default function SetupPage() {
  const t = useT();
  const { config, loading, tenantId, updateConfig, saveDraft } = useDashboard();

  if (loading || !config) return <p className="text-slate-400">{t("dashboard.setup.loading")}</p>;

  return (
    <SetupWizard
      config={config}
      tenantId={tenantId}
      onUpdate={updateConfig}
      onComplete={saveDraft}
    />
  );
}
