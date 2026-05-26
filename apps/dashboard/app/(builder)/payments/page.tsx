"use client";

import { listCommissions, listPayments } from "@astro/api-client";
import { LoadingState, SectionCard, StatCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useT } from "@astro/i18n";
import {
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatDateLocale,
  formatMoneyLocale,
  maskBuyerId,
  useOpsLocale,
} from "../../../components/ops/OpsShared";
import { useAccountRole } from "../../../hooks/useAccountRole";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function PaymentsPage() {
  const t = useT();
  const locale = useOpsLocale();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const { isPlatformAdmin: admin, account } = useAccountRole();
  const partnerId = account?.partnerId ?? undefined;

  const { data, loading, error } = useOpsQuery(
    () => listPayments(tenantId, partnerId ? { partnerId } : undefined),
    [tenantId, partnerId]
  );

  const { data: commissions } = useOpsQuery(
    () => (admin ? Promise.resolve([]) : listCommissions(tenantId, partnerId)),
    [tenantId, partnerId, admin]
  );

  const commissionByOrder = useMemo(() => {
    const map = new Map<string, NonNullable<typeof commissions>[number]>();
    for (const c of commissions ?? []) {
      map.set(c.orderId, c);
    }
    return map;
  }, [commissions]);

  const stats = useMemo(() => {
    const rows = data ?? [];
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = rows.filter((p) => new Date(p.createdAt).getTime() >= cutoff);
    const paid = recent.filter((p) => p.status === "paid");
    const paidAll = rows.filter((p) => p.status === "paid");
    const total7d = paid.reduce((s, p) => s + p.amount, 0);
    const totalAll = paidAll.reduce((s, p) => s + p.amount, 0);
    const refunds = recent.filter((p) => p.status === "refunded").length;
    return {
      total7d,
      totalAll,
      paidCount: paid.length,
      avg: paid.length ? total7d / paid.length : 0,
      refunds,
    };
  }, [data]);

  if (loading) return <LoadingState message={t("dashboard.finance.loading")} className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  const creatorColumns = [
    { key: "date", label: t("dashboard.finance.date") },
    { key: "product", label: t("dashboard.finance.product") },
    { key: "buyer", label: t("dashboard.finance.buyer") },
    { key: "amount", label: t("dashboard.finance.amount") },
    { key: "status", label: t("dashboard.finance.paymentStatus") },
    { key: "accrual", label: t("dashboard.finance.yourCommission") },
    { key: "report", label: t("dashboard.finance.reportStatus") },
  ];

  const adminColumns = [
    ...creatorColumns.slice(0, 5),
    { key: "id", label: t("dashboard.finance.paymentId") },
    { key: "provider", label: t("dashboard.finance.provider") },
    { key: "fee", label: t("dashboard.finance.providerFee") },
    { key: "accrual", label: t("dashboard.finance.yourCommission") },
  ];

  const columns = admin ? adminColumns : creatorColumns;

  return (
    <div className="space-y-6">
      <OpsPageHeader
        title={admin ? t("dashboard.finance.adminPaymentsTitle") : t("dashboard.finance.salesTitle")}
        subtitle={admin ? t("dashboard.finance.adminPaymentsSubtitle") : t("dashboard.finance.salesSubtitle")}
      />

      {!admin && (
        <>
          <SectionCard title={t("dashboard.finance.salesExplainerTitle")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-slate-300">
                <span className="font-medium text-slate-100">{t("dashboard.finance.explainPending")}</span>
                {" — "}
                {t("dashboard.controlCenter.financeExplainPending")}
              </p>
              <p className="text-sm text-slate-300">
                <span className="font-medium text-slate-100">{t("dashboard.finance.explainAvailable")}</span>
                {" — "}
                {t("dashboard.controlCenter.financeExplainAvailable")}
              </p>
              <p className="text-sm text-slate-300">
                <span className="font-medium text-slate-100">{t("dashboard.finance.explainHold")}</span>
                {" — "}
                {t("dashboard.controlCenter.financeExplainHold")}
              </p>
              <p className="text-sm text-slate-300">
                <span className="font-medium text-slate-100">{t("dashboard.finance.explainPaidOut")}</span>
                {" — "}
                {t("dashboard.controlCenter.financeExplainPaidOut")}
              </p>
            </div>
          </SectionCard>
          <div className="rounded-xl border border-sky-500/20 bg-sky-950/30 px-4 py-3 text-sm text-sky-100">
            <p className="font-medium">{t("dashboard.finance.howPayoutsWork")}</p>
            <p className="mt-1">{t("dashboard.finance.howPayoutsWorkDesc")}</p>
          </div>
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("dashboard.finance.sales7d")}
          value={formatMoneyLocale(stats.total7d, "USD", locale)}
        />
        <StatCard label={t("dashboard.finance.paidOrders7d")} value={stats.paidCount} />
        <StatCard
          label={t("dashboard.finance.totalSales")}
          value={formatMoneyLocale(stats.totalAll, "USD", locale)}
        />
        <StatCard
          label={t("dashboard.finance.avgCheck")}
          value={formatMoneyLocale(stats.avg, "USD", locale)}
        />
        <StatCard label={t("dashboard.finance.refunds")} value={stats.refunds} />
      </div>

      <SectionCard title={t("dashboard.finance.salesTitle")}>
        {(data ?? []).length === 0 && !admin ? (
          <p className="text-sm text-slate-400">{t("dashboard.finance.emptySales")}</p>
        ) : (
          <OpsTable
            columns={columns}
            rows={(data ?? []).map((p) => {
            const commission = commissionByOrder.get(p.orderId);
            return {
              date: formatDateLocale(p.createdAt, locale),
              product: p.productTitle ?? "—",
              buyer: maskBuyerId(p.userId ?? p.orderId),
              amount: formatMoneyLocale(p.amount, p.currency, locale),
              status: <OpsStatusBadge status={p.status} category="payment" />,
              accrual: commission ? (
                formatMoneyLocale(commission.commissionAmount, "USD", locale)
              ) : (
                "—"
              ),
              report: commission ? (
                <OpsStatusBadge status={commission.status} category="commission" />
              ) : (
                "—"
              ),
              ...(admin
                ? {
                    id: p.id,
                    provider: p.provider,
                    fee:
                      p.providerFee != null
                        ? formatMoneyLocale(p.providerFee, p.currency, locale)
                        : "—",
                  }
                : {}),
            };
          })}
          />
        )}
      </SectionCard>
    </div>
  );
}
