"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { validateMiniAppPublish } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { Button } from "@astro/ui";
import { useDashboard } from "../app/components/DashboardProvider";
import { BuilderPreviewPanel } from "./BuilderPreviewPanel";
import { LaunchChecklist } from "./LaunchChecklist";
import { LaunchStepNav } from "./LaunchStepNav";
import { LaunchStatusChip } from "./LaunchStatusChip";
import { buildLaunchProgressSteps, getLaunchProgressPercent } from "../lib/launch-progress";

export function LaunchShell({ children }: { children: ReactNode }) {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId") ?? "tenant_mystic";
  const { config, loading, isDirty } = useDashboard();
  const [previewOpen, setPreviewOpen] = useState(false);

  if (loading || !config) {
    return <p className="text-slate-400">{t("dashboard.design.loading")}</p>;
  }

  const validation = validateMiniAppPublish(config);
  const isPublished = config.miniApp?.publicStatus === "published";
  const publicSlug = config.miniApp?.publicSlug ?? config.slug;
  const publicUrl = `${process.env.NEXT_PUBLIC_MINIAPP_URL ?? "http://localhost:3000"}/s/${publicSlug}`;

  async function copyPublicLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(publicUrl);
    }
  }

  const onPublishStep = pathname.includes("/launch/publish");
  const primaryHref = validation.valid
    ? `/launch/publish?tenantId=${tenantId}`
    : pathname.includes("/launch/start")
      ? `/launch/branding?tenantId=${tenantId}`
      : `/launch/start?tenantId=${tenantId}`;

  const progressSteps = buildLaunchProgressSteps(config);
  const progressPct = getLaunchProgressPercent(progressSteps);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-sky-950/30 via-slate-900 to-slate-950 p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              {t("dashboard.launch.title")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {t("dashboard.launch.subtitle")}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <LaunchStatusChip config={config} />
              {isDirty ? (
                <span className="text-xs text-amber-400">{t("dashboard.launch.unsavedIndicator")}</span>
              ) : (
                <span className="text-xs text-slate-500">{t("dashboard.launch.savedIndicator")}</span>
              )}
            </div>
            <div className="mt-4 max-w-md">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{t("dashboard.launch.progressLabel")}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-violet-600 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!onPublishStep && (
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:bg-violet-500"
              >
                {validation.valid
                  ? t("dashboard.launch.publishNow")
                  : t("dashboard.launch.continueSetup")}
              </Link>
            )}
            {onPublishStep && (
              <span className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white">
                {t("dashboard.launch.publishNow")}
              </span>
            )}
            {isPublished && (
              <Button type="button" variant="secondary" onClick={() => void copyPublicLink()}>
                {t("dashboard.launch.copyLink")}
              </Button>
            )}
            <Button type="button" variant="secondary" className="lg:hidden" onClick={() => setPreviewOpen(true)}>
              {t("dashboard.launch.openPreview")}
            </Button>
            {isPublished && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-violet-300 hover:bg-slate-800"
              >
                {t("dashboard.launch.openPublicPage")}
              </a>
            )}
          </div>
        </div>
      </div>

      <LaunchChecklist config={config} />
      <LaunchStepNav />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_500px]">
        <div className="min-w-0 space-y-6">{children}</div>
        <aside className="hidden lg:block">
          <div className="sticky top-8 overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 shadow-xl shadow-black/20">
            <BuilderPreviewPanel config={config} published={isPublished} />
          </div>
        </aside>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 p-4 lg:hidden">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-200">
                {t("dashboard.preview.livePreview")}
              </h3>
              <Button type="button" variant="ghost" onClick={() => setPreviewOpen(false)}>
                {t("common.close")}
              </Button>
            </div>
            <BuilderPreviewPanel config={config} published={isPublished} />
          </div>
        </div>
      )}
    </div>
  );
}
