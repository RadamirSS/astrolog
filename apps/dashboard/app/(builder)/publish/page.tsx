"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { publishConfig } from "@astro/api-client";
import { validateMiniAppPublish } from "@astro/tenant-config";
import { Badge, Button, ChecklistItem, ConfirmDialog, SectionCard } from "@astro/ui";
import { useT } from "@astro/i18n";
import { formatAllLinksText } from "../../../lib/creator-self-service";
import {
  getPublishChecklistItems,
  getSetupProgressForConfig,
} from "../../../lib/publish-checklist";
import { getPublishReadiness } from "../../../lib/publish-readiness";
import { translateValidationErrors } from "../../../lib/validation-messages";
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
  const [copiedAll, setCopiedAll] = useState(false);

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

  const q = `?tenantId=${tenantId}`;
  const miniappUrl = process.env.NEXT_PUBLIC_MINIAPP_URL ?? "http://localhost:3000";
  const setup = getSetupProgressForConfig(config);
  const checklist = getPublishChecklistItems(config, setup, configStatus, isDirty, t);
  const requiredIncomplete = checklist.filter((item) => item.required && !item.done);
  const readiness = getPublishReadiness(config, { isDirty });
  const blockerMessages = translateValidationErrors(readiness.blockers, t);
  const isPublishedNow =
    publishedVersion != null || config.miniApp?.publicStatus === "published" || Boolean(publishedAt);

  const publishDisabled =
    publishing || saving || !readiness.canPublish || requiredIncomplete.length > 0;
  const publishBlockReason =
    requiredIncomplete.length > 0
      ? t("dashboard.publish.completeRequired")
      : blockerMessages[0] ??
        (isDirty ? t("dashboard.publish.readinessAttentionDesc") : undefined);

  async function handlePublish() {
    const validation = validateMiniAppPublish(config!);
    if (!validation.valid) {
      setError(translateValidationErrors(validation.errors, t).join(". "));
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

  async function copyAllLinks() {
    const text = formatAllLinksText(readiness.links, (key) => t(key));
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
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
  const readinessVariant =
    readiness.tier === "ready" ? "success" : readiness.tier === "attention" ? "warning" : "error";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.publish.title")}</h1>
        <p className="text-slate-400">{t("dashboard.publish.subtitle")}</p>
      </div>

      <div
        className={`rounded-xl border px-4 py-3 ${
          readinessVariant === "success"
            ? "border-emerald-800 bg-emerald-950/40"
            : readinessVariant === "warning"
              ? "border-amber-800 bg-amber-950/30"
              : "border-red-800 bg-red-950/30"
        }`}
      >
        <p className="text-sm font-medium text-white">{t(readiness.headlineKey)}</p>
        <p className="mt-1 text-sm text-slate-300">{t(readiness.descriptionKey)}</p>
      </div>

      {(publishedVersion && publishedAt) || isPublishedNow ? (
        <SectionCard title={t("dashboard.publish.publishedSuccessTitle")}>
          <p className="text-sm text-emerald-300">
            {publishedVersion && publishedAt
              ? t("dashboard.publish.success", {
                  version: publishedVersion,
                  datetime: new Date(publishedAt).toLocaleString(),
                })
              : t("dashboard.controlCenter.statusPublished")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void copyAllLinks()}>
              {copiedAll ? t("dashboard.controlCenter.copied") : t("dashboard.controlCenter.copyAllLinks")}
            </Button>
            {readiness.links.find((l) => l.id === "website") && (
              <a
                href={readiness.links.find((l) => l.id === "website")!.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-slate-700 px-4 py-2 text-sm text-violet-300 hover:bg-slate-800"
              >
                {t("dashboard.publish.openWebsite")}
              </a>
            )}
            {readiness.links.find((l) => l.id === "mobile") && (
              <a
                href={readiness.links.find((l) => l.id === "mobile")!.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-slate-700 px-4 py-2 text-sm text-violet-300 hover:bg-slate-800"
              >
                {t("dashboard.publish.openMobile")}
              </a>
            )}
            {readiness.links.find((l) => l.id === "telegram") && (
              <a
                href={readiness.links.find((l) => l.id === "telegram")!.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-slate-700 px-4 py-2 text-sm text-violet-300 hover:bg-slate-800"
              >
                {t("dashboard.publish.openTelegram")}
              </a>
            )}
          </div>
        </SectionCard>
      ) : null}

      {blockerMessages.length > 0 && (
        <SectionCard title={t("dashboard.publish.blockingIssues")}>
          <ul className="list-disc space-y-2 pl-5 text-sm text-amber-200">
            {blockerMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard title={t("dashboard.publish.surfacesTitle")}>
        <ul className="space-y-3">
          {readiness.surfaces
            .filter((surface) => surface.enabled)
            .map((surface) => (
              <li
                key={surface.id}
                className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-200">{t(surface.labelKey)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="info">{t("dashboard.publish.surfaceEnabled")}</Badge>
                      <Badge variant={surface.ready ? "success" : "warning"}>
                        {surface.ready
                          ? t("dashboard.publish.surfaceReady")
                          : t("dashboard.publish.surfaceNotReady")}
                      </Badge>
                    </div>
                    {surface.url && (
                      <p className="mt-2 truncate text-xs text-slate-500">{surface.url}</p>
                    )}
                  </div>
                  {surface.url && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs"
                        onClick={() => void navigator.clipboard.writeText(surface.url)}
                      >
                        {t("dashboard.controlCenter.copy")}
                      </Button>
                      <a
                        href={surface.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-lg border border-slate-700 px-3 py-2 text-xs text-violet-300 hover:bg-slate-800"
                      >
                        {t("dashboard.controlCenter.open")}
                      </a>
                    </div>
                  )}
                </div>
              </li>
            ))}
        </ul>
      </SectionCard>

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
          {checklist.map((item) =>
            item.href ? (
              <li key={item.id}>
                <Link href={`/${item.href}${q}`} className="block rounded-lg hover:bg-slate-900/50">
                  <ChecklistItem done={item.done} label={item.label} />
                </Link>
              </li>
            ) : (
              <ChecklistItem key={item.id} done={item.done} label={item.label} />
            )
          )}
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
        {publishDisabled && publishBlockReason && (
          <p className="mb-4 text-sm text-amber-300">
            {t("dashboard.publish.publishBlockedReason", { reason: publishBlockReason })}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={publishDisabled}
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
