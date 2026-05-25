"use client";

import { useT } from "@astro/i18n";
import { PlaceholderSection } from "../../../components/PlaceholderSection";

export default function AnalyticsPage() {
  const t = useT();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.analytics.title")}</h1>
        <p className="text-slate-400">{t("dashboard.analytics.subtitle")}</p>
      </div>
      <PlaceholderSection
        title={t("dashboard.analytics.sectionTitle")}
        description={t("dashboard.analytics.sectionDesc")}
        buttonLabel={t("dashboard.analytics.connectBtn")}
      />
      <div className="flex h-32 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-500">
        {t("dashboard.analytics.chartPlaceholder")}
      </div>
    </div>
  );
}
