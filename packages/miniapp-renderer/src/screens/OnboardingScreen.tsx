"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { submitBirthProfile } from "@astro/api-client";
import { useI18n, useT } from "@astro/i18n";
import {
  birthProfileSchema,
  getFunnelTopicLabel,
  getVisualPackForTopic,
  type BirthTimeAccuracy,
  type FunnelTopic,
} from "@astro/tenant-config";
import { VisualPackScope } from "@astro/theme-engine";
import { BirthFormVisualShell, Button, Input, PageShell, Select } from "@astro/ui";
import { useMiniApp, useMiniAppNav } from "../context";
import { useMiniAppAnalytics, useTrackOnce } from "../useAnalytics";

const TIME_ACCURACY_OPTIONS: BirthTimeAccuracy[] = ["exact", "approximate", "unknown"];

export function OnboardingScreen() {
  const { config, userId, setBirthProfile, selectedTopic, setSelectedTopic } = useMiniApp();
  const nav = useMiniAppNav();
  const { track } = useMiniAppAnalytics();
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const t = useT();
  const labels = config.content.onboarding;

  const topicFromUrl = searchParams.get("topic") as FunnelTopic | null;
  const activeTopic = topicFromUrl ?? selectedTopic;
  const visualPack = activeTopic ? getVisualPackForTopic(activeTopic) : "cosmic_pastel";

  useTrackOnce("birth_form_started");
  useTrackOnce("onboarding_started");

  useEffect(() => {
    if (topicFromUrl && topicFromUrl !== selectedTopic) {
      setSelectedTopic(topicFromUrl);
    }
  }, [topicFromUrl, selectedTopic, setSelectedTopic]);

  const stepLabels = useMemo(
    () => [
      t("miniapp.onboarding.stepName"),
      t("miniapp.onboarding.stepBirthDetails"),
      t("miniapp.onboarding.stepBirthCity"),
    ],
    [t]
  );

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [timeAccuracy, setTimeAccuracy] = useState<BirthTimeAccuracy>("unknown");
  const [birthPlace, setBirthPlace] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateStep(): boolean {
    setError(null);
    if (step === 0 && !name.trim()) {
      setError(t("miniapp.onboarding.errName"));
      return false;
    }
    if (step === 1 && !birthDate) {
      setError(t("miniapp.onboarding.errBirthDate"));
      return false;
    }
    if (step === 2 && !birthPlace.trim()) {
      setError(t("miniapp.onboarding.errBirthPlace"));
      return false;
    }
    if (!activeTopic) {
      setError(t("miniapp.onboarding.errTopic"));
      return false;
    }
    return true;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (step < stepLabels.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    void handleSubmit();
  }

  async function handleSubmit() {
    const parsed = birthProfileSchema.safeParse({
      name,
      birthDate,
      birthTime: birthTime || null,
      timeAccuracy,
      birthPlace,
      topic: activeTopic ?? undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? t("miniapp.onboarding.errValidation"));
      return;
    }
    setLoading(true);
    try {
      const profile = await submitBirthProfile(config.tenantId, userId, {
        ...parsed.data,
        topic: parsed.data.topic ?? activeTopic ?? "personality",
        locale,
      });
      setBirthProfile(profile);
      track("birth_profile_submitted", { topic: parsed.data.topic });
      track("birth_form_completed", { topic: parsed.data.topic, timeAccuracy });
      if (config.modules.freeReport) nav.goLoading();
      else nav.goProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("miniapp.onboarding.errSubmit"));
    } finally {
      setLoading(false);
    }
  }

  const topicLabel = activeTopic
    ? `${labels.topicLabel ?? t("miniapp.onboarding.selectedTopic")}: ${getFunnelTopicLabel(activeTopic, locale)}`
    : undefined;

  return (
    <VisualPackScope pack={visualPack}>
      <PageShell
        title={labels.welcomeText ?? t("miniapp.onboarding.title")}
        subtitle={labels.stepsIntro}
        footer={
          <Button fullWidth onClick={handleNext} disabled={loading}>
            {step < stepLabels.length - 1
              ? t("miniapp.onboarding.continue")
              : loading
                ? t("common.loading")
                : t("miniapp.onboarding.submit")}
          </Button>
        }
      >
        <BirthFormVisualShell
          currentStep={step}
          totalSteps={stepLabels.length}
          stepLabels={stepLabels}
          topicLabel={topicLabel}
          timeAccuracyHint={step === 1 ? t("miniapp.onboarding.birthTimeHint") : undefined}
        >
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

          {step === 0 && (
            <Input
              label={t("miniapp.onboarding.nameLabel")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("miniapp.onboarding.namePlaceholder")}
            />
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <Input
                label={labels.birthDateLabel ?? t("miniapp.onboarding.birthDateLabel")}
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              <Input
                label={labels.birthTimeLabel ?? t("miniapp.onboarding.birthTimeLabel")}
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                disabled={timeAccuracy === "unknown"}
              />
              <Select
                label={t("miniapp.onboarding.timeAccuracyLabel")}
                value={timeAccuracy}
                onChange={(e) => {
                  const val = e.target.value as BirthTimeAccuracy;
                  setTimeAccuracy(val);
                  if (val === "unknown") setBirthTime("");
                }}
                options={TIME_ACCURACY_OPTIONS.map((value) => ({
                  value,
                  label: t(`miniapp.onboarding.timeAccuracy.${value}`),
                }))}
              />
              {timeAccuracy === "unknown" && (
                <p className="rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-3 py-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                  {t("miniapp.onboarding.birthTimeHint")}
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <Input
              label={labels.birthPlaceLabel ?? t("miniapp.onboarding.birthPlaceLabel")}
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              placeholder={t("miniapp.onboarding.birthPlacePlaceholder")}
            />
          )}
        </BirthFormVisualShell>
      </PageShell>
    </VisualPackScope>
  );
}
