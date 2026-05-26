"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function TelegramRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";

  useEffect(() => {
    router.replace(`/launch/telegram?tenantId=${tenantId}`);
  }, [router, tenantId]);

  return null;
}
