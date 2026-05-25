"use client";

import { useEffect } from "react";
import { useT } from "@astro/i18n";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useT();
  const resolvedConfirmLabel = confirmLabel ?? t("ui.confirm");
  const resolvedCancelLabel = cancelLabel ?? t("ui.cancel");

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label={t("ui.closeDialog")}
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl"
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-slate-100">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {resolvedCancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "secondary" : "primary"}
            onClick={onConfirm}
            disabled={loading}
            className={variant === "danger" ? "border-red-800 text-red-300 hover:bg-red-950" : ""}
          >
            {loading ? t("ui.pleaseWait") : resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
