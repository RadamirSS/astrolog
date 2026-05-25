"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ApiClientError, ApiErrorCode, getApiMode, getCurrentAccount } from "@astro/api-client";

const PLATFORM_ROLES = new Set(["platform_owner", "platform_admin"]);

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(getApiMode() === "mock");
  const [forbidden, setForbidden] = useState(false);
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

  useEffect(() => {
    if (getApiMode() === "mock") {
      setReady(true);
      setForbidden(false);
      return;
    }
    if (pathname === "/login") {
      setReady(true);
      setForbidden(false);
      return;
    }

    let cancelled = false;
    getCurrentAccount()
      .then((account) => {
        if (cancelled) return;
        if (!PLATFORM_ROLES.has(account.role)) {
          setForbidden(true);
          setReady(true);
          return;
        }
        setForbidden(false);
        setReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiClientError && error.code === ApiErrorCode.UNAUTHORIZED) {
          router.replace("/login");
          return;
        }
        setForbidden(false);
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading...</div>;
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold text-slate-100">Access denied</h1>
        <p className="max-w-md text-sm text-slate-400">
          Superadmin is restricted to platform owner and platform admin accounts.
        </p>
        <Link href="/login" className="text-sm text-violet-400 underline">
          Back to login
        </Link>
        <a href={dashboardUrl} className="text-sm text-slate-300 underline">
          Open blogger dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
