"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generateFreeReport } from "@astro/api-client";
import { useI18n, useT } from "@astro/i18n";
import { getVisualPackForTopic } from "@astro/tenant-config";
import { VisualPackScope } from "@astro/theme-engine";
import { Button, CosmicLoading, PageShell } from "@astro/ui";
import { miniAppPaths } from "../navigation";
import { useMiniApp } from "../context";
import { useMiniAppAnalytics } from "../useAnalytics";

export function LoadingScreen() {
  const { config, userId, birthProfile, setReport, previewMode } = useMiniApp();
  const { track } = useMiniAppAnalytics();
  const { locale } = useI18n();
  const t = useT();
  const router = useRouter();
  const paths = miniAppPaths(config.slug);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const visualPack = birthProfile?.topic
    ? getVisualPackForTopic(birthProfile.topic)
    : "cosmic_pastel";

  const steps = useMemo(
    () => [
      t("miniapp.loading.stepChart"),
      t("miniapp.loading.stepKeyPoints"),
      t("miniapp.loading.stepMiniReport"),
      t("miniapp.loading.stepConclusion"),
    ],
    [t]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((i) => Math.min(i + 1, steps.length - 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [steps.length]);

  useEffect(() => {
    if (previewMode) return;
    let cancelled = false;
    track("free_report_requested", { topic: birthProfile?.topic });
    async function load() {
      try {
        if (!birthProfile?.topic) {
          throw new Error(t("miniapp.onboarding.errTopic"));
        }
        const result = await generateFreeReport(config.tenantId, {
          tenantSlug: config.slug,
          locale,
          birthProfile,
        });
        if (!cancelled) {
          setReport(result);
          track("free_report_ready", { reportId: result.id, topic: birthProfile.topic });
          router.push(paths.report);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("miniapp.loading.errorDefault")
          );
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [
    config.tenantId,
    userId,
    birthProfile,
    setReport,
    router,
    paths.report,
    previewMode,
    retryKey,
    track,
    locale,
    t,
  ]);

  if (error) {
    return (
      <PageShell title={t("miniapp.loading.errorTitle")}>
        <p className="text-center text-sm text-[var(--color-text-muted)]">{error}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button fullWidth onClick={() => { setError(null); setRetryKey((k) => k + 1); }}>
            {t("common.tryAgain")}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.push(paths.home)}>
            {t("miniapp.loading.returnHome")}
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <VisualPackScope pack={visualPack}>
      <PageShell title={t("miniapp.loading.title")}>
        <CosmicLoading
          steps={steps}
          activeStep={activeStep}
          subtitle={t("miniapp.loading.craftingFrom", { displayName: config.brand.displayName })}
        />
      </PageShell>
    </VisualPackScope>
  );
}
