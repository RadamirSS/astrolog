"use client";

import { useT } from "@astro/i18n";

interface FormActionsProps {
  onSave?: () => void;
  onReset?: () => void;
  saving?: boolean;
  isDirty?: boolean;
  saveLabel?: string;
  resetLabel?: string;
}

export function FormActions({
  onSave,
  onReset,
  saving = false,
  isDirty = false,
  saveLabel,
  resetLabel,
}: FormActionsProps) {
  const t = useT();
  const resolvedSaveLabel = saveLabel ?? t("ui.saveChanges");
  const resolvedResetLabel = resetLabel ?? t("ui.resetToSaved");

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4">
      {onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !isDirty}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
        >
          {saving ? t("ui.saving") : resolvedSaveLabel}
        </button>
      )}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          {resolvedResetLabel}
        </button>
      )}
      {isDirty && !saving && (
        <span className="text-xs text-amber-400">{t("ui.unsavedHint")}</span>
      )}
    </div>
  );
}
