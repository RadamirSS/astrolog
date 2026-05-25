"use client";

import { useT } from "@astro/i18n";
import { PlaceholderSection } from "../../../components/PlaceholderSection";

export default function TelegramPage() {
  const t = useT();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.telegramPage.title")}</h1>
        <p className="text-slate-400">{t("dashboard.telegramPage.subtitle")}</p>
      </div>
      <PlaceholderSection
        title={t("dashboard.telegramPage.sectionTitle")}
        description={t("dashboard.telegramPage.sectionDesc")}
        buttonLabel={t("dashboard.telegramPage.connectBtn")}
      />
    </div>
  );
}
