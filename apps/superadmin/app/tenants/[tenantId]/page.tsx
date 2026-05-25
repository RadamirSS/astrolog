"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getConfigStatus,
  getTenantBundle,
  getTenantDetail,
  getTenantHealth,
  listAuditLogs,
  setTenantStatus,
  type AuditLogItem,
  type TenantHealth,
} from "@astro/api-client";
import { useT } from "@astro/i18n";
import type { TenantConfigBundle, TenantConfigStatus, TenantRecord } from "@astro/tenant-config";
import { Badge, IntegrationStatusCard, LoadingState, SectionCard, StatCard, StatusBadge } from "@astro/ui";
import { SuperadminShell } from "../../components/SuperadminShell";
import { useSuperadminAnalytics } from "../../../lib/useSuperadminAnalytics";
import {
  countActiveProducts,
  countEnabledModules,
} from "../../../lib/tenant-summary";

const AREA_LABEL_KEYS: Record<string, string> = {
  brand: "superadmin.tenantDetail.areaBrand",
  design: "superadmin.tenantDetail.areaDesign",
  content: "superadmin.tenantDetail.areaContent",
  products: "superadmin.tenantDetail.areaProducts",
  modules: "superadmin.tenantDetail.areaModules",
};

export default function TenantDetailPage() {
  const t = useT();
  const track = useSuperadminAnalytics();
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [bundle, setBundle] = useState<TenantConfigBundle | null>(null);
  const [status, setStatus] = useState<TenantConfigStatus | null>(null);
  const [health, setHealth] = useState<TenantHealth | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const miniappUrl = process.env.NEXT_PUBLIC_MINIAPP_URL ?? "http://localhost:3000";
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const record = await getTenantDetail(tenantId);
        setTenant(record);
        const [bundleData, statusData, healthData, auditData] = await Promise.all([
          getTenantBundle(tenantId),
          getConfigStatus(tenantId),
          getTenantHealth(tenantId),
          listAuditLogs({ tenantId, limit: 5 }),
        ]);
        setBundle(bundleData);
        setStatus(statusData);
        setHealth(healthData);
        setAuditLogs(auditData);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("superadmin.tenantDetail.loadFailed"));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [tenantId]);

  async function handleStatusChange(next: "active" | "paused" | "draft") {
    await setTenantStatus(tenantId, next);
    track("superadmin_tenant_status_changed", { tenantId, status: next });
    const record = await getTenantDetail(tenantId);
    setTenant(record);
    setHealth(await getTenantHealth(tenantId));
  }

  function moduleLabel(enabled: boolean) {
    return enabled ? t("superadmin.tenantDetail.on") : t("superadmin.tenantDetail.off");
  }

  if (loading) {
    return (
      <SuperadminShell>
        <LoadingState message={t("superadmin.tenantDetail.loading")} className="text-slate-400" />
      </SuperadminShell>
    );
  }

  if (error) {
    return (
      <SuperadminShell>
        <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      </SuperadminShell>
    );
  }

  if (!tenant || !bundle || !health) {
    return (
      <SuperadminShell>
        <p className="text-slate-400">{t("superadmin.tenantDetail.notFound")}</p>
        <Link href="/tenants" className="mt-4 inline-block text-violet-400 hover:underline">
          {t("superadmin.tenantDetail.backToTenants")}
        </Link>
      </SuperadminShell>
    );
  }

  return (
    <SuperadminShell>
      <div className="mb-6">
        <Link href="/tenants" className="text-sm text-violet-400 hover:underline">
          {t("superadmin.tenantDetail.allTenants")}
        </Link>
        <h2 className="mt-2 text-2xl font-semibold">{tenant.displayName}</h2>
        <p className="font-mono text-sm text-slate-400">{tenant.slug}</p>
        <div className="mt-2">
          <StatusBadge status={tenant.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={t("superadmin.tenantDetail.pilotHealth")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label={t("superadmin.tenantDetail.recentEvents")}
              value={health.recentAnalyticsCount}
            />
            <StatCard
              label={t("superadmin.tenantDetail.reportFailures")}
              value={health.recentReportFailures}
            />
            <StatCard
              label={t("superadmin.tenantDetail.mediaAssets")}
              value={Object.values(health.mediaAssetCounts).reduce(
                (sum, count) => sum + count,
                0
              )}
            />
            <StatCard
              label={t("superadmin.tenantDetail.activeProducts")}
              value={health.activeProductCount}
            />
          </div>
          {health.warnings.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-amber-300">{t("superadmin.tenantDetail.warnings")}</p>
              <ul className="space-y-1 text-sm text-amber-200/90">
                {health.warnings.map((warning: string) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>

        <SectionCard title={t("superadmin.tenantDetail.summary")}>
          <dl className="grid gap-3 text-sm">
            <Row label={t("superadmin.tenantDetail.tenantId")} value={tenant.id} />
            <Row label={t("superadmin.tenantDetail.ownerEmail")} value={tenant.ownerEmail} />
            <Row
              label={t("superadmin.tenantDetail.created")}
              value={new Date(tenant.createdAt).toLocaleString()}
            />
            <Row
              label={t("superadmin.tenantDetail.updated")}
              value={new Date(tenant.updatedAt).toLocaleString()}
            />
            <Row
              label={t("superadmin.tenantDetail.themePreset")}
              value={bundle.draft.theme.preset}
            />
            <Row
              label={t("superadmin.tenantDetail.activeProducts")}
              value={String(countActiveProducts(bundle.draft))}
            />
            <Row
              label={t("superadmin.tenantDetail.enabledModules")}
              value={String(countEnabledModules(bundle.draft))}
            />
            <Row
              label={t("superadmin.tenantDetail.draftVersion")}
              value={`v${bundle.draft.version}`}
            />
            <Row
              label={t("superadmin.tenantDetail.publishedVersion")}
              value={
                bundle.published
                  ? `v${bundle.published.version}`
                  : t("superadmin.tenantDetail.notPublished")
              }
            />
            <Row
              label={t("superadmin.tenantDetail.lastPublished")}
              value={
                status?.lastPublishedAt
                  ? new Date(status.lastPublishedAt).toLocaleString()
                  : t("superadmin.tenantDetail.never")
              }
            />
            {status?.hasUnpublishedChanges && (
              <div>
                <dt className="text-slate-400">{t("superadmin.tenantDetail.unpublishedChanges")}</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {status.changedAreas.map((area) => (
                    <Badge key={area} variant="warning">
                      {AREA_LABEL_KEYS[area] ? t(AREA_LABEL_KEYS[area]) : area}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </SectionCard>

        <SectionCard title={t("superadmin.tenantDetail.statusActions")}>
          <label className="mb-4 block text-sm text-slate-400">
            {t("superadmin.tenantDetail.tenantStatus")}
            <select
              value={tenant.status}
              onChange={(e) =>
                void handleStatusChange(e.target.value as "active" | "paused" | "draft")
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            >
              <option value="draft">{t("superadmin.tenants.statusDraft")}</option>
              <option value="active">{t("superadmin.tenants.statusLive")}</option>
              <option value="paused">{t("superadmin.tenants.statusPaused")}</option>
            </select>
          </label>
          <div className="flex flex-col gap-2 text-sm">
            <a
              href={`${dashboardUrl}/overview?tenantId=${tenant.id}`}
              className="rounded-lg border border-slate-700 px-4 py-2 text-violet-300 hover:bg-slate-800"
            >
              {t("superadmin.tenantDetail.openDashboard")}
            </a>
            <a
              href={`${dashboardUrl}/publish?tenantId=${tenant.id}`}
              className="rounded-lg border border-slate-700 px-4 py-2 text-violet-300 hover:bg-slate-800"
            >
              {t("superadmin.tenantDetail.openPublish")}
            </a>
            <a
              href={`${miniappUrl}/${tenant.slug}?preview=draft`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-700 px-4 py-2 text-violet-300 hover:bg-slate-800"
              onClick={() =>
                track("superadmin_tenant_preview_opened", {
                  tenantId: tenant.id,
                  tenantSlug: tenant.slug,
                  mode: "draft",
                })
              }
            >
              {t("superadmin.tenantDetail.previewDraft")}
            </a>
            {bundle.published && (
              <a
                href={`${miniappUrl}/${tenant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-700 px-4 py-2 text-violet-300 hover:bg-slate-800"
                onClick={() =>
                  track("superadmin_tenant_preview_opened", {
                    tenantId: tenant.id,
                    tenantSlug: tenant.slug,
                    mode: "live",
                  })
                }
              >
                {t("superadmin.tenantDetail.previewPublished")}
              </a>
            )}
          </div>
        </SectionCard>

        <SectionCard title={t("superadmin.tenantDetail.appFeatures")}>
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <Row
              label={t("superadmin.tenantDetail.onboarding")}
              value={moduleLabel(bundle.draft.modules.onboarding)}
            />
            <Row
              label={t("superadmin.tenantDetail.freeReading")}
              value={moduleLabel(bundle.draft.modules.freeReport)}
            />
            <Row
              label={t("superadmin.tenantDetail.offeringsShop")}
              value={moduleLabel(bundle.draft.modules.products)}
            />
            <Row
              label={t("superadmin.tenantDetail.userProfile")}
              value={moduleLabel(bundle.draft.modules.profile)}
            />
          </dl>
        </SectionCard>

        <SectionCard title={t("superadmin.tenantDetail.integrations")}>
          <p className="mb-3 text-xs text-slate-500">{t("superadmin.tenantDetail.integrationsNote")}</p>
          <div className="space-y-3">
            <IntegrationStatusCard
              title={t("superadmin.tenantDetail.telegram")}
              status={health.integrationStatuses.telegram}
            />
            <IntegrationStatusCard
              title={t("superadmin.tenantDetail.payments")}
              status={health.integrationStatuses.payments}
            />
            <IntegrationStatusCard
              title={t("superadmin.tenantDetail.analytics")}
              status={health.integrationStatuses.analytics}
            />
            <IntegrationStatusCard
              title={t("superadmin.tenantDetail.backend")}
              status={health.integrationStatuses.backendApi}
            />
            <IntegrationStatusCard
              title={t("superadmin.tenantDetail.reports")}
              status={health.integrationStatuses.reportGeneration}
            />
          </div>
        </SectionCard>

        <SectionCard title={t("superadmin.tenantDetail.recentAudit")}>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-slate-500">{t("superadmin.tenantDetail.noAuditLogs")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {auditLogs.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                  <p className="font-medium text-slate-200">{entry.action}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </SuperadminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
