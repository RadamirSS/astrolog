"use client";

import { getCurrentAccount } from "@astro/api-client";
import { useEffect, useState } from "react";

type AccountSummary = {
  id: string;
  email: string;
  role: string;
  partnerId?: string | null;
};

const PLATFORM_ROLES = new Set(["platform_owner", "platform_admin"]);

export function isPlatformAdmin(role: string | undefined): boolean {
  return !!role && PLATFORM_ROLES.has(role);
}

export function useAccountRole() {
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCurrentAccount()
      .then((data) => {
        if (active) setAccount(data);
      })
      .catch(() => {
        if (active) setAccount(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return {
    account,
    loading,
    isPlatformAdmin: isPlatformAdmin(account?.role),
    hasPartnerScope: Boolean(account?.partnerId),
  };
}
