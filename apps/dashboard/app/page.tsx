import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function DashboardHome({
  searchParams,
}: {
  searchParams: { tenantId?: string };
}) {
  const cookieStore = cookies();
  const tenantId =
    searchParams.tenantId ??
    cookieStore.get("dashboard_tenant_id")?.value ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";

  redirect(`/overview?tenantId=${tenantId}`);
}
