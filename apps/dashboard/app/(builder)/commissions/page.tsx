"use client";

import Link from "next/link";
import {
  getCommissionSummary,
  holdCommission,
  listCommissions,
  releaseCommission,
} from "@astro/api-client";
import { LoadingState, SectionCard, StatCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useT } from "@astro/i18n";
import {
  OpsActionButton,
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatDateLocale,
  formatMoneyLocale,
  maskOrderId,
  useOpsLocale,
} from "../../../components/ops/OpsShared";
import { useAccountRole } from "../../../hooks/useAccountRole";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function CommissionsPage() {
  const t = useT();
  const locale = useOpsLocale();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const q = `?tenantId=${tenantId}`;
  const { isPlatformAdmin: admin, account } = useAccountRole();
  const partnerId = account?.partnerId ?? undefined;

  const { data: commissions, loading, error, reload } = useOpsQuery(
    () => listCommissions(tenantId, admin ? undefined : partnerId),
    [tenantId, partnerId, admin]
  );
  const { data: summary } = useOpsQuery(
    () => getCommissionSummary(tenantId, admin ? undefined : partnerId),
    [tenantId, partnerId, admin]
  );

  const visibleCommissions = useMemo(() => {
    if (admin || !partnerId) return commissions ?? [];
    return (commissions ?? []).filter((c) => c.partnerId === partnerId);
  }, [commissions, admin, partnerId]);

  if (loading) return <LoadingState message={t("dashboard.finance.loading")} className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  const creatorColumns = [
    { key: "date", label: t("dashboard.finance.date") },
    { key: "product", label: t("dashboard.finance.product") },
    { key: "order", label: t("dashboard.finance.order") },
    { key: "gross", label: t("dashboard.finance.saleAmount") },
    { key: "amount", label: t("dashboard.finance.yourCommission") },
    { key: "status", label: t("dashboard.finance.statusColumn") },
    { key: "availableFrom", label: t("dashboard.finance.availableFrom") },
  ];

  const adminColumns = [
    ...creatorColumns,
    { key: "partner", label: t("dashboard.finance.partner") },
    { key: "actions", label: t("dashboard.finance.actions") },
  ];

  return (
    <div className="space-y-6">
      <OpsPageHeader
        title={t("dashboard.finance.accrualsTitle")}
        subtitle={t("dashboard.finance.accrualsSubtitle")}
      />

      <p className="text-sm text-slate-400">{t("dashboard.finance.accrualsExplain")}</p>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("dashboard.finance.explainPending")}
            value={formatMoneyLocale(summary.pending, "USD", locale)}
          />
          <StatCard
            label={t("dashboard.finance.explainAvailable")}
            value={formatMoneyLocale(summary.available, "USD", locale)}
          />
          <StatCard
            label={t("dashboard.finance.explainHold")}
            value={formatMoneyLocale(summary.onHold, "USD", locale)}
          />
          <StatCard
            label={t("dashboard.finance.explainPaidOut")}
            value={formatMoneyLocale(summary.paid, "USD", locale)}
          />
        </div>
      )}

      <SectionCard title={t("dashboard.finance.accrualsTitle")}>
        {visibleCommissions.length === 0 && !admin ? (
          <p className="text-sm text-slate-400">{t("dashboard.finance.emptyCommissions")}</p>
        ) : (
          <OpsTable
            columns={admin ? adminColumns : creatorColumns}
            rows={visibleCommissions.map((c) => ({
            date: formatDateLocale(c.createdAt, locale),
            product: c.productTitle ?? c.productType,
            order: admin ? (
              <Link href={`/orders/${c.orderId}${q}`} className="text-violet-400 hover:underline">
                {c.orderId}
              </Link>
            ) : (
              maskOrderId(c.orderId)
            ),
            gross: formatMoneyLocale(c.grossAmount, "USD", locale),
            amount: formatMoneyLocale(c.commissionAmount, "USD", locale),
            status: <OpsStatusBadge status={c.status} category="commission" />,
            availableFrom: c.availableAt ? formatDateLocale(c.availableAt, locale) : "—",
            partner: admin ? (
              <Link href={`/partners/${c.partnerId}${q}`} className="text-violet-400 hover:underline">
                {c.partnerName ?? c.partnerId}
              </Link>
            ) : undefined,
            actions: admin ? (
              <div className="flex flex-wrap gap-2">
                {(c.status === "pending" || c.status === "on_hold") && (
                  <OpsActionButton
                    label={t("dashboard.finance.release")}
                    variant="primary"
                    onClick={async () => {
                      await releaseCommission(tenantId, c.id);
                      await reload();
                    }}
                  />
                )}
                {(c.status === "pending" || c.status === "available") && (
                  <OpsActionButton
                    label={t("dashboard.finance.hold")}
                    variant="warning"
                    onClick={async () => {
                      await holdCommission(tenantId, c.id, t("dashboard.finance.manualHoldReason"));
                      await reload();
                    }}
                  />
                )}
              </div>
            ) : undefined,
          }))}
          />
        )}
      </SectionCard>
    </div>
  );
}
