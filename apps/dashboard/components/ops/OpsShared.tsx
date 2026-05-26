"use client";

import { useState } from "react";
import { getFinanceStatusLabel, getFinanceStatusVariant, useI18n, useT } from "@astro/i18n";
import type { FinanceStatusCategory } from "@astro/i18n";
import { Badge } from "@astro/ui";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function useOpsLocale() {
  const { locale } = useI18n();
  return locale;
}

export function formatMoneyLocale(amount: number, currency = "USD", locale?: string): string {
  const loc = locale === "ru" ? "ru-RU" : "en-US";
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMoney(amount: number, currency = "USD"): string {
  return formatMoneyLocale(amount, currency, "en");
}

export function formatDateLocale(iso: string, locale?: string): string {
  const loc = locale === "ru" ? "ru-RU" : undefined;
  return new Date(iso).toLocaleString(loc);
}

export function formatDate(iso: string): string {
  return formatDateLocale(iso);
}

export function CopyButton({ value, label }: CopyButtonProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copyLabel = label ?? t("dashboard.finance.copy");

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
    >
      {copied ? t("dashboard.finance.copied") : copyLabel}
    </button>
  );
}

export function OpsStatusBadge({
  status,
  category,
}: {
  status: string;
  category?: FinanceStatusCategory;
}) {
  const { locale } = useI18n();
  const variant = getFinanceStatusVariant(status);
  const label = getFinanceStatusLabel(status, locale, category);
  return <Badge variant={variant}>{label}</Badge>;
}

interface OpsTableProps {
  columns: Array<{ key: string; label: string; className?: string }>;
  rows: Array<Record<string, React.ReactNode>>;
  emptyMessage?: string;
}

export function OpsTable({ columns, rows, emptyMessage }: OpsTableProps) {
  const t = useT();
  const empty = emptyMessage ?? t("dashboard.finance.noData");
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900/80 text-left text-slate-400">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-medium ${col.className ?? ""}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-800 hover:bg-slate-900/50">
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-slate-200 ${col.className ?? ""}`}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OpsPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="text-slate-400">{subtitle}</p>}
    </div>
  );
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function maskBuyerId(id: string | undefined | null): string {
  if (!id) return "—";
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-3)}`;
}

export function maskOrderId(id: string | undefined | null): string {
  if (!id) return "—";
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

const ACTION_VARIANTS = {
  primary: "bg-violet-700 hover:bg-violet-600 text-white",
  success: "bg-emerald-800 hover:bg-emerald-700 text-white",
  danger: "bg-red-900 hover:bg-red-800 text-white",
  neutral: "bg-slate-700 hover:bg-slate-600 text-white",
  warning: "bg-amber-800 hover:bg-amber-700 text-white",
} as const;

export function OpsActionButton({
  label,
  onClick,
  variant = "primary",
  disabled,
}: {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: keyof typeof ACTION_VARIANTS;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onClick()}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${ACTION_VARIANTS[variant]}`}
    >
      {label}
    </button>
  );
}
