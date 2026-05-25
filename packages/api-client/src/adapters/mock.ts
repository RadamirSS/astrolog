import { ApiClientError, ApiErrorCode, toApiClientError } from "@astro/api-contracts";
import {
  mockCreateTenant,
  mockDiscardDraftConfig,
  mockGenerateFreeReport,
  mockGetBirthProfile,
  mockGetConfigStatus,
  mockGetDashboardStats,
  mockGetDashboardSummary,
  mockGetDashboardMetrics,
  mockUploadTenantMedia,
  mockListTenantMedia,
  mockDeleteTenantMedia,
  mockGetTenantHealth,
  mockListAuditLogs,
  mockGetDraftConfig,
  mockGetProductById,
  mockGetProducts,
  mockGetPublishedConfig,
  mockGetPublishedTenantConfigBySlug,
  mockGetReport,
  mockGetTenantBundle,
  mockGetTenantConfigBySlug,
  mockGetTenantDetail,
  mockListReports,
  mockListTenants,
  mockPublishConfig,
  mockRestoreDraftFromPublished,
  mockSaveDraftConfig,
  mockSetTenantStatus,
  mockSubmitBirthProfile,
  mockTrackEvents,
  mockListOrders,
  mockGetOrder,
  mockSetOrderNotes,
  mockGetRevenueSummary,
  mockListPartners,
  mockGetPartner,
  mockGetPartnerLinkSets,
  mockListCommissions,
  mockGetCommissionSummary,
  mockListPayouts,
  mockUpdatePayout,
  mockListPayments,
  mockGetPayment,
  mockListBalances,
  mockGetPartnerBalance,
  mockListLedger,
  mockCreatePayout,
  mockGetPartnerFinance,
  mockReleaseCommission,
  mockHoldCommission,
  mockListPromoMaterials,
  mockGetProductEconomics,
  mockGetFunnelAnalytics,
} from "@astro/mock-api";
import type { ApiAdapter } from "./types";
import { isReportV2 } from "@astro/tenant-config";
import {
  checkReportAccess,
  confirmPaymentReturn,
  getCheckoutOrder,
  getPaidReport,
  getUserEntitlements,
  retryOrderReport,
  revokeEntitlement,
  setOrderNeedsReview,
  startCheckout,
  syncOrderPayment,
  syncOrderReport,
  unlockEntitlement,
} from "../services/order-lifecycle";
import {
  createPremiumRequest,
  getPremiumRequest,
  listMyPremiumRequests,
  listPremiumRequestsForTenant,
  updatePremiumRequestAdmin,
} from "../services/premium-requests";

async function wrap<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw toApiClientError(error);
  }
}

export const mockAdapter: ApiAdapter = {
  getTenantConfig: (slug, preview) => wrap(() => mockGetTenantConfigBySlug(slug, preview)),
  getPublishedTenantConfig: (slug) => wrap(() => mockGetPublishedTenantConfigBySlug(slug)),
  listTenants: () => wrap(() => mockListTenants()),
  getTenantDetail: (tenantId) => wrap(() => mockGetTenantDetail(tenantId)),
  getDraftConfig: (tenantId) => wrap(() => mockGetDraftConfig(tenantId)),
  saveDraftConfig: (tenantId, config) => wrap(() => mockSaveDraftConfig(tenantId, config)),
  publishConfig: (tenantId) => wrap(() => mockPublishConfig(tenantId)),
  createTenant: (input) => wrap(() => mockCreateTenant(input)),
  setTenantStatus: (tenantId, status) => wrap(() => mockSetTenantStatus(tenantId, status)),
  getTenantBundle: (tenantId) => wrap(() => mockGetTenantBundle(tenantId)),
  getPublishedConfig: (tenantId) => wrap(() => mockGetPublishedConfig(tenantId)),
  getConfigStatus: (tenantId) => wrap(() => mockGetConfigStatus(tenantId)),
  restoreDraftFromPublished: (tenantId) => wrap(() => mockRestoreDraftFromPublished(tenantId)),
  discardDraftConfig: (tenantId) => wrap(() => mockDiscardDraftConfig(tenantId)),
  submitBirthProfile: (tenantId, userId, profile) =>
    wrap(() => mockSubmitBirthProfile(tenantId, userId, profile)),
  getBirthProfile: (tenantId, userId) => wrap(() => mockGetBirthProfile(tenantId, userId)),
  generateFreeReport: (tenantId, options) => wrap(() => mockGenerateFreeReport(tenantId, options)),
  getReport: async (reportId) => {
    const paid = getPaidReport(reportId);
    if (paid) return paid;
    return wrap(() => mockGetReport(reportId));
  },
  getReportStatus: async (reportId) => {
    const report = await wrap(() => mockGetReport(reportId));
    const createdAt = isReportV2(report)
      ? report.createdAt ?? new Date().toISOString()
      : report.generatedAt;
    return {
      id: report.id,
      status: "completed" as const,
      reportType: isReportV2(report) ? report.productType : report.type,
      locale: "ru",
      createdAt,
      completedAt: createdAt,
      report: isReportV2(report) ? undefined : report,
    };
  },
  listReports: async (options) => {
    const items = await wrap(() => mockListReports(options));
    return items.map((item) => ({
      ...item,
      type: item.type as "free" | "natal" | "compatibility" | "forecast" | "custom",
    }));
  },
  getProducts: (slug) => wrap(() => mockGetProducts(slug)),
  getProduct: (slug, productId) => wrap(() => mockGetProductById(slug, productId)),
  getDashboardStats: (tenantId) => wrap(() => mockGetDashboardStats(tenantId)),
  getDashboardSummary: (tenantId) => wrap(() => mockGetDashboardSummary(tenantId)),
  getDashboardMetrics: (tenantId, period) => wrap(() => mockGetDashboardMetrics(tenantId, period)),
  uploadTenantMedia: (tenantId, file, kind) =>
    wrap(() => mockUploadTenantMedia(tenantId, file, kind)),
  listTenantMedia: (tenantId) => wrap(() => mockListTenantMedia(tenantId)),
  deleteTenantMedia: (tenantId, assetId) => wrap(() => mockDeleteTenantMedia(tenantId, assetId)),
  getTenantHealth: (tenantId) => wrap(() => mockGetTenantHealth(tenantId)),
  listAuditLogs: (params) => wrap(() => mockListAuditLogs(params)),
  trackEvent: async (tenantId, name, payload) => {
    await wrap(() => mockTrackEvents([{ tenantId, name, payload }]));
  },
  login: async () => ({
    account: { id: "mock_admin", email: "admin@astro.local", role: "platform_owner" },
  }),
  logout: async () => {},
  getCurrentAccount: async () => ({
    id: "mock_admin",
    email: "admin@astro.local",
    role: "platform_owner",
  }),
  validateTelegramInitData: async (tenantSlug, initData) => ({
    id: `mock_user_${tenantSlug}`,
    tenantId: `tenant_${tenantSlug}`,
    telegramId: "123456789",
    telegramUsername: "mockuser",
    firstName: "Mock",
    lastName: "User",
    languageCode: "en",
  }),
  getCurrentUser: async () => ({
    id: "mock_user_session",
    tenantId: "tenant_mystic",
    telegramId: "123456789",
    telegramUsername: "mockuser",
    firstName: "Mock",
    lastName: "User",
    languageCode: "en",
  }),
  listOrders: (tenantId, params) => wrap(() => mockListOrders(tenantId, params)),
  getOrder: (tenantId, orderId) => wrap(() => mockGetOrder(tenantId, orderId)),
  setOrderNotes: (tenantId, orderId, notes) =>
    wrap(() => mockSetOrderNotes(tenantId, orderId, notes)),
  getRevenueSummary: (tenantId) => wrap(() => mockGetRevenueSummary(tenantId)),
  listPartners: (tenantId) => wrap(() => mockListPartners(tenantId)),
  getPartner: (tenantId, partnerId) => wrap(() => mockGetPartner(tenantId, partnerId)),
  getPartnerLinkSets: (tenantId, baseUrl) =>
    wrap(() => mockGetPartnerLinkSets(tenantId, baseUrl)),
  listCommissions: (tenantId, partnerId) =>
    wrap(() => mockListCommissions(tenantId).then((rows) =>
      partnerId ? rows.filter((c) => c.partnerId === partnerId) : rows
    )),
  getCommissionSummary: (tenantId, partnerId) =>
    wrap(async () => {
      const summary = await mockGetCommissionSummary(tenantId);
      if (!partnerId) return summary;
      const commissions = await mockListCommissions(tenantId);
      const filtered = commissions.filter((c) => c.partnerId === partnerId);
      const sum = (status: string) =>
        filtered.filter((c) => c.status === status).reduce((s, c) => s + c.commissionAmount, 0);
      return {
        pending: sum("pending"),
        available: sum("available"),
        onHold: sum("on_hold"),
        approved: sum("approved"),
        paid: sum("paid"),
        adjusted: sum("adjusted"),
        cancelled: sum("cancelled"),
      };
    }),
  releaseCommission: (tenantId, commissionId) =>
    wrap(() => mockReleaseCommission(tenantId, commissionId).then((c) => {
      if (!c) throw new ApiClientError(ApiErrorCode.NOT_FOUND, "Commission not found");
      return c;
    })),
  holdCommission: (tenantId, commissionId, reason) =>
    wrap(() => mockHoldCommission(tenantId, commissionId, reason).then((c) => {
      if (!c) throw new ApiClientError(ApiErrorCode.NOT_FOUND, "Commission not found");
      return c;
    })),
  listPayouts: (tenantId, partnerId) =>
    wrap(() => mockListPayouts(tenantId).then((rows) =>
      partnerId ? rows.filter((p) => p.partnerId === partnerId) : rows
    )),
  createPayout: (tenantId, input) => wrap(() => mockCreatePayout(tenantId, input)),
  updatePayout: (tenantId, payoutId, update) =>
    wrap(() => mockUpdatePayout(tenantId, payoutId, update)),
  listPayments: (tenantId, params) =>
    wrap(() => mockListPayments(tenantId, params?.partnerId)),
  getPayment: (tenantId, paymentId) => wrap(() => mockGetPayment(tenantId, paymentId)),
  listBalances: (tenantId, partnerId) => wrap(() => mockListBalances(tenantId, partnerId)),
  getPartnerBalance: (tenantId, partnerId, currency) =>
    wrap(() => mockGetPartnerBalance(tenantId, partnerId, currency)),
  createManualAdjustment: async (tenantId, partnerId, input) => {
    const balances = await mockListBalances(tenantId, partnerId);
    const current = balances.find((b) => b.currency === (input.currency ?? "USD"));
    if (!current) throw new ApiClientError(ApiErrorCode.NOT_FOUND, "Balance not found");
    return {
      ...current,
      availableBalance: current.availableBalance + input.amount,
      adjustedTotal: current.adjustedTotal + Math.abs(input.amount),
    };
  },
  listLedger: (tenantId, params) => wrap(() => mockListLedger(tenantId, params)),
  getPartnerFinance: (tenantId, partnerId) =>
    wrap(() => mockGetPartnerFinance(tenantId, partnerId)),
  markOrderRefunded: async (tenantId, orderId, input) => ({ orderId, status: "refunded", reason: input.reason }),
  listPromoMaterials: (tenantId, partnerId) =>
    wrap(() => mockListPromoMaterials(tenantId, partnerId)),
  getProductEconomics: (tenantId) => wrap(() => mockGetProductEconomics(tenantId)),
  getFunnelAnalytics: (tenantId) => wrap(() => mockGetFunnelAnalytics(tenantId)),
  startCheckout: (request) => wrap(() => startCheckout(request)),
  getCheckoutOrder: (orderId) => wrap(() => getCheckoutOrder(orderId)),
  confirmPaymentReturn: (orderId, request) =>
    wrap(() => confirmPaymentReturn(orderId, request)),
  getUserEntitlements: (options) => wrap(() => getUserEntitlements(options)),
  checkReportAccess: (tenantId, reportId, options) =>
    wrap(() => checkReportAccess(tenantId, reportId, options)),
  syncOrderPayment: (tenantId, orderId) => wrap(() => syncOrderPayment(tenantId, orderId)),
  syncOrderReport: (tenantId, orderId) => wrap(() => syncOrderReport(tenantId, orderId)),
  retryOrderReport: (tenantId, orderId) => wrap(() => retryOrderReport(tenantId, orderId)),
  setOrderNeedsReview: (tenantId, orderId, needsReview) =>
    wrap(() => setOrderNeedsReview(tenantId, orderId, needsReview)),
  revokeEntitlement: (tenantId, orderId) => wrap(() => revokeEntitlement(tenantId, orderId)),
  unlockEntitlement: (tenantId, orderId) => wrap(() => unlockEntitlement(tenantId, orderId)),
  approveMockPayment: (tenantId, orderId) => wrap(() => syncOrderPayment(tenantId, orderId)),
  resolvePublicPartner: (slug) =>
    wrap(async () => {
      const { resolvePublicPartnerConfig } = await import("@astro/mock-api");
      const partner = resolvePublicPartnerConfig(slug);
      if (!partner) {
        throw new ApiClientError(ApiErrorCode.NOT_FOUND, "Partner not found");
      }
      return partner;
    }),
  listMyPremiumRequests: (options) => wrap(() => listMyPremiumRequests(options)),
  getPremiumRequest: (requestId) => wrap(() => getPremiumRequest(requestId)),
  getPremiumRequestForTenant: (tenantId, requestId) =>
    wrap(async () => {
      const req = await getPremiumRequest(requestId);
      return req && req.tenantId === tenantId ? req : null;
    }),
  createPremiumRequest: (input) => wrap(() => createPremiumRequest(input)),
  listPremiumRequestsForTenant: (tenantId, filters) =>
    wrap(() => listPremiumRequestsForTenant(tenantId, filters)),
  updatePremiumRequestAdmin: (tenantId, requestId, update) =>
    wrap(() => updatePremiumRequestAdmin(tenantId, requestId, update)),
};
