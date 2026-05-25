import type { MiniAppScreen } from "./types";

export function miniAppPaths(slug: string) {
  return {
    home: `/${slug}`,
    onboarding: `/${slug}/onboarding`,
    loading: `/${slug}/report/loading`,
    report: `/${slug}/report/free`,
    paywall: `/${slug}/paywall`,
    products: `/${slug}/products`,
    productDetail: (id: string) => `/${slug}/products/${id}`,
    reports: `/${slug}/reports`,
    profile: `/${slug}/profile`,
    paymentSuccess: `/${slug}/payment/success`,
    paymentCancel: `/${slug}/payment/cancel`,
    paymentPending: `/${slug}/payment/pending`,
    paymentFailed: `/${slug}/payment/failed`,
    paidReport: (reportId: string) => `/${slug}/report/paid/${reportId}`,
    premiumRequest: (productId?: string) =>
      productId ? `/${slug}/premium/request?productId=${productId}` : `/${slug}/premium/request`,
    premiumStatus: (requestId: string) => `/${slug}/premium/status/${requestId}`,
  };
}

export function pathnameToScreen(pathname: string, slug: string): MiniAppScreen | null {
  const base = `/${slug}`;
  if (pathname === base || pathname === `${base}/`) return "home";
  if (pathname.startsWith(`${base}/onboarding`)) return "onboarding";
  if (pathname === `${base}/report/loading`) return "loading";
  if (pathname === `${base}/report/free`) return "report";
  if (pathname.startsWith(`${base}/report/paid/`)) return "report";
  if (pathname === `${base}/paywall`) return "paywall";
  if (pathname === `${base}/products`) return "products";
  if (pathname.startsWith(`${base}/products/`)) return "productDetail";
  if (pathname === `${base}/reports`) return "reports";
  if (pathname === `${base}/profile`) return "profile";
  return null;
}

export function hideBottomNav(pathname: string, slug: string): boolean {
  const hidden = [`/${slug}/onboarding`, `/${slug}/report/loading`, `/${slug}/paywall`];
  if (hidden.includes(pathname)) return true;
  if (pathname.startsWith(`/${slug}/products/`) && pathname !== `/${slug}/products`) return true;
  return false;
}

export function sessionStorageKey(tenantId: string, userId: string): string {
  return `astro_miniapp_${tenantId}_${userId}`;
}
