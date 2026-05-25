export const API_ENDPOINTS = {
  tenantConfig: (slug: string, preview?: "draft" | "published") =>
    `/api/tenant/${slug}/config${preview === "draft" ? "?preview=draft" : ""}`,
  tenantPublishedConfig: (slug: string) => `/api/tenant/${slug}/config/published`,
  tenantProducts: (slug: string) => `/api/tenant/${slug}/products`,
  tenantProduct: (slug: string, productId: string) =>
    `/api/tenant/${slug}/products/${productId}`,
  dashboardTenants: "/api/dashboard/tenants",
  dashboardTenant: (tenantId: string) => `/api/dashboard/tenants/${tenantId}`,
  dashboardTenantDraft: (tenantId: string) =>
    `/api/dashboard/tenants/${tenantId}/config/draft`,
  dashboardTenantPublished: (tenantId: string) =>
    `/api/dashboard/tenants/${tenantId}/config/published`,
  dashboardTenantStatus: (tenantId: string) =>
    `/api/dashboard/tenants/${tenantId}/config/status`,
  dashboardTenantPublish: (tenantId: string) =>
    `/api/dashboard/tenants/${tenantId}/publish`,
  dashboardTenantDiscardDraft: (tenantId: string) =>
    `/api/dashboard/tenants/${tenantId}/discard-draft`,
  dashboardTenantRestoreDraft: (tenantId: string) =>
    `/api/dashboard/tenants/${tenantId}/restore-draft-from-published`,
  dashboardTenantSummary: (tenantId: string) =>
    `/api/dashboard/tenants/${tenantId}/summary`,
  dashboardTenantStats: (tenantId: string) =>
    `/api/dashboard/tenants/${tenantId}/stats`,
  birthProfile: "/api/me/birth-profile",
  currentUser: "/api/me",
  telegramValidateInitData: "/api/telegram/validate-init-data",
  reportsFree: "/api/reports/free",
  reports: "/api/reports",
  report: (reportId: string) => `/api/reports/${reportId}`,
  analyticsEvents: "/api/analytics/events",
  dashboardTenantMetrics: (tenantId: string, period: "7d" | "30d" = "7d") =>
    `/api/dashboard/tenants/${tenantId}/metrics?period=${period}`,
  dashboardTenantMedia: (tenantId: string) => `/api/dashboard/tenants/${tenantId}/media`,
  dashboardTenantMediaItem: (tenantId: string, assetId: string) =>
    `/api/dashboard/tenants/${tenantId}/media/${assetId}`,
  adminTenantHealth: (tenantId: string) => `/api/admin/tenants/${tenantId}/health`,
  adminAuditLogs: (params?: { tenantId?: string; action?: string; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.tenantId) search.set("tenantId", params.tenantId);
    if (params?.action) search.set("action", params.action);
    if (params?.limit) search.set("limit", String(params.limit));
    const query = search.toString();
    return `/api/admin/audit-logs${query ? `?${query}` : ""}`;
  },
  dashboardOpsOrders: (tenantId: string, params?: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) search.set(key, value);
      }
    }
    const query = search.toString();
    return `/api/dashboard/tenants/${tenantId}/ops/orders${query ? `?${query}` : ""}`;
  },
  dashboardOpsOrder: (tenantId: string, orderId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/orders/${orderId}`,
  dashboardOpsRevenue: (tenantId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/revenue`,
  dashboardOpsPartners: (tenantId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/partners`,
  dashboardOpsPartner: (tenantId: string, partnerId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/partners/${partnerId}`,
  dashboardOpsCommissions: (tenantId: string, partnerId?: string) => {
    const search = partnerId ? `?partnerId=${partnerId}` : "";
    return `/api/dashboard/tenants/${tenantId}/ops/commissions${search}`;
  },
  dashboardOpsCommissionSummary: (tenantId: string, partnerId?: string) => {
    const search = partnerId ? `?partnerId=${partnerId}` : "";
    return `/api/dashboard/tenants/${tenantId}/ops/commissions/summary${search}`;
  },
  dashboardOpsCommissionRelease: (tenantId: string, commissionId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/commissions/${commissionId}/release`,
  dashboardOpsCommissionHold: (tenantId: string, commissionId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/commissions/${commissionId}/hold`,
  dashboardOpsPayouts: (tenantId: string, partnerId?: string) => {
    const search = partnerId ? `?partnerId=${partnerId}` : "";
    return `/api/dashboard/tenants/${tenantId}/ops/payouts${search}`;
  },
  dashboardOpsPayout: (tenantId: string, payoutId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/payouts/${payoutId}`,
  dashboardOpsPayments: (tenantId: string, params?: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) search.set(key, value);
      }
    }
    const query = search.toString();
    return `/api/dashboard/tenants/${tenantId}/ops/payments${query ? `?${query}` : ""}`;
  },
  dashboardOpsPayment: (tenantId: string, paymentId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/payments/${paymentId}`,
  dashboardOpsBalances: (tenantId: string, partnerId?: string) => {
    const search = partnerId ? `?partnerId=${partnerId}` : "";
    return `/api/dashboard/tenants/${tenantId}/ops/balances${search}`;
  },
  dashboardOpsBalance: (tenantId: string, partnerId: string, currency = "USD") =>
    `/api/dashboard/tenants/${tenantId}/ops/balances/${partnerId}?currency=${currency}`,
  dashboardOpsBalanceAdjustment: (tenantId: string, partnerId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/balances/${partnerId}/adjustments`,
  dashboardOpsLedger: (tenantId: string, params?: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) search.set(key, value);
      }
    }
    const query = search.toString();
    return `/api/dashboard/tenants/${tenantId}/ops/ledger${query ? `?${query}` : ""}`;
  },
  dashboardOpsPartnerFinance: (tenantId: string, partnerId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/partners/${partnerId}/finance`,
  dashboardOpsOrderMarkRefunded: (tenantId: string, orderId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/orders/${orderId}/mark-refunded`,
  dashboardOpsPromoMaterials: (tenantId: string, partnerId?: string) => {
    const search = partnerId ? `?partnerId=${partnerId}` : "";
    return `/api/dashboard/tenants/${tenantId}/ops/promo-materials${search}`;
  },
  dashboardOpsProductEconomics: (tenantId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/product-economics`,
  dashboardOpsFunnelAnalytics: (tenantId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/funnel-analytics`,
  checkoutStart: "/api/checkout/start",
  checkoutOrder: (orderId: string) => `/api/checkout/${orderId}`,
  checkoutConfirmReturn: (orderId: string) => `/api/checkout/${orderId}/confirm-return`,
  userEntitlements: "/api/me/entitlements",
  reportAccess: (reportId: string) => `/api/me/reports/${reportId}/access`,
  premiumRequests: "/api/me/premium-requests",
  premiumRequest: (requestId: string) => `/api/me/premium-requests/${requestId}`,
  dashboardOpsPremiumRequests: (tenantId: string, params?: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) search.set(key, value);
      }
    }
    const query = search.toString();
    return `/api/dashboard/tenants/${tenantId}/ops/premium-requests${query ? `?${query}` : ""}`;
  },
  dashboardOpsPremiumRequest: (tenantId: string, requestId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/premium-requests/${requestId}`,
  dashboardOpsOrderSyncPayment: (tenantId: string, orderId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/orders/${orderId}/sync-payment`,
  dashboardOpsOrderApproveMockPayment: (tenantId: string, orderId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/orders/${orderId}/approve-mock-payment`,
  dashboardOpsOrderSyncReport: (tenantId: string, orderId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/orders/${orderId}/sync-report`,
  dashboardOpsOrderRetryReport: (tenantId: string, orderId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/orders/${orderId}/retry-report`,
  dashboardOpsOrderNeedsReview: (tenantId: string, orderId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/orders/${orderId}/set-needs-review`,
  dashboardOpsEntitlementRevoke: (tenantId: string, orderId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/orders/${orderId}/entitlement/revoke`,
  dashboardOpsEntitlementUnlock: (tenantId: string, orderId: string) =>
    `/api/dashboard/tenants/${tenantId}/ops/orders/${orderId}/entitlement/unlock`,
  publicPartner: (slug: string) => `/api/public/partners/${slug}`,
} as const;
