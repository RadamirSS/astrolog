import type { ReactNode } from "react";
import { Button } from "./Button";

interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Повторить",
  action,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/30 bg-red-500/5 px-6 py-10 text-center">
      <h3 className="text-base font-medium text-red-300">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted,#94a3b8)]">{description}</p>
      )}
      {(onRetry || action) && (
        <div className="mt-4 flex flex-col gap-2">
          {onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
