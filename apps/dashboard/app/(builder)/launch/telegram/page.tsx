"use client";

import { useSearchParams } from "next/navigation";
import { useT } from "@astro/i18n";
import { TelegramBotConnectForm } from "../../../../components/TelegramBotConnectForm";
import { ensureSurfaces, isSurfaceEnabled } from "@astro/tenant-config";
import { useDashboard } from "../../../components/DashboardProvider";

export default function LaunchTelegramPage() {
  const t = useT();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId") ?? "tenant_mystic";
  const { config, refresh } = useDashboard();

  if (!config) return null;
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  if (!isSurfaceEnabled(miniApp, "telegram_mini_app")) {
    return (
      <p className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
        {t("dashboard.launch.telegramDisabled")}
      </p>
    );
  }

  return (
    <TelegramBotConnectForm
      tenantId={tenantId}
      onConnected={() => void refresh()}
      onDisconnected={() => void refresh()}
    />
  );
}
