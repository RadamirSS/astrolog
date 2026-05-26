"use client";

import Link from "next/link";
import { getApiMode } from "@astro/api-client";
import { LocaleSwitcher, useT } from "@astro/i18n";
import { Badge, MockModeBanner } from "@astro/ui";
import { usePathname, useSearchParams } from "next/navigation";
import { DashboardProvider, useDashboard } from "./DashboardProvider";
import { useAccountRole } from "../../hooks/useAccountRole";

const CREATOR_PRIMARY_NAV = [
  { href: "overview", labelKey: "dashboard.layout.overview" },
  { href: "launch/start", labelKey: "dashboard.layout.launchCenter" },
] as const;

const CREATOR_FINANCE_NAV = [
  { href: "payments", labelKey: "dashboard.layout.payments" },
  { href: "balances", labelKey: "dashboard.layout.balances" },
  { href: "payouts", labelKey: "dashboard.layout.payouts" },
] as const;

const CREATOR_OPS_NAV = [
  { href: "premium-requests", labelKey: "dashboard.layout.premiumRequests" },
  { href: "promo-materials", labelKey: "dashboard.layout.promoMaterials" },
] as const;

const ADMIN_OPS_NAV = [
  { href: "orders", labelKey: "dashboard.layout.orders" },
  { href: "premium-requests", labelKey: "dashboard.layout.premiumRequests" },
  { href: "funnel-analytics", labelKey: "dashboard.layout.funnelAnalytics" },
] as const;

const ADMIN_FINANCE_NAV = [
  { href: "revenue", labelKey: "dashboard.layout.revenue" },
  { href: "payments", labelKey: "dashboard.layout.payments" },
  { href: "balances", labelKey: "dashboard.layout.balances" },
  { href: "commissions", labelKey: "dashboard.layout.commissions" },
  { href: "payouts", labelKey: "dashboard.layout.payouts" },
  { href: "ledger", labelKey: "dashboard.layout.ledger" },
  { href: "product-economics", labelKey: "dashboard.layout.productEconomics" },
] as const;

const ADMIN_PARTNERS_NAV = [
  { href: "partners", labelKey: "dashboard.layout.partners" },
  { href: "partner-links", labelKey: "dashboard.layout.partnerLinks" },
  { href: "promo-materials", labelKey: "dashboard.layout.promoMaterials" },
] as const;

function NavLink({
  href,
  label,
  tenantId,
  pathname,
}: {
  href: string;
  label: string;
  tenantId: string;
  pathname: string;
}) {
  const fullHref = href.includes("#")
    ? `/${href.split("#")[0]}?tenantId=${tenantId}#${href.split("#")[1]}`
    : `/${href}?tenantId=${tenantId}`;
  const pathPart = href.split("#")[0];
  const isActive = pathname.includes(`/${pathPart}`);

  return (
    <Link
      href={fullHref}
      className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
        isActive
          ? "bg-violet-600 text-white"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function NavSection({
  title,
  items,
  tenantId,
  pathname,
  t,
}: {
  title: string;
  items: ReadonlyArray<{ href: string; labelKey: string }>;
  tenantId: string;
  pathname: string;
  t: (key: string) => string;
}) {
  return (
    <div className="mt-4 w-full border-t border-slate-800 pt-4">
      <p className="mb-2 px-3 text-xs uppercase tracking-wide text-slate-500">{title}</p>
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={t(item.labelKey)}
          tenantId={tenantId}
          pathname={pathname}
        />
      ))}
    </div>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const { config, saving, error, isDirty } = useDashboard();
  const { isPlatformAdmin: admin, hasPartnerScope } = useAccountRole();

  const showFinanceNav = admin || hasPartnerScope;

  const creatorNav = [
    ...CREATOR_PRIMARY_NAV,
    ...(showFinanceNav ? CREATOR_FINANCE_NAV : []),
    { href: "premium-requests", labelKey: "dashboard.layout.premiumRequests" },
    ...(hasPartnerScope
      ? [{ href: "promo-materials", labelKey: "dashboard.layout.promoMaterials" } as const]
      : []),
    { href: "settings", labelKey: "dashboard.layout.settings" },
  ];

  const financeNav = admin ? ADMIN_FINANCE_NAV : CREATOR_FINANCE_NAV;
  const opsNav = admin ? ADMIN_OPS_NAV : CREATOR_OPS_NAV;

  const topbar = (
    <>
      <Badge variant="info">{config?.slug ?? tenantId}</Badge>
      {getApiMode() === "mock" && <Badge variant="warning">{t("dashboard.layout.mockMode")}</Badge>}
      {isDirty ? (
        <Badge variant="warning">{t("dashboard.layout.unsavedChanges")}</Badge>
      ) : !saving && config ? (
        <Badge variant="success">{t("dashboard.layout.allSaved")}</Badge>
      ) : null}
      {saving && <span className="text-xs text-violet-400">{t("dashboard.layout.saving")}</span>}
      <LocaleSwitcher className="ml-auto" />
      {config && (
        <span className="text-sm text-slate-400">{config.brand.displayName}</span>
      )}
    </>
  );

  return (
    <>
      <MockModeBanner mode={getApiMode()} />
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 lg:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-800 p-4 lg:w-64 lg:border-b-0 lg:border-r">
          <div className="mb-6 text-lg font-semibold">
            {config?.brand.displayName ?? t("dashboard.layout.titleFallback")}
          </div>
          <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
            {admin ? (
              <>
                <NavLink href="overview" label={t("dashboard.layout.overview")} tenantId={tenantId} pathname={pathname} />
                <NavLink href="launch/start" label={t("dashboard.layout.launchCenter")} tenantId={tenantId} pathname={pathname} />
                <NavLink href="settings" label={t("dashboard.layout.settings")} tenantId={tenantId} pathname={pathname} />
                <NavSection
                  title={t("dashboard.layout.operationsSection")}
                  items={opsNav}
                  tenantId={tenantId}
                  pathname={pathname}
                  t={t}
                />
                <NavSection
                  title={t("dashboard.layout.financeSection")}
                  items={financeNav}
                  tenantId={tenantId}
                  pathname={pathname}
                  t={t}
                />
                <NavSection
                  title={t("dashboard.layout.partnersSection")}
                  items={ADMIN_PARTNERS_NAV}
                  tenantId={tenantId}
                  pathname={pathname}
                  t={t}
                />
              </>
            ) : (
              creatorNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={t(item.labelKey)}
                  tenantId={tenantId}
                  pathname={pathname}
                />
              ))
            )}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-6 py-3">
            {topbar}
          </header>
          <main className="flex-1 overflow-auto p-6 lg:p-8">
            {error && (
              <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-sm text-red-300">
                {error}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

export function DashboardLayout({
  tenantId,
  children,
}: {
  tenantId: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider tenantId={tenantId}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardProvider>
  );
}
