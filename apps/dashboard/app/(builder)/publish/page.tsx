"use client";

import { useMemo, useState } from "react";
import { publishConfig } from "@astro/api-client";
import { validateMiniAppPublish } from "@astro/tenant-config";
import { Badge, ChecklistItem, ConfirmDialog, SectionCard } from "@astro/ui";
import { useT } from "@astro/i18n";
import {
  getPublishChecklistItems,
  getSetupProgressForConfig,
} from "../../../lib/publish-checklist";
import { useDashboard } from "../../components/DashboardProvider";
import { useDashboardAnalytics } from "../../../lib/useDashboardAnalytics";

type ConfirmAction = "publish" | "discard" | "restore" | null;

export default function PublishPage() {
  const t = useT();
  const {
    config,
    publishedConfig,
    configStatus,
    loading,
    tenantId,
    isDirty,
    hasUnpublishedChanges,
    changedAreas,
    draftUpdatedAt,
    lastPublishedAt,
    saving,
    refresh,
    saveDraft,
    discardServerDraft,
    restoreFromPublished,
  } = useDashboard();
  const track = useDashboardAnalytics(tenantId, config?.slug);

  const [publishing, setPublishing] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const areaLabels = useMemo(
    () => ({
      brand: t("dashboard.publish.areaBrand"),
      design: t("dashboard.publish.areaDesign"),
      content: t("dashboard.publish.areaContent"),
      products: t("dashboard.publish.areaProducts"),
      modules: t("dashboard.publish.areaModules"),
    }),
    [t]
  );

  if (loading || !config) return <p className="text-slate-400">{t("dashboard.publish.loading")}</p>;

  const miniappUrl = process.env.NEXT_PUBLIC_MINIAPP_URL ?? "http://localhost:3000";
  const setup = getSetupProgressForConfig(config);
  const checklist = getPublishChecklistItems(config, setup, configStatus, isDirty, t);
  const requiredIncomplete = checklist.filter((item) => item.required && !item.done);

  async function handlePublish() {
    const validation = validateMiniAppPublish(config!);
    if (!validation.valid) {
      setError(validation.errors.map((e) => e.message).join(". "));
      return;
    }
    if (isDirty) {
      await saveDraft();
    }
    setPublishing(true);
    setError(null);
    try {
      const published = await publishConfig(tenantId);
      setPublishedVersion(published.version);
      setPublishedAt(published.publishedAt ?? new Date().toISOString());
      track("dashboard_config_published", { version: published.version });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.publish.failed"));
    } finally {
      setPublishing(false);
      setConfirmAction(null);
    }
  }

  async function handleConfirm() {
    if (confirmAction === "publish") {
      await handlePublish();
      return;
    }
    if (confirmAction === "discard") {
      await discardServerDraft();
      track("dashboard_draft_discarded");
      setConfirmAction(null);
      return;
    }
    if (confirmAction === "restore") {
      await restoreFromPublished();
      setConfirmAction(null);
    }
  }

  const confirmCopy = {
    publish: {
      title: t("dashboard.publish.confirmPublishTitle"),
      description: t("dashboard.publish.confirmPublishDesc"),
      confirmLabel: t("dashboard.publish.confirmPublish"),
      variant: "primary" as const,
    },
    discard: {
      title: t("dashboard.publish.confirmDiscardTitle"),
      description: t("dashboard.publish.confirmDiscardDesc"),
      confirmLabel: t("dashboard.publish.confirmDiscard"),
      variant: "danger" as const,
    },
    restore: {
      title: t("dashboard.publish.confirmRestoreTitle"),
      description: t("dashboard.publish.confirmRestoreDesc"),
      confirmLabel: t("dashboard.publish.confirmRestore"),
      variant: "danger" as const,
    },
  };

  const activeConfirm = confirmAction ? confirmCopy[confirmAction] : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.publish.title")}</h1>
        <p className="text-slate-400">{t("dashboard.publish.subtitle")}</p>
      </div>

      {publishedVersion && publishedAt && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
          {t("dashboard.publish.success", {
            version: publishedVersion,
            datetime: new Date(publishedAt).toLocaleString(),
          })}
        </div>
      )}

      <SectionCard title={t("dashboard.publish.appStatus")}>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <Row label={t("dashboard.publish.appName")} value={config.brand.displayName} />
          <Row label={t("dashboard.publish.slug")} value={config.slug} />
          <Row label={t("dashboard.publish.draftVersion")} value={`v${config.version}`} />
          <Row
            label={t("dashboard.publish.publishedVersion")}
            value={publishedConfig ? `v${publishedConfig.version}` : t("dashboard.publish.notPublished")}
          />
          <Row
            label={t("dashboard.publish.lastSavedDraft")}
            value={draftUpdatedAt ? new Date(draftUpdatedAt).toLocaleString() : t("dashboard.publish.dash")}
          />
          <Row
            label={t("dashboard.publish.lastPublished")}
            value={lastPublishedAt ? new Date(lastPublishedAt).toLocaleString() : t("dashboard.publish.never")}
          />
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={config.status === "active" ? "success" : "warning"}>{config.status}</Badge>
          {isDirty && <Badge variant="warning">{t("dashboard.publish.unsavedLocal")}</Badge>}
          {hasUnpublishedChanges ? (
            <Badge variant="warning">{t("dashboard.publish.unpublished")}</Badge>
          ) : (
            publishedConfig && <Badge variant="success">{t("dashboard.publish.draftMatches")}</Badge>
          )}
        </div>
      </SectionCard>

      {changedAreas.length > 0 && (
        <SectionCard title={t("dashboard.publish.changedAreas")}>
          <div className="flex flex-wrap gap-2">
            {changedAreas.map((area) => (
              <Badge key={area} variant="info">
                {areaLabels[area as keyof typeof areaLabels] ?? area}
              </Badge>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title={t("dashboard.publish.checklist")}>
        <ul className="space-y-2">
          {checklist.map((item) => (
            <ChecklistItem key={item.id} done={item.done} label={item.label} />
          ))}
        </ul>
        {requiredIncomplete.length > 0 && (
          <p className="mt-3 text-sm text-amber-400">{t("dashboard.publish.completeRequired")}</p>
        )}
      </SectionCard>

      <SectionCard title={t("dashboard.publish.previewBeforePublish")}>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/preview?tenantId=${tenantId}&source=draft`}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-violet-300 hover:bg-slate-800"
          >
            {t("dashboard.publish.previewDraft")}
          </a>
          {publishedConfig && (
            <a
              href={`/preview?tenantId=${tenantId}&source=published`}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-violet-300 hover:bg-slate-800"
            >
              {t("dashboard.publish.previewPublished")}
            </a>
          )}
          <a
            href={`${miniappUrl}/${config.slug}?preview=draft`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-violet-300 hover:bg-slate-800"
          >
            {t("dashboard.publish.openMiniAppDraft")}
          </a>
        </div>
      </SectionCard>

      <SectionCard title={t("dashboard.publish.actions")}>
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={publishing || saving || requiredIncomplete.length > 0}
            onClick={() => {
              track("dashboard_publish_clicked");
              setConfirmAction("publish");
            }}
            className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
          >
            {publishing ? t("dashboard.publish.publishing") : t("dashboard.publish.publishChanges")}
          </button>
          {publishedConfig && hasUnpublishedChanges && (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmAction("discard")}
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                {t("dashboard.publish.discardDraft")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmAction("restore")}
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                {t("dashboard.publish.restoreFromPublished")}
              </button>
            </>
          )}
        </div>
      </SectionCard>

      {activeConfirm && (
        <ConfirmDialog
          open
          title={activeConfirm.title}
          description={activeConfirm.description}
          confirmLabel={activeConfirm.confirmLabel}
          variant={activeConfirm.variant}
          loading={publishing || saving}
          onConfirm={() => void handleConfirm()}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-100">{value}</dd>
    </div>
  );
}
