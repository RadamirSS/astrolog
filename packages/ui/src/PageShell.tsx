import type { ReactNode } from "react";

interface PageShellProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function PageShell({ title, subtitle, children, footer }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
        {(title || subtitle) && (
          <header className="space-y-1">
            {title && <h1 className="text-2xl font-semibold text-[var(--color-text)]">{title}</h1>}
            {subtitle && <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
          </header>
        )}
        <div className="flex flex-1 flex-col gap-4">{children}</div>
      </main>
      {footer && (
        <footer className="sticky bottom-0 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_90%,transparent)] px-4 py-3 backdrop-blur">
          {footer}
        </footer>
      )}
    </div>
  );
}
