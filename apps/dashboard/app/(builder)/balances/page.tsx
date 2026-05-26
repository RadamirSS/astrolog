"use client";

import Link from "next/link";
import { listBalances, listCommissions, listPayouts } from "@astro/api-client";
import { Button, LoadingState, SectionCard, StatCard } from "@astro/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useT } from "@astro/i18n";
import {
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatDateLocale,
  formatMoneyLocale,
  useOpsLocale,
} from "../../../components/ops/OpsShared";
import { useAccountRole } from "../../../hooks/useAccountRole";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function BalancesPage() {
  const t = useT();
  const router = useRouter();
  const locale = useOpsLocale();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const q = `?tenantId=${tenantId}`;
  const { isPlatformAdmin: admin, account } = useAccountRole();
  const partnerId = account?.partnerId ?? undefined;

  const { data, loading, error } = useOpsQuery(
    () => listBalances(tenantId, admin ? undefined : partnerId),
    [tenantId, partnerId, admin]
  );

  const { data: recentCommissions } = useOpsQuery(
    () => (admin ? Promise.resolve([]) : listCommissions(tenantId, partnerId)),
    [tenantId, partnerId, admin]
  );

  const { data: recentPayouts } = useOpsQuery(
    () => (admin ? Promise.resolve([]) : listPayouts(tenantId, partnerId)),
    [tenantId, partnerId, admin]
  );

  const rows = useMemo(() => {
    const all = data ?? [];
    if (admin) return all;
    if (partnerId) return all.filter((b) => b.partnerId === partnerId);
    return all;
  }, [data, admin, partnerId]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, b) => ({
        pending: acc.pending + b.pendingBalance,
        available: acc.available + b.availableBalance,
        onHold: acc.onHold + b.onHoldBalance,
        paidOut: acc.paidOut + b.paidOutTotal,
        adjusted: acc.adjusted + (b.adjustedTotal ?? 0),
      }),
      { pending: 0, available: 0, onHold: 0, paidOut: 0, adjusted: 0 }
    );
  }, [rows]);

  const latestCommissions = useMemo(
    () => (recentCommissions ?? []).slice(0, 5),
    [recentCommissions]
  );
  const latestPayouts = useMemo(() => (recentPayouts ?? []).slice(0, 5), [recentPayouts]);

  if (loading) return <LoadingState message={t("dashboard.finance.loading")} className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  const currency = rows[0]?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <OpsPageHeader title={t("dashboard.finance.balanceTitle")} subtitle={t("dashboard.finance.balanceSubtitle")} />

      {!admin && (
        <div className="rounded-xl border border-sky-500/20 bg-sky-950/30 px-4 py-3 text-sm text-sky-100">
          {t("dashboard.finance.balancePilotNote")}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={t("dashboard.finance.explainPending")}
          value={formatMoneyLocale(totals.pending, currency, locale)}
        />
        <StatCard
          label={t("dashboard.finance.explainAvailable")}
          value={formatMoneyLocale(totals.available, currency, locale)}
        />
        <StatCard
          label={t("dashboard.finance.explainHold")}
          value={formatMoneyLocale(totals.onHold, currency, locale)}
        />
        <StatCard
          label={t("dashboard.finance.explainPaidOut")}
          value={formatMoneyLocale(totals.paidOut, currency, locale)}
        />
        <StatCard
          label={t("dashboard.finance.explainAdjusted")}
          value={formatMoneyLocale(totals.adjusted, currency, locale)}
        />
      </div>

      <SectionCard title={t("dashboard.finance.balanceStatusHelpTitle")}>
        <div className="grid gap-3 text-sm text-slate-400 md:grid-cols-2">
          <p>
            <span className="font-medium text-slate-200">{t("dashboard.finance.explainPending")}:</span>{" "}
            {t("dashboard.controlCenter.financeExplainPending")}
          </p>
          <p>
            <span className="font-medium text-slate-200">{t("dashboard.finance.explainAvailable")}:</span>{" "}
            {t("dashboard.controlCenter.financeExplainAvailable")}
          </p>
          <p>
            <span className="font-medium text-slate-200">{t("dashboard.finance.explainHold")}:</span>{" "}
            {t("dashboard.controlCenter.financeExplainHold")}
          </p>
          <p>
            <span className="font-medium text-slate-200">{t("dashboard.finance.explainPaidOut")}:</span>{" "}
            {t("dashboard.controlCenter.financeExplainPaidOut")}
          </p>
          <p>
            <span className="font-medium text-slate-200">{t("dashboard.finance.explainAdjusted")}:</span>{" "}
            {t("dashboard.finance.explainAdjustedDetail")}
          </p>
        </div>
      </SectionCard>

      {!admin && (
        <>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" onClick={() => router.push(`/payouts${q}`)}>
              {t("dashboard.finance.payoutHistoryCta")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.href = `mailto:${t("dashboard.finance.contactSupportEmail")}`;
              }}
            >
              {t("dashboard.finance.contactSupport")}
            </Button>
          </div>

          {latestCommissions.length > 0 && (
            <SectionCard title={t("dashboard.finance.accrualsTitle")}>
              <OpsTable
                columns={[
                  { key: "date", label: t("dashboard.finance.date") },
                  { key: "product", label: t("dashboard.finance.product") },
                  { key: "amount", label: t("dashboard.finance.yourCommission") },
                  { key: "status", label: t("dashboard.finance.statusColumn") },
                ]}
                rows={latestCommissions.map((c) => ({
                  date: formatDateLocale(c.createdAt, locale),
                  product: c.productTitle ?? c.productType,
                  amount: formatMoneyLocale(c.commissionAmount, "USD", locale),
                  status: <OpsStatusBadge status={c.status} category="commission" />,
                }))}
              />
            </SectionCard>
          )}

          {latestPayouts.length > 0 && (
            <SectionCard title={t("dashboard.finance.payoutsTitle")}>
              <OpsTable
                columns={[
                  { key: "date", label: t("dashboard.finance.date") },
                  { key: "amount", label: t("dashboard.finance.amount") },
                  { key: "status", label: t("dashboard.finance.statusColumn") },
                ]}
                rows={latestPayouts.map((p) => ({
                  date: formatDateLocale(p.createdAt, locale),
                  amount: formatMoneyLocale(p.amount, p.currency, locale),
                  status: <OpsStatusBadge status={p.status} category="payout" />,
                }))}
              />
            </SectionCard>
          )}
        </>
      )}

      {admin && (
        <SectionCard title={t("dashboard.finance.balanceTitle")}>
          <OpsTable
            columns={[
              { key: "partner", label: t("dashboard.finance.partner") },
              { key: "pending", label: t("dashboard.finance.explainPending") },
              { key: "available", label: t("dashboard.finance.explainAvailable") },
              { key: "onHold", label: t("dashboard.finance.explainHold") },
              { key: "paidOut", label: t("dashboard.finance.explainPaidOut") },
              { key: "action", label: "" },
            ]}
            rows={rows.map((b) => ({
              partner: b.partnerName ?? b.partnerId,
              pending: formatMoneyLocale(b.pendingBalance, b.currency, locale),
              available: formatMoneyLocale(b.availableBalance, b.currency, locale),
              onHold: formatMoneyLocale(b.onHoldBalance, b.currency, locale),
              paidOut: formatMoneyLocale(b.paidOutTotal, b.currency, locale),
              action: (
                <Link href={`/partners/${b.partnerId}${q}`} className="text-violet-400 hover:underline">
                  →
                </Link>
              ),
            }))}
          />
        </SectionCard>
      )}
    </div>
  );
}
