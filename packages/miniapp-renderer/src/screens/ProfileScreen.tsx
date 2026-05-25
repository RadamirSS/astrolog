"use client";

import { useMemo } from "react";
import { isReportV2 } from "@astro/tenant-config";
import { LocaleSwitcher, useI18n, useT } from "@astro/i18n";
import { getLocalizedLabelMaps, type FunnelTopic } from "@astro/tenant-config";
import { Button, Card, EmptyState, LoadingState, PageShell } from "@astro/ui";
import { useMiniApp, useMiniAppNav } from "../context";
import { useTrackOnce } from "../useAnalytics";

export function ProfileScreen() {
  const { config, birthProfile, report, hydrated } = useMiniApp();
  const nav = useMiniAppNav();
  const { locale } = useI18n();
  const t = useT();
  const labels = config.content.profileLabels ?? {};
  const { birthProfileTopicLabels } = useMemo(
    () => getLocalizedLabelMaps(locale),
    [locale]
  );

  useTrackOnce("profile_viewed");

  const reportDate =
    report && isReportV2(report)
      ? report.createdAt
      : report && "generatedAt" in report
        ? report.generatedAt
        : null;

  return (
    <PageShell
      title={t("miniapp.profile.title")}
      footer={
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={nav.goHome}>
              {t("miniapp.profile.home")}
            </Button>
            {config.modules.onboarding && (
              <Button fullWidth onClick={() => nav.goHome()}>
                {birthProfile
                  ? t("miniapp.profile.updateProfile")
                  : t("miniapp.profile.completeProfile")}
              </Button>
            )}
          </div>
          <Button variant="secondary" fullWidth onClick={nav.goReports}>
            {t("miniapp.profile.myReports")}
          </Button>
          <div className="flex justify-center">
            <LocaleSwitcher />
          </div>
        </div>
      }
    >
      {!hydrated ? (
        <LoadingState message={t("miniapp.profile.loading")} />
      ) : birthProfile ? (
        <div className="flex flex-col gap-4">
          <ProfileCard
            profile={birthProfile}
            labels={labels}
            topicLabels={birthProfileTopicLabels}
            t={t}
          />
          <Card>
            <h3 className="text-sm font-semibold text-[var(--color-text-muted)]">
              {t("miniapp.profile.yourAstrologer")}
            </h3>
            <p className="mt-1 font-medium text-[var(--color-text)]">{config.brand.displayName}</p>
          </Card>
          <Card>
            <h3 className="font-medium text-[var(--color-text)]">{t("miniapp.profile.yourReadings")}</h3>
            {report ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-[var(--color-text)]">{report.title}</p>
                {reportDate && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {t("miniapp.profile.generated", {
                      date: new Date(reportDate).toLocaleDateString(),
                    })}
                  </p>
                )}
                {config.modules.freeReport && (
                  <Button variant="secondary" className="mt-2" onClick={nav.goReport}>
                    {t("miniapp.profile.viewReading")}
                  </Button>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {t("miniapp.profile.noReadings")}
              </p>
            )}
          </Card>
        </div>
      ) : (
        <EmptyState
          icon="✦"
          title={t("miniapp.profile.notCompleteTitle")}
          description={t("miniapp.profile.notCompleteDesc")}
          action={<Button onClick={nav.goHome}>{t("miniapp.profile.startOnboarding")}</Button>}
        />
      )}
    </PageShell>
  );
}

function ProfileCard({
  profile,
  labels,
  topicLabels,
  t,
}: {
  profile: {
    name: string;
    birthDate: string;
    birthTime?: string | null;
    timeAccuracy?: string;
    birthPlace: string;
    topic?: FunnelTopic;
  };
  labels: Record<string, string>;
  topicLabels: Record<FunnelTopic, string>;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <Card>
      <h3 className="mb-3 font-semibold text-[var(--color-text)]">{t("miniapp.profile.birthProfile")}</h3>
      <dl className="space-y-3 text-sm">
        <Row label={labels.name ?? t("miniapp.profile.name")} value={profile.name} />
        <Row label={labels.birthDate ?? t("miniapp.profile.birthDate")} value={profile.birthDate} />
        {profile.birthTime && (
          <Row label={t("miniapp.profile.birthTime")} value={profile.birthTime} />
        )}
        {profile.timeAccuracy && (
          <Row
            label={t("miniapp.onboarding.timeAccuracyLabel")}
            value={t(`miniapp.onboarding.timeAccuracy.${profile.timeAccuracy}`)}
          />
        )}
        <Row label={labels.birthPlace ?? t("miniapp.profile.birthCity")} value={profile.birthPlace} />
        {profile.topic && (
          <Row label={t("miniapp.profile.focusArea")} value={topicLabels[profile.topic]} />
        )}
      </dl>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="font-medium text-[var(--color-text)]">{value}</dd>
    </div>
  );
}
