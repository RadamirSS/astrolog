import type { CSSProperties, ReactNode } from "react";

interface AppShellProps {
  title?: string;
  header?: ReactNode;
  footer?: ReactNode;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}

export function AppShell({ title, header, footer, style, className = "", children }: AppShellProps) {
  return (
    <div
      className={`min-h-screen text-[var(--color-text)] ${className}`}
      style={{ backgroundColor: "var(--color-bg)", ...style }}
    >
      {(title || header) && (
        <header className="border-b border-[var(--color-border)] px-6 py-4">
          {header ?? (title && <h1 className="text-xl font-semibold">{title}</h1>)}
        </header>
      )}
      <main>{children}</main>
      {footer && (
        <footer className="border-t border-[var(--color-border)] px-6 py-4 text-sm text-[var(--color-text-muted)]">
          {footer}
        </footer>
      )}
    </div>
  );
}
