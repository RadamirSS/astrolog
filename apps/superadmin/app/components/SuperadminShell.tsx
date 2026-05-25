"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getApiMode } from "@astro/api-client";
import { LocaleSwitcher, useT } from "@astro/i18n";
import { MockModeBanner } from "@astro/ui";

const NAV = [{ href: "/tenants", labelKey: "superadmin.shell.tenants" }] as const;

export function SuperadminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useT();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <MockModeBanner mode={getApiMode()} />
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <div>
            <h1 className="text-xl font-semibold">{t("superadmin.shell.title")}</h1>
            <p className="text-sm text-slate-400">{t("superadmin.shell.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex gap-2">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      active
                        ? "bg-violet-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>
            <LocaleSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-8 py-8">{children}</main>
    </div>
  );
}
