"use client";

import { useState } from "react";
import { Badge } from "@astro/ui";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

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
      {copied ? "Copied!" : label}
    </button>
  );
}

export function OpsStatusBadge({ status }: { status: string }) {
  const variant =
    status === "paid" || status === "ready" || status === "active" || status === "approved"
      ? "success"
      : status === "pending" || status === "payment_pending" || status === "generating" || status === "queued"
        ? "warning"
        : status === "failed" || status === "cancelled" || status === "blocked" || status === "refunded"
          ? "error"
          : "info";
  return <Badge variant={variant}>{status}</Badge>;
}

interface OpsTableProps {
  columns: Array<{ key: string; label: string; className?: string }>;
  rows: Array<Record<string, React.ReactNode>>;
  emptyMessage?: string;
}

export function OpsTable({ columns, rows, emptyMessage = "No data" }: OpsTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">{emptyMessage}</p>;
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

export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
