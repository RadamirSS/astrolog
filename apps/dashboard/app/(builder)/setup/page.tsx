import { redirect } from "next/navigation";

export default function SetupRedirectPage({
  searchParams,
}: {
  searchParams: { tenantId?: string };
}) {
  redirect(`/launch/start?tenantId=${searchParams.tenantId ?? "tenant_mystic"}`);
}
