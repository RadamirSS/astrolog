import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[color-mix(in_srgb,var(--color-border,#334155)_70%,transparent)] bg-[color-mix(in_srgb,var(--color-surface,#1e293b)_50%,transparent)] px-6 py-12 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-xl text-[var(--color-primary)]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium text-[var(--color-text,#f8fafc)]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted,#94a3b8)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
