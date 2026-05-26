import { redirect } from "next/navigation";

export default function LaunchIndexPage({
  searchParams,
}: {
  searchParams: { tenantId?: string };
}) {
  const tenantId = searchParams.tenantId ?? "tenant_mystic";
  redirect(`/launch/start?tenantId=${tenantId}`);
}
