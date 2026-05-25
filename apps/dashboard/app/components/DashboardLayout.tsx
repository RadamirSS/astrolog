"use client";

import Link from "next/link";
import { getApiMode } from "@astro/api-client";
import { LocaleSwitcher, useT } from "@astro/i18n";
import { Badge, MockModeBanner } from "@astro/ui";
import { usePathname, useSearchParams } from "next/navigation";
import { DashboardProvider, useDashboard } from "./DashboardProvider";
import { useAccountRole } from "../../hooks/useAccountRole";

const BUILDER_NAV = [
  { href: "overview", labelKey: "dashboard.layout.overview" },
  { href: "setup", labelKey: "dashboard.layout.setup" },
  { href: "brand", labelKey: "dashboard.layout.brand" },
  { href: "design", labelKey: "dashboard.layout.design" },
  { href: "content", labelKey: "dashboard.layout.content" },
  { href: "products", labelKey: "dashboard.layout.products" },
  { href: "preview", labelKey: "dashboard.layout.preview" },
  { href: "publish", labelKey: "dashboard.layout.publish" },
  { href: "settings", labelKey: "dashboard.layout.settings" },
] as const;

const OPS_NAV = {
  sectionKey: "dashboard.layout.operationsSection",
  items: [
    { href: "orders", labelKey: "dashboard.layout.orders" },
    { href: "premium-requests", labelKey: "dashboard.layout.premiumRequests" },
    { href: "funnel-analytics", labelKey: "dashboard.layout.funnelAnalytics" },
  ],
} as const;

const FINANCE_NAV = {
  sectionKey: "dashboard.layout.financeSection",
  items: [
    { href: "revenue", labelKey: "dashboard.layout.revenue" },
    { href: "payments", labelKey: "dashboard.layout.payments" },
    { href: "balances", labelKey: "dashboard.layout.balances" },
    { href: "ledger", labelKey: "dashboard.layout.ledger" },
    { href: "product-economics", labelKey: "dashboard.layout.productEconomics" },
    { href: "commissions", labelKey: "dashboard.layout.commissions" },
    { href: "payouts", labelKey: "dashboard.layout.payouts" },
  ],
} as const;

const PARTNERS_NAV = {
  sectionKey: "dashboard.layout.partnersSection",
  items: [
    { href: "partners", labelKey: "dashboard.layout.partners" },
    { href: "partner-links", labelKey: "dashboard.layout.partnerLinks" },
    { href: "promo-materials", labelKey: "dashboard.layout.promoMaterials" },
  ],
} as const;

const FUTURE_NAV = [{ href: "telegram", labelKey: "dashboard.layout.telegram" }] as const;

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
  const fullHref = `/${href}?tenantId=${tenantId}`;
  const active = pathname.includes(`/${href}`);
  return (
    <Link
      href={fullHref}
      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
        active
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
  const { account, isPlatformAdmin: admin, hasPartnerScope } = useAccountRole();

  const financeItems = FINANCE_NAV.items.filter((item) => {
    if (admin) return true;
    if (!hasPartnerScope) return false;
    return !["revenue", "ledger", "product-economics"].includes(item.href);
  });

  const showFinanceNav = admin || hasPartnerScope;
  const showPartnersNav = admin || hasPartnerScope;

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
            {BUILDER_NAV.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={t(item.labelKey)}
                tenantId={tenantId}
                pathname={pathname}
              />
            ))}
            <NavSection
              title={t(OPS_NAV.sectionKey)}
              items={OPS_NAV.items}
              tenantId={tenantId}
              pathname={pathname}
              t={t}
            />
            {showFinanceNav && (
              <NavSection
                title={t(FINANCE_NAV.sectionKey)}
                items={financeItems}
                tenantId={tenantId}
                pathname={pathname}
                t={t}
              />
            )}
            {showPartnersNav && (
              <NavSection
                title={t(PARTNERS_NAV.sectionKey)}
                items={PARTNERS_NAV.items}
                tenantId={tenantId}
                pathname={pathname}
                t={t}
              />
            )}
            <div className="mt-4 w-full border-t border-slate-800 pt-4 lg:mt-6">
              <p className="mb-2 px-3 text-xs uppercase tracking-wide text-slate-500">
                {t("dashboard.layout.comingLaterSection")}
              </p>
              {FUTURE_NAV.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={t(item.labelKey)}
                  tenantId={tenantId}
                  pathname={pathname}
                />
              ))}
            </div>
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
