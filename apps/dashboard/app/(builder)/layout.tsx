"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useT } from "@astro/i18n";
import { DashboardLayout } from "../components/DashboardLayout";

function BuilderLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  return <DashboardLayout tenantId={tenantId}>{children}</DashboardLayout>;
}

function BuilderLoadingFallback() {
  const t = useT();
  return <div className="p-8 text-slate-400">{t("dashboard.layout.loading")}</div>;
}

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<BuilderLoadingFallback />}>
      <BuilderLayoutInner>{children}</BuilderLayoutInner>
    </Suspense>
  );
}
