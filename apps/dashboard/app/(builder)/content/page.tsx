"use client";

import { getDefaultSellingCopy, createDefaultMiniApp } from "@astro/tenant-config";
import { FormActions, Input, SectionCard, Textarea, Toggle } from "@astro/ui";
import { useT } from "@astro/i18n";
import { useDashboard } from "../../components/DashboardProvider";
import { EditorLayout } from "../../../components/EditorLayout";
import { FaqEditor } from "../../../components/FaqEditor";
import { useFieldValidation } from "../../../hooks/useFieldValidation";
import { useDashboardAnalytics } from "../../../lib/useDashboardAnalytics";

export default function ContentPage() {
  const t = useT();
  const { config, loading, updateConfig, saveDraft, resetToSaved, saving, isDirty, tenantId } =
    useDashboard();
  const { getError } = useFieldValidation(config);
  const track = useDashboardAnalytics(tenantId, config?.slug);

  if (loading || !config) return <p className="text-slate-400">{t("dashboard.content.loading")}</p>;

  const displayName = config.brand.displayName;

  function restoreDefaults() {
    const defaults = getDefaultSellingCopy(displayName);
    updateConfig((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        home: {
          ...prev.content.home,
          ...defaults.home,
        },
        onboarding: {
          ...prev.content.onboarding,
          ...defaults.onboarding,
        },
        reportIntro: defaults.reportIntro,
        productsIntro: defaults.productsIntro,
        paywall: defaults.paywall,
        loadingMessages: defaults.loadingMessages,
      },
    }));
  }

  const consultation = config.content.home.consultationCta ?? {
    title: "Book a Personal Consultation",
    subtitle: "",
    enabled: true,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.content.title")}</h1>
        <p className="text-slate-400">{t("dashboard.content.subtitle")}</p>
      </div>

      <EditorLayout config={config}>
        <SectionCard title={t("dashboard.content.homeScreen")}>
          <div className="space-y-4">
            <Input
              label={t("dashboard.content.homeTitle")}
              value={config.content.home.headline}
              error={getError("content.home.headline")}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    home: { ...prev.content.home, headline: e.target.value },
                  },
                }))
              }
            />
            <Textarea
              label={t("dashboard.content.homeSubtitle")}
              value={config.content.home.subheadline ?? ""}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    home: { ...prev.content.home, subheadline: e.target.value },
                  },
                }))
              }
            />
            <Input
              label={t("dashboard.content.mainButtonText")}
              value={config.content.home.ctaLabel}
              error={getError("content.home.ctaLabel")}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    home: { ...prev.content.home, ctaLabel: e.target.value },
                  },
                }))
              }
            />
          </div>
        </SectionCard>

        <SectionCard title={t("dashboard.content.onboarding")}>
          <div className="space-y-4">
            <Textarea
              label={t("dashboard.content.onboardingTitle")}
              value={config.content.onboarding.welcomeText ?? ""}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    onboarding: { ...prev.content.onboarding, welcomeText: e.target.value },
                  },
                }))
              }
            />
            <Textarea
              label={t("dashboard.content.onboardingSubtitle")}
              value={config.content.onboarding.stepsIntro ?? ""}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    onboarding: { ...prev.content.onboarding, stepsIntro: e.target.value },
                  },
                }))
              }
            />
          </div>
        </SectionCard>

        <SectionCard title={t("dashboard.content.reportPaywall")}>
          <div className="space-y-4">
            <Textarea
              label={t("dashboard.content.freeReportTitle")}
              value={config.content.reportIntro ?? ""}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  content: { ...prev.content, reportIntro: e.target.value },
                }))
              }
            />
            <Input
              label={t("dashboard.content.reportLoadingText")}
              value={config.content.loadingMessages?.[0] ?? ""}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    loadingMessages: e.target.value
                      ? [e.target.value, ...(prev.content.loadingMessages?.slice(1) ?? [])]
                      : prev.content.loadingMessages?.slice(1),
                  },
                }))
              }
            />
            <Input
              label={t("dashboard.content.paywallTitle")}
              value={config.content.paywall?.title ?? ""}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    paywall: {
                      title: e.target.value,
                      subtitle: prev.content.paywall?.subtitle,
                    },
                  },
                }))
              }
            />
            <Textarea
              label={t("dashboard.content.paywallSubtitle")}
              value={config.content.paywall?.subtitle ?? ""}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    paywall: {
                      title: prev.content.paywall?.title ?? "Unlock Full Access",
                      subtitle: e.target.value,
                    },
                  },
                }))
              }
            />
          </div>
        </SectionCard>

        <SectionCard title={t("dashboard.content.consultationBlock")}>
          <div className="space-y-4">
            <Toggle
              label={t("dashboard.content.showConsultation")}
              checked={consultation.enabled}
              onChange={(enabled) =>
                updateConfig((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    home: {
                      ...prev.content.home,
                      consultationCta: { ...consultation, enabled },
                    },
                  },
                }))
              }
            />
            <Input
              label={t("dashboard.content.consultationTitle")}
              value={consultation.title}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    home: {
                      ...prev.content.home,
                      consultationCta: { ...consultation, title: e.target.value },
                    },
                  },
                }))
              }
            />
            <Textarea
              label={t("dashboard.content.consultationSubtitle")}
              value={consultation.subtitle ?? ""}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    home: {
                      ...prev.content.home,
                      consultationCta: { ...consultation, subtitle: e.target.value },
                    },
                  },
                }))
              }
            />
          </div>
        </SectionCard>

        <SectionCard
          title={t("dashboard.content.miniAppCopy", { defaultValue: "Creator intro copy" })}
        >
          <div className="space-y-4">
            <Textarea
              label={t("dashboard.content.introCopy", { defaultValue: "Landing intro" })}
              value={config.miniApp?.introCopy ?? ""}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  miniApp: {
                    ...(prev.miniApp ?? createDefaultMiniApp(prev.slug)),
                    introCopy: e.target.value,
                  },
                }))
              }
            />
            <Textarea
              label={t("dashboard.content.welcomeMessage", { defaultValue: "Welcome message" })}
              value={config.miniApp?.welcomeMessage ?? ""}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  miniApp: {
                    ...(prev.miniApp ?? createDefaultMiniApp(prev.slug)),
                    welcomeMessage: e.target.value,
                  },
                }))
              }
            />
            <Input
              label={t("dashboard.content.promoCtaCopy", { defaultValue: "Promo CTA copy" })}
              value={config.miniApp?.promoCtaCopy ?? ""}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  miniApp: {
                    ...(prev.miniApp ?? createDefaultMiniApp(prev.slug)),
                    promoCtaCopy: e.target.value,
                  },
                }))
              }
            />
          </div>
        </SectionCard>

        <SectionCard title={t("dashboard.content.faq")}>
          <FaqEditor
            items={config.content.home.faqItems ?? []}
            getItemError={(index) => getError(`content.home.faqItems.${index}`)}
            onChange={(items) =>
              updateConfig((prev) => ({
                ...prev,
                content: {
                  ...prev.content,
                  home: { ...prev.content.home, faqItems: items },
                },
              }))
            }
          />
        </SectionCard>

        <FormActions
          onSave={async () => {
            await saveDraft();
            track("dashboard_content_saved");
          }}
          onReset={resetToSaved}
          saving={saving}
          isDirty={isDirty}
          saveLabel={t("ui.saveChanges")}
          resetLabel={t("ui.resetToSaved")}
        />
        <button
          type="button"
          onClick={restoreDefaults}
          className="text-sm text-violet-400 hover:underline"
        >
          {t("dashboard.content.restoreDefaults")}
        </button>
      </EditorLayout>
    </div>
  );
}
