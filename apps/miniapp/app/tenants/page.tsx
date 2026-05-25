import { getTenants } from "@astro/api-client";
import { TenantsLauncher } from "./TenantsLauncher";

export default async function TenantsPage() {
  const tenants = await getTenants();
  const dashboardBase =
    process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

  return <TenantsLauncher tenants={tenants} dashboardBase={dashboardBase} />;
}
