import type { ReactNode } from "react";

export { Badge } from "./Badge";

interface DashboardShellProps {
  title: string;
  nav: ReactNode;
  topbar?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({ title, nav, topbar, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 lg:flex-row">
      <aside className="w-full shrink-0 border-b border-slate-800 p-4 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="mb-6 text-lg font-semibold">{title}</div>
        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">{nav}</nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {topbar && (
          <header className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-6 py-3">
            {topbar}
          </header>
        )}
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  active?: boolean;
  children: ReactNode;
}

export function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <a
      href={href}
      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-violet-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {children}
    </a>
  );
}

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {children}
    </section>
  );
}
