"use client";

import { useState } from "react";
import { Badge, ConfirmDialog, FormActions, IntegrationStatusCard, SectionCard, Toggle } from "@astro/ui";
import { getApiMode } from "@astro/api-client";
import { useT } from "@astro/i18n";
import { useDashboard } from "../../components/DashboardProvider";

export default function SettingsPage() {
  const t = useT();
  const {
    config,
    loading,
    tenantId,
    updateConfig,
    saveDraft,
    discardServerDraft,
    saving,
    isDirty,
    hasUnpublishedChanges,
    draftUpdatedAt,
    lastPublishedAt,
    publishedConfig,
  } = useDashboard();
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if (loading || !config) return <p className="text-slate-400">{t("dashboard.settings.loading")}</p>;

  function toggleModule(key: "onboarding" | "freeReport" | "products" | "profile", value: boolean) {
    updateConfig((prev) => ({
      ...prev,
      modules: { ...prev.modules, [key]: value },
    }));
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.settings.title")}</h1>
        <p className="text-slate-400">{t("dashboard.settings.subtitle")}</p>
      </div>

      <SectionCard title={t("dashboard.settings.draftPublishStatus")}>
        <dl className="space-y-2 text-sm">
          <Row
            label={t("dashboard.settings.lastSavedDraft")}
            value={draftUpdatedAt ? new Date(draftUpdatedAt).toLocaleString() : t("dashboard.publish.dash")}
          />
          <Row
            label={t("dashboard.settings.lastPublished")}
            value={lastPublishedAt ? new Date(lastPublishedAt).toLocaleString() : t("dashboard.publish.never")}
          />
          <Row
            label={t("dashboard.settings.publishedVersion")}
            value={publishedConfig ? `v${publishedConfig.version}` : t("dashboard.publish.notPublished")}
          />
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          {isDirty && <Badge variant="warning">{t("dashboard.publish.unsavedLocal")}</Badge>}
          {hasUnpublishedChanges ? (
            <Badge variant="warning">{t("dashboard.publish.unpublished")}</Badge>
          ) : (
            publishedConfig && <Badge variant="success">{t("dashboard.publish.draftMatches")}</Badge>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">{t("dashboard.settings.modulesNote")}</p>
      </SectionCard>

      <SectionCard title={t("dashboard.settings.tenantInfo")}>
        <dl className="space-y-2 text-sm">
          <Row label={t("dashboard.settings.tenantId")} value={tenantId} />
          <Row label={t("dashboard.settings.slug")} value={config.slug} />
          <Row label={t("dashboard.settings.status")} value={config.status} />
          <Row label={t("dashboard.settings.apiMode")} value={getApiMode()} />
        </dl>
      </SectionCard>

      <SectionCard title={t("dashboard.settings.miniAppModules")}>
        <div className="space-y-3">
          <Toggle
            label={t("dashboard.settings.onboarding")}
            description={t("dashboard.settings.onboardingDesc")}
            checked={config.modules.onboarding}
            onChange={(v) => toggleModule("onboarding", v)}
          />
          <Toggle
            label={t("dashboard.settings.freeReport")}
            description={t("dashboard.settings.freeReportDesc")}
            checked={config.modules.freeReport}
            onChange={(v) => toggleModule("freeReport", v)}
          />
          <Toggle
            label={t("dashboard.settings.products")}
            description={t("dashboard.settings.productsDesc")}
            checked={config.modules.products}
            onChange={(v) => toggleModule("products", v)}
          />
          <Toggle
            label={t("dashboard.settings.profile")}
            description={t("dashboard.settings.profileDesc")}
            checked={config.modules.profile}
            onChange={(v) => toggleModule("profile", v)}
          />
          <Toggle
            label={t("dashboard.settings.payments")}
            description={t("dashboard.settings.paymentsDesc")}
            checked={false}
            disabled
            onChange={() => undefined}
          />
        </div>
        <FormActions
          onSave={() => void saveDraft()}
          saving={saving}
          isDirty={isDirty}
          saveLabel={t("ui.saveChanges")}
          resetLabel={t("ui.resetToSaved")}
        />
      </SectionCard>

      <SectionCard title={t("dashboard.settings.draftActions")}>
        <p className="text-sm text-slate-400">{t("dashboard.settings.draftActionsDesc")}</p>
        <button
          type="button"
          disabled={!publishedConfig || saving}
          onClick={() => setConfirmDiscard(true)}
          className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
        >
          {t("dashboard.settings.discardDraftBtn")}
        </button>
      </SectionCard>

      <SectionCard title={t("dashboard.settings.integrationStatus")}>
        <div className="space-y-3">
          <IntegrationStatusCard
            title={t("dashboard.settings.telegramTitle")}
            description={t("dashboard.settings.telegramDesc")}
            status="not_configured"
          />
          <IntegrationStatusCard
            title={t("dashboard.settings.paymentsTitle")}
            description={t("dashboard.settings.paymentsIntegrationDesc")}
            status="coming_later"
          />
          <IntegrationStatusCard
            title={t("dashboard.settings.analyticsTitle")}
            description={t("dashboard.settings.analyticsDesc")}
            status="not_configured"
          />
          <IntegrationStatusCard
            title={t("dashboard.settings.backendTitle")}
            description={t("dashboard.settings.backendDesc")}
            status="mock_only"
          />
          <IntegrationStatusCard
            title={t("dashboard.settings.reportsTitle")}
            description={t("dashboard.settings.reportsDesc")}
            status="mock_only"
          />
        </div>
      </SectionCard>

      <ConfirmDialog
        open={confirmDiscard}
        title={t("dashboard.settings.confirmDiscardTitle")}
        description={t("dashboard.settings.confirmDiscardDesc")}
        confirmLabel={t("dashboard.settings.confirmDiscard")}
        variant="danger"
        loading={saving}
        onConfirm={() => {
          void discardServerDraft().then(() => setConfirmDiscard(false));
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-mono text-slate-200">{value}</dd>
    </div>
  );
}
