"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listBalances,
  listPayments,
  listPremiumRequestsForTenant,
} from "@astro/api-client";
import type { TenantConfig } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { Badge, Button, SectionCard, StatCard } from "@astro/ui";
import { LaunchStatusChip } from "./LaunchStatusChip";
import { SelfServiceChecklistCard } from "./SelfServiceChecklistCard";
import { useAccountRole } from "../hooks/useAccountRole";
import { useOpsQuery } from "../hooks/useOpsData";
import {
  buildPublicLinks,
  formatAllLinksText,
  mainStatusHeadlineKey,
  previewVerifiedStorageKey,
  resolveCreatorMainStatus,
  resolveNextBestAction,
} from "../lib/creator-self-service";
import { formatMoneyLocale, useOpsLocale } from "./ops/OpsShared";

interface CreatorControlCenterProps {
  config: TenantConfig;
  tenantId: string;
  isDirty?: boolean;
}

export function CreatorControlCenter({ config, tenantId, isDirty }: CreatorControlCenterProps) {
  const t = useT();
  const locale = useOpsLocale();
  const q = `?tenantId=${tenantId}`;
  const { isPlatformAdmin: admin, hasPartnerScope, account } = useAccountRole();
  const showFinance = admin || hasPartnerScope;
  const partnerId = account?.partnerId ?? undefined;

  const isPublished = config.miniApp?.publicStatus === "published";
  const mainStatus = resolveCreatorMainStatus(config);
  const baseUrl = process.env.NEXT_PUBLIC_MINIAPP_URL ?? "http://localhost:3000";
  const publicLinks = buildPublicLinks(config, baseUrl);
  const primaryWebsiteUrl = publicLinks.find((l) => l.id === "website")?.url ?? publicLinks[0]?.url;

  const [previewVerified, setPreviewVerified] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPreviewVerified(window.localStorage.getItem(previewVerifiedStorageKey(tenantId)) === "1");
  }, [tenantId]);

  const nextAction = useMemo(
    () => resolveNextBestAction(config, { isDirty, previewVerified }),
    [config, isDirty, previewVerified]
  );

  const { data: payments } = useOpsQuery(
    () =>
      showFinance
        ? listPayments(tenantId, partnerId ? { partnerId } : undefined)
        : Promise.resolve([]),
    [tenantId, partnerId, showFinance]
  );
  const { data: balances } = useOpsQuery(
    () => (showFinance ? listBalances(tenantId, partnerId) : Promise.resolve([])),
    [tenantId, partnerId, showFinance]
  );
  const { data: premiumRequests } = useOpsQuery(
    () => listPremiumRequestsForTenant(tenantId),
    [tenantId]
  );

  const salesStats = useMemo(() => {
    if (!payments) return null;
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = payments.filter((p) => new Date(p.createdAt).getTime() >= cutoff);
    const paid = recent.filter((p) => p.status === "paid");
    const total = paid.reduce((s, p) => s + p.amount, 0);
    const avg = paid.length ? total / paid.length : 0;
    return { total, count: recent.length, paidCount: paid.length, avg };
  }, [payments]);

  const balanceRow = useMemo(() => {
    if (!balances?.length) return null;
    if (partnerId) return balances.find((b) => b.partnerId === partnerId) ?? balances[0];
    return balances[0];
  }, [balances, partnerId]);

  const requestCounts = useMemo(() => {
    const rows = premiumRequests ?? [];
    return {
      new: rows.filter((r) => r.status === "submitted" || r.status === "draft").length,
      inProgress: rows.filter((r) =>
        ["payment_pending", "paid", "in_review", "scheduled"].includes(r.status)
      ).length,
      done: rows.filter((r) => r.status === "completed" || r.status === "cancelled").length,
    };
  }, [premiumRequests]);

  async function copyText(text: string, id: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  }

  function linkStatusLabel(status: "draft" | "published" | "needs_bot"): string {
    if (status === "published") return t("dashboard.controlCenter.linkStatusPublished");
    if (status === "needs_bot") return t("dashboard.controlCenter.linkStatusNeedsBot");
    return t("dashboard.controlCenter.linkStatusDraft");
  }

  function linkStatusVariant(status: "draft" | "published" | "needs_bot"): "success" | "warning" | "neutral" {
    if (status === "published") return "success";
    if (status === "needs_bot") return "warning";
    return "neutral";
  }

  const nextActionHref = `/${nextAction.href}${nextAction.href.includes("#") ? "" : q}`;

  return (
    <div className="space-y-8">
      <SectionCard title={t("dashboard.controlCenter.startHere")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-3">
            <p className="text-lg font-medium text-white">{t(mainStatusHeadlineKey(mainStatus))}</p>
            <div className="flex flex-wrap items-center gap-3">
              <LaunchStatusChip config={config} />
              {isDirty && <Badge variant="warning">{t("dashboard.layout.unsavedChanges")}</Badge>}
              {config.publishedAt && (
                <span className="text-sm text-slate-500">
                  {t("dashboard.launch.lastUpdated", {
                    datetime: new Date(config.publishedAt).toLocaleString(
                      locale === "ru" ? "ru-RU" : "en-US"
                    ),
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="min-w-[240px] rounded-xl border border-violet-500/20 bg-violet-950/20 p-4">
            <p className="text-xs uppercase tracking-wide text-violet-300/80">
              {t("dashboard.controlCenter.nextAction")}
            </p>
            <p className="mt-2 text-sm font-medium text-white">{t(nextAction.labelKey)}</p>
            {nextAction.reasonKey && (
              <p className="mt-1 text-xs text-slate-400">{t(nextAction.reasonKey)}</p>
            )}
            <Link
              href={nextActionHref}
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              {t(nextAction.labelKey)}
            </Link>
          </div>
        </div>
      </SectionCard>

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-violet-950/30 via-slate-900 to-slate-950 p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              {t("dashboard.controlCenter.heroTitle")}
            </h1>
            <p className="mt-2 text-slate-400">{t("dashboard.controlCenter.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isPublished && primaryWebsiteUrl ? (
              <>
                <Button type="button" onClick={() => void copyText(primaryWebsiteUrl, "primary")}>
                  {copiedId === "primary"
                    ? t("dashboard.controlCenter.copied")
                    : t("dashboard.controlCenter.copyLink")}
                </Button>
                <a
                  href={primaryWebsiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  {t("dashboard.controlCenter.openWebsite")}
                </a>
              </>
            ) : (
              <Link
                href={nextActionHref}
                className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
              >
                {t(nextAction.labelKey)}
              </Link>
            )}
            <Link
              href={`/preview${q}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              {t("dashboard.controlCenter.openPreview")}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SelfServiceChecklistCard config={config} previewVerified={previewVerified} />

        <div id="public-links">
          <SectionCard title={t("dashboard.controlCenter.publicLinks")}>
            {publicLinks.length === 0 ? (
              <p className="text-sm text-slate-400">{t("dashboard.launch.startNoSurfaces")}</p>
            ) : (
              <>
                <ul className="space-y-3">
                  {publicLinks.map((link) => (
                    <li
                      key={link.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-200">{t(link.labelKey)}</p>
                            <Badge variant={linkStatusVariant(link.status)}>
                              {linkStatusLabel(link.status)}
                            </Badge>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500">{link.url}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="text-xs"
                            onClick={() => void copyText(link.url, link.id)}
                          >
                            {copiedId === link.id
                              ? t("dashboard.controlCenter.copied")
                              : t("dashboard.controlCenter.copy")}
                          </Button>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-xs text-violet-300 hover:bg-slate-800"
                          >
                            {t("dashboard.controlCenter.open")}
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!isPublished || publicLinks.length === 0}
                    onClick={() =>
                      void copyText(
                        formatAllLinksText(publicLinks, (key) => t(key)),
                        "all-links"
                      )
                    }
                  >
                    {copiedId === "all-links"
                      ? t("dashboard.controlCenter.copied")
                      : isPublished
                        ? t("dashboard.controlCenter.copyAllLinks")
                        : t("dashboard.controlCenter.copyAllLinksDisabled")}
                  </Button>
                </div>
              </>
            )}
          </SectionCard>
        </div>
      </div>

      {showFinance ? (
        <>
          <SectionCard title={t("dashboard.controlCenter.financeExplainerTitle")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-slate-300">
                <span className="font-medium text-slate-100">
                  {t("dashboard.finance.explainPending")}
                </span>
                {" — "}
                {t("dashboard.controlCenter.financeExplainPending")}
              </p>
              <p className="text-sm text-slate-300">
                <span className="font-medium text-slate-100">
                  {t("dashboard.finance.explainAvailable")}
                </span>
                {" — "}
                {t("dashboard.controlCenter.financeExplainAvailable")}
              </p>
              <p className="text-sm text-slate-300">
                <span className="font-medium text-slate-100">
                  {t("dashboard.finance.explainHold")}
                </span>
                {" — "}
                {t("dashboard.controlCenter.financeExplainHold")}
              </p>
              <p className="text-sm text-slate-300">
                <span className="font-medium text-slate-100">
                  {t("dashboard.finance.explainPaidOut")}
                </span>
                {" — "}
                {t("dashboard.controlCenter.financeExplainPaidOut")}
              </p>
            </div>
            <p className="mt-4 text-sm text-sky-100/90">{t("dashboard.controlCenter.financeExplainerPilot")}</p>
          </SectionCard>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <SectionCard title={t("dashboard.controlCenter.salesSummary")}>
              {salesStats && salesStats.paidCount > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatCard
                    label={t("dashboard.controlCenter.salesTotal")}
                    value={formatMoneyLocale(salesStats.total, "USD", locale)}
                  />
                  <StatCard label={t("dashboard.controlCenter.ordersCount")} value={salesStats.count} />
                  <StatCard label={t("dashboard.controlCenter.paidOrders")} value={salesStats.paidCount} />
                  <StatCard
                    label={t("dashboard.finance.avgCheck")}
                    value={formatMoneyLocale(salesStats.avg, "USD", locale)}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-400">{t("dashboard.finance.emptySales")}</p>
              )}
              <Link
                href={`/payments${q}`}
                className="mt-4 inline-block text-sm text-violet-400 hover:underline"
              >
                {t("dashboard.controlCenter.actionSales")} →
              </Link>
            </SectionCard>

            <SectionCard title={t("dashboard.controlCenter.balanceSummary")}>
              {balanceRow ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatCard
                    label={t("dashboard.controlCenter.pendingBalance")}
                    value={formatMoneyLocale(balanceRow.pendingBalance, balanceRow.currency, locale)}
                  />
                  <StatCard
                    label={t("dashboard.controlCenter.availableBalance")}
                    value={formatMoneyLocale(balanceRow.availableBalance, balanceRow.currency, locale)}
                  />
                  <StatCard
                    label={t("dashboard.controlCenter.onHoldBalance")}
                    value={formatMoneyLocale(balanceRow.onHoldBalance, balanceRow.currency, locale)}
                  />
                  <StatCard
                    label={t("dashboard.controlCenter.paidOutBalance")}
                    value={formatMoneyLocale(balanceRow.paidOutTotal, balanceRow.currency, locale)}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-400">{t("dashboard.finance.noData")}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <Link href={`/balances${q}`} className="text-violet-400 hover:underline">
                  {t("dashboard.controlCenter.openBalance")} →
                </Link>
                <Link href={`/payouts${q}`} className="text-violet-400 hover:underline">
                  {t("dashboard.controlCenter.payoutHistory")} →
                </Link>
              </div>
            </SectionCard>

            <SectionCard title={t("dashboard.layout.premiumRequests")}>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label={t("dashboard.controlCenter.requestsNew")} value={requestCounts.new} />
                <StatCard
                  label={t("dashboard.controlCenter.requestsInProgress")}
                  value={requestCounts.inProgress}
                />
                <StatCard label={t("dashboard.controlCenter.requestsDone")} value={requestCounts.done} />
              </div>
              <Link
                href={`/premium-requests${q}`}
                className="mt-4 inline-block text-sm text-violet-400 hover:underline"
              >
                {t("dashboard.layout.premiumRequests")} →
              </Link>
            </SectionCard>
          </div>
        </>
      ) : (
        <SectionCard title={t("dashboard.controlCenter.salesSummary")}>
          <p className="text-sm text-slate-400">{t("dashboard.controlCenter.noFinanceAccess")}</p>
        </SectionCard>
      )}
    </div>
  );
}
