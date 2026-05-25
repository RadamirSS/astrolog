"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiClientError, ApiErrorCode, getApiMode, getCurrentAccount } from "@astro/api-client";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(getApiMode() === "mock");

  useEffect(() => {
    if (getApiMode() === "mock") {
      setReady(true);
      return;
    }
    if (pathname === "/login") {
      setReady(true);
      return;
    }

    let cancelled = false;
    getCurrentAccount()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiClientError && error.code === ApiErrorCode.UNAUTHORIZED) {
          router.replace("/login");
          return;
        }
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading...</div>;
  }

  return <>{children}</>;
}
