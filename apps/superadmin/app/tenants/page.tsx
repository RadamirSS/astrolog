"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  createTenant,
  listTenants,
  setTenantStatus,
  type TenantListItem,
} from "@astro/api-client";
import { useT } from "@astro/i18n";
import type { ThemePreset } from "@astro/tenant-config";
import { THEME_PRESET_OPTIONS } from "@astro/theme-engine";
import { Input, LoadingState, SectionCard, StatusBadge } from "@astro/ui";
import { SuperadminShell } from "../components/SuperadminShell";
import { useSuperadminAnalytics } from "../../lib/useSuperadminAnalytics";

export default function TenantsPage() {
  const t = useT();
  const track = useSuperadminAnalytics();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [preset, setPreset] = useState<ThemePreset>("cosmic-violet");

  const miniappUrl = process.env.NEXT_PUBLIC_MINIAPP_URL ?? "http://localhost:3000";
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const records = await listTenants();
      setTenants(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("superadmin.tenants.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createTenant({ slug, displayName, preset });
      track("superadmin_tenant_created", { slug, displayName, preset });
      setSlug("");
      setDisplayName("");
      await refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t("superadmin.tenants.createFailed"));
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(tenantId: string, status: "active" | "paused" | "draft") {
    try {
      await setTenantStatus(tenantId, status);
      track("superadmin_tenant_status_changed", { tenantId, status });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("superadmin.tenants.statusFailed"));
    }
  }

  function trackPreview(tenantId: string, slug: string, mode: "draft" | "live") {
    track("superadmin_tenant_preview_opened", { tenantId, tenantSlug: slug, mode });
  }

  return (
    <SuperadminShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">{t("superadmin.tenants.title")}</h2>
        <p className="text-slate-400">{t("superadmin.tenants.subtitle")}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title={t("superadmin.tenants.allTenants")}>
            {loading ? (
              <LoadingState message={t("superadmin.tenants.loading")} className="text-slate-400" />
            ) : tenants.length === 0 ? (
              <p className="text-slate-400">{t("superadmin.tenants.empty")}</p>
            ) : (
              <div className="space-y-3">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-100">{tenant.displayName}</h3>
                        <p className="font-mono text-xs text-slate-500">{tenant.slug}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                          <span>{tenant.themePreset}</span>
                          <span>·</span>
                          <span>
                            {t("superadmin.tenants.offeringsCount", {
                              count: tenant.activeProductCount,
                            })}
                          </span>
                          <span>·</span>
                          <span>
                            {t("superadmin.tenants.featuresCount", {
                              count: tenant.enabledModuleCount,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={tenant.status} />
                        <select
                          value={tenant.status}
                          onChange={(e) =>
                            void handleStatusChange(
                              tenant.id,
                              e.target.value as "active" | "paused" | "draft"
                            )
                          }
                          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                          aria-label={t("superadmin.tenants.statusChange")}
                        >
                          <option value="draft">{t("superadmin.tenants.statusDraft")}</option>
                          <option value="active">{t("superadmin.tenants.statusLive")}</option>
                          <option value="paused">{t("superadmin.tenants.statusPaused")}</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <Link href={`/tenants/${tenant.id}`} className="text-violet-400 hover:underline">
                        {t("superadmin.tenants.details")}
                      </Link>
                      <a
                        href={`${dashboardUrl}/overview?tenantId=${tenant.id}`}
                        className="text-violet-400 hover:underline"
                      >
                        {t("superadmin.tenants.dashboard")}
                      </a>
                      <a
                        href={`${miniappUrl}/${tenant.slug}?preview=draft`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-violet-400 hover:underline"
                        onClick={() => trackPreview(tenant.id, tenant.slug, "draft")}
                      >
                        {t("superadmin.tenants.previewChanges")}
                      </a>
                      {tenant.hasPublished && (
                        <a
                          href={`${miniappUrl}/${tenant.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-violet-400 hover:underline"
                          onClick={() => trackPreview(tenant.id, tenant.slug, "live")}
                        >
                          {t("superadmin.tenants.previewLive")}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title={t("superadmin.tenants.addDemoTenant")}>
          <p className="mb-4 text-xs text-slate-500">{t("superadmin.tenants.addNote")}</p>
          {createError && (
            <div className="mb-3 rounded border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-300">
              {createError}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleCreate}>
            <Input
              label={t("superadmin.tenants.appSlug")}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
            <Input
              label={t("superadmin.tenants.displayName")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <label className="block text-sm text-slate-400">
              {t("superadmin.tenants.themePreset")}
              <select
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                value={preset}
                onChange={(e) => setPreset(e.target.value as ThemePreset)}
              >
                {THEME_PRESET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              {creating ? t("superadmin.tenants.creating") : t("superadmin.tenants.createTenant")}
            </button>
          </form>
        </SectionCard>
      </div>
    </SuperadminShell>
  );
}
