"use client";

import Link from "next/link";
import { LocaleSwitcher, useT } from "@astro/i18n";

export function NotFoundContent() {
  const t = useT();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center">
      <div className="absolute right-6 top-6">
        <LocaleSwitcher />
      </div>
      <p className="text-4xl">✦</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-100">{t("miniapp.notFound.title")}</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">{t("miniapp.notFound.description")}</p>
      <Link
        href="/tenants"
        className="mt-6 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
      >
        {t("miniapp.notFound.browseDemoApps")}
      </Link>
    </div>
  );
}
