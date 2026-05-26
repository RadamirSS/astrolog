"use client";

import {
  createPayout,
  listPartners,
  listPayouts,
  updatePayout,
} from "@astro/api-client";
import { getPayoutMethodLabel } from "@astro/i18n";
import { LoadingState, SectionCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useI18n, useT } from "@astro/i18n";
import {
  OpsActionButton,
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatDateLocale,
  formatMoneyLocale,
  useOpsLocale,
} from "../../../components/ops/OpsShared";
import { useAccountRole } from "../../../hooks/useAccountRole";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function PayoutsPage() {
  const t = useT();
  const { locale } = useI18n();
  const opsLocale = useOpsLocale();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const { isPlatformAdmin: admin, account } = useAccountRole();
  const partnerId = account?.partnerId ?? undefined;

  const { data, loading, error, reload } = useOpsQuery(
    () => listPayouts(tenantId, admin ? undefined : partnerId),
    [tenantId, partnerId, admin]
  );
  const { data: partners } = useOpsQuery(
    () => (admin ? listPartners(tenantId) : Promise.resolve([])),
    [tenantId, admin]
  );
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [draftPartnerId, setDraftPartnerId] = useState("");
  const [draftAmount, setDraftAmount] = useState("");

  const visiblePayouts = useMemo(() => {
    if (admin || !partnerId) return data ?? [];
    return (data ?? []).filter((p) => p.partnerId === partnerId);
  }, [data, admin, partnerId]);

  if (loading) return <LoadingState message={t("dashboard.finance.loading")} className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  const creatorColumns = [
    { key: "date", label: t("dashboard.finance.date") },
    { key: "amount", label: t("dashboard.finance.amount") },
    { key: "method", label: t("dashboard.finance.method") },
    { key: "status", label: t("dashboard.finance.statusColumn") },
    { key: "comment", label: t("dashboard.finance.comment") },
  ];

  const adminColumns = [
    ...creatorColumns,
    { key: "partner", label: t("dashboard.finance.partner") },
    { key: "notes", label: t("dashboard.finance.notesActions") },
  ];

  return (
    <div className="space-y-6">
      <OpsPageHeader
        title={t("dashboard.finance.payoutsTitle")}
        subtitle={t("dashboard.finance.payoutsSubtitle")}
      />

      {!admin && (
        <div className="space-y-2 rounded-xl border border-sky-500/20 bg-sky-950/30 px-4 py-3 text-sm text-sky-100">
          <p>{t("dashboard.finance.payoutsManualNote")}</p>
          <p className="text-sky-200/80">{t("dashboard.finance.payoutsAutoNote")}</p>
        </div>
      )}

      {admin && (
        <SectionCard title={t("dashboard.finance.createPayoutDraft")}>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              {t("dashboard.finance.selectPartner")}
              <select
                value={draftPartnerId}
                onChange={(e) => setDraftPartnerId(e.target.value)}
                className="mt-1 block min-w-[180px] rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
              >
                <option value="">{t("dashboard.finance.selectPartnerPlaceholder")}</option>
                {(partners ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              {t("dashboard.finance.amount")}
              <input
                type="number"
                min="0"
                step="0.01"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                className="mt-1 block rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
              />
            </label>
            <OpsActionButton
              label={t("dashboard.finance.createDraft")}
              disabled={!draftPartnerId || !draftAmount}
              onClick={async () => {
                await createPayout(tenantId, {
                  partnerId: draftPartnerId,
                  amount: parseFloat(draftAmount),
                  currency: "USD",
                });
                setDraftAmount("");
                await reload();
              }}
            />
          </div>
        </SectionCard>
      )}

      <SectionCard title={t("dashboard.finance.payoutsTitle")}>
        {visiblePayouts.length === 0 && !admin ? (
          <p className="text-sm text-slate-400">{t("dashboard.finance.emptyPayouts")}</p>
        ) : (
          <OpsTable
            columns={admin ? adminColumns : creatorColumns}
            rows={visiblePayouts.map((p) => ({
            date: formatDateLocale(p.createdAt, opsLocale),
            amount: formatMoneyLocale(p.amount, p.currency, opsLocale),
            method: getPayoutMethodLabel(p.method ?? "manual", locale),
            status: <OpsStatusBadge status={p.status} category="payout" />,
            comment: p.notes ?? p.failureReason ?? "—",
            partner: admin ? p.partnerName ?? p.partnerId : undefined,
            notes: admin ? (
              <div className="min-w-[220px] space-y-2">
                <p className="text-xs text-slate-400">{p.notes ?? p.failureReason ?? "—"}</p>
                <input
                  type="text"
                  placeholder={t("dashboard.finance.addNotePlaceholder")}
                  value={noteDraft[p.id] ?? ""}
                  onChange={(e) =>
                    setNoteDraft((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                />
                <div className="flex flex-wrap gap-2">
                  {(p.status === "draft" || p.status === "pending_approval") && (
                    <OpsActionButton
                      label={t("dashboard.finance.approve")}
                      onClick={async () => {
                        await updatePayout(tenantId, p.id, { action: "approve" });
                        await reload();
                      }}
                    />
                  )}
                  {p.status === "approved" && (
                    <>
                      <OpsActionButton
                        label={t("dashboard.finance.markPaid")}
                        variant="success"
                        onClick={async () => {
                          await updatePayout(tenantId, p.id, {
                            action: "paid",
                            notes: noteDraft[p.id],
                          });
                          await reload();
                        }}
                      />
                      <OpsActionButton
                        label={t("dashboard.finance.markFailed")}
                        variant="danger"
                        onClick={async () => {
                          await updatePayout(tenantId, p.id, {
                            action: "failed",
                            reason: noteDraft[p.id] || t("dashboard.finance.manualFailureReason"),
                          });
                          await reload();
                        }}
                      />
                    </>
                  )}
                  {p.status !== "paid" && p.status !== "cancelled" && (
                    <OpsActionButton
                      label={t("dashboard.finance.cancel")}
                      variant="neutral"
                      onClick={async () => {
                        await updatePayout(tenantId, p.id, { action: "cancel" });
                        await reload();
                      }}
                    />
                  )}
                </div>
              </div>
            ) : undefined,
          }))}
          />
        )}
      </SectionCard>
    </div>
  );
}
