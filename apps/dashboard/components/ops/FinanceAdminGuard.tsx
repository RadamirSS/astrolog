"use client";

import { LoadingState } from "@astro/ui";
import { useT } from "@astro/i18n";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAccountRole } from "../../hooks/useAccountRole";

/** Redirects non–platform-admin users away from admin-only finance routes. */
export function FinanceAdminGuard({ children }: { children: React.ReactNode }) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const { isPlatformAdmin, loading } = useAccountRole();

  useEffect(() => {
    if (!loading && !isPlatformAdmin) {
      router.replace(`/overview?tenantId=${tenantId}`);
    }
  }, [loading, isPlatformAdmin, router, tenantId]);

  if (loading) {
    return <LoadingState message={t("dashboard.finance.loading")} className="text-slate-400" />;
  }

  if (!isPlatformAdmin) {
    return (
      <p className="text-sm text-slate-400">{t("dashboard.finance.adminOnlyAccess")}</p>
    );
  }

  return <>{children}</>;
}
