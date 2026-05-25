import { Suspense, type ReactNode } from "react";
import { TenantAppShell } from "./TenantAppShell";

interface LayoutProps {
  params: { tenantSlug: string };
  children: ReactNode;
}

export default function TenantLayout({ params, children }: LayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
          Loading...
        </div>
      }
    >
      <TenantAppShell slug={params.tenantSlug}>{children}</TenantAppShell>
    </Suspense>
  );
}
