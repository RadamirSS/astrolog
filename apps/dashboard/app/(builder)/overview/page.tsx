"use client";

import Link from "next/link";
import { useEffect } from "react";
import { THEME_PRESET_OPTIONS } from "@astro/theme-engine";
import { useT } from "@astro/i18n";
import { FormActions, LoadingState, SectionCard, StatCard, StatusBadge } from "@astro/ui";
import { useDashboard } from "../../components/DashboardProvider";
import { SetupChecklist } from "../../../components/SetupChecklist";
import { useDashboardAnalytics } from "../../../lib/useDashboardAnalytics";
import { useDashboardMetrics } from "../../../hooks/useDashboardMetrics";
import { getThemePresetLabel } from "../../../lib/theme-preset-label";

const PILOT_TENANTS = [
  { id: "tenant_mystic", slug: "mystic-dark", label: "Mystic Veil" },
  { id: "tenant_soft", slug: "soft-feminine", label: "Rose Moon" },
  { id: "tenant_luxury", slug: "luxury-gold", label: "Celestial Elite" },
];

export default function OverviewPage() {
  const t = useT();
  const { config, stats, loading, tenantId } = useDashboard();
  const { metrics, isMock } = useDashboardMetrics(tenantId);
  const track = useDashboardAnalytics(tenantId, config?.slug);

  useEffect(() => {
    if (config) track("dashboard_opened");
  }, [config, track]);

  if (loading || !config) {
    return <LoadingState message={t("dashboard.overview.loading")} className="text-slate-400" />;
  }

  const activeProducts = config.products.filter((p) => p.status === "active").length;
  const enabledModules = Object.entries(config.modules).filter(
    ([key, value]) => !["payments", "telegram", "analytics"].includes(key) && value === true
  ).length;
  const presetOption = THEME_PRESET_OPTIONS.find((p) => p.value === config.theme.preset);
  const presetLabel = presetOption
    ? getThemePresetLabel(presetOption.value, t)
    : config.theme.preset;
  const miniappUrl = process.env.NEXT_PUBLIC_MINIAPP_URL ?? "http://localhost:3000";
  const q = `?tenantId=${tenantId}`;

  const visits = metrics?.visits ?? stats?.totalSessions ?? 0;
  const reportsGenerated = metrics?.reportsGenerated ?? stats?.reportsGenerated ?? 0;
  const productClicks = metrics?.productClicks ?? stats?.productClicks ?? 0;
  const birthProfiles = metrics?.birthProfilesSubmitted ?? 0;
  const ctaClicks = metrics?.productCtaClicks ?? 0;
  const reportFailures = metrics?.reportFailures ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.overview.title")}</h1>
        <p className="text-slate-400">{t("dashboard.overview.subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("dashboard.overview.brand")} value={config.brand.displayName} />
        <StatCard label={t("dashboard.overview.theme")} value={presetLabel} />
        <StatCard label={t("dashboard.overview.activeOfferings")} value={activeProducts} />
        <StatCard label={t("dashboard.overview.appFeatures")} value={enabledModules} />
      </div>

      <SectionCard title={t("dashboard.overview.appStatus")}>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={config.status} />
          <span className="text-sm text-slate-400">
            {t("dashboard.overview.version", { version: config.version })}
          </span>
          {config.publishedAt && (
            <span className="text-sm text-slate-400">
              {t("dashboard.overview.lastLive", {
                datetime: new Date(config.publishedAt).toLocaleString(),
              })}
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/preview${q}`}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm hover:bg-violet-500"
          >
            {t("dashboard.overview.openPreview")}
          </Link>
          <a
            href={`${miniappUrl}/${config.slug}?preview=draft`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            {t("dashboard.overview.openMiniApp")}
          </a>
          <Link
            href={`/setup${q}`}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            {t("dashboard.overview.setupWizard")}
          </Link>
        </div>
      </SectionCard>

      <SectionCard
        title={t("dashboard.overview.pilotTenants")}
        description={t("dashboard.overview.pilotTenantsDesc")}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {PILOT_TENANTS.map((tenant) => (
            <div key={tenant.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="font-medium text-slate-200">{tenant.label}</p>
              <div className="mt-2 flex flex-col gap-1 text-xs">
                <a
                  href={`${miniappUrl}/${tenant.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-400 hover:underline"
                >
                  {t("dashboard.overview.openMiniAppLink")}
                </a>
                <Link href={`/overview?tenantId=${tenant.id}`} className="text-violet-400 hover:underline">
                  {t("dashboard.overview.editInDashboard")}
                </Link>
              </div>
            </div>
          ))}
        </div>
        <a
          href={`${miniappUrl}/tenants`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-violet-400 hover:underline"
        >
          {t("dashboard.overview.openLauncher")}
        </a>
      </SectionCard>

      <SetupChecklist config={config} tenantId={tenantId} />

      <SectionCard title={t("dashboard.overview.quickEdits")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: `/brand${q}`, label: t("dashboard.overview.brand"), desc: t("dashboard.overview.brandDesc") },
            { href: `/design${q}`, label: t("dashboard.overview.design"), desc: t("dashboard.overview.designDesc") },
            { href: `/content${q}`, label: t("dashboard.layout.content"), desc: t("dashboard.overview.contentDesc") },
            { href: `/products${q}`, label: t("dashboard.layout.products"), desc: t("dashboard.overview.productsDesc") },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-slate-800 bg-slate-950 p-4 transition-colors hover:border-violet-600"
            >
              <p className="font-medium text-slate-200">{item.label}</p>
              <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={isMock ? t("dashboard.overview.recentActivity") : t("dashboard.overview.liveActivity")}>
        <p className="mb-3 text-xs text-slate-500">
          {isMock ? t("dashboard.overview.activityNote") : t("dashboard.overview.liveActivityNote")}
        </p>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <StatCard label={t("dashboard.overview.sessions")} value={visits} />
          <StatCard label={t("dashboard.overview.birthProfiles")} value={birthProfiles} />
          <StatCard label={t("dashboard.overview.reportsGenerated")} value={reportsGenerated} />
          <StatCard label={t("dashboard.overview.offeringClicks")} value={productClicks} />
          <StatCard label={t("dashboard.overview.ctaClicks")} value={ctaClicks} />
          <StatCard label={t("dashboard.overview.reportFailures")} value={reportFailures} />
        </div>
        {metrics && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <StatCard
              label={t("dashboard.overview.conversionVisitProfile")}
              value={`${Math.round(metrics.conversion.visitToProfile * 100)}%`}
            />
            <StatCard
              label={t("dashboard.overview.conversionProfileReport")}
              value={`${Math.round(metrics.conversion.profileToReport * 100)}%`}
            />
            <StatCard
              label={t("dashboard.overview.conversionReportProduct")}
              value={`${Math.round(metrics.conversion.reportToProductClick * 100)}%`}
            />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
