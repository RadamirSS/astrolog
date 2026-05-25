import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text,#f8fafc)]">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--color-text-muted,#94a3b8)]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
