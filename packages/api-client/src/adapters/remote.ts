import { z } from "zod";
import {
  API_ENDPOINTS,
  ApiClientError,
  ApiErrorCode,
  accountSummarySchema,
  auditLogListSchema,
  checkoutOrderDetailSchema,
  confirmPaymentReturnResponseSchema,
  dashboardMetricsSchema,
  endUserSummarySchema,
  entitlementSchema,
  loginResponseSchema,
  mediaAssetListSchema,
  mediaAssetSchema,
  mediaDeleteResponseSchema,
  orderSchema,
  partnerSchema,
  commissionSchema,
  payoutSchema,
  paymentSchema,
  partnerBalanceSchema,
  ledgerEntrySchema,
  partnerFinanceSchema,
  promoMaterialSchema,
  productEconomicsRowSchema,
  revenueSummarySchema,
  commissionSummarySchema,
  funnelAnalyticsSummarySchema,
  reportAccessCheckSchema,
  startCheckoutResponseSchema,
  tenantHealthSchema,
  validateInitDataResponseSchema,
  dashboardSummarySchema,
  productListSchema,
  productResponseSchema,
  reportListSchema,
  reportResponseSchema,
  reportStatusResponseSchema,
  premiumRequestSchema,
  publicPartnerSchema,
  premiumRequestListSchema,
  tenantConfigResponseSchema,
  tenantConfigStatusResponseSchema,
  tenantListItemSchema,
  tenantListSchema,
  unwrapApiResponse,
  validateOrThrow,
  type ApiResponse,
  type DashboardMetrics,
  type DashboardMetricsPeriod,
  type MediaAsset,
  type MediaKind,
  type AuditLogItem,
  type TenantHealth,
} from "@astro/api-contracts";
import type {
  AccountSummary,
  CreatePremiumRequestInput,
  PartnerDetail,
  PartnerLinkSet,
  ReportStatusResponse,
  UpdatePremiumRequestAdminInput,
} from "@astro/api-contracts";
import { isReportV2, reportV2Schema } from "@astro/tenant-config";
import type { AnyReport } from "@astro/tenant-config";
import type { DashboardStats, TenantConfigBundle, TenantRecord } from "@astro/tenant-config";
import { birthProfileResponseSchema, tenantConfigBundleSchema } from "@astro/tenant-config";
import { assertRemoteConfigured, getApiBaseUrl } from "../config";
import type { ApiAdapter } from "./types";

const entitlementListSchema = { parse: (data: unknown) => z.array(entitlementSchema).parse(data) };
const orderListSchema = { parse: (data: unknown) => z.array(orderSchema).parse(data) };
const partnerListSchema = { parse: (data: unknown) => z.array(partnerSchema).parse(data) };
const paymentListSchema = { parse: (data: unknown) => z.array(paymentSchema).parse(data) };
const balanceListSchema = { parse: (data: unknown) => z.array(partnerBalanceSchema).parse(data) };
const ledgerListSchema = { parse: (data: unknown) => z.array(ledgerEntrySchema).parse(data) };
const commissionListSchema = { parse: (data: unknown) => z.array(commissionSchema).parse(data) };
const payoutListSchema = { parse: (data: unknown) => z.array(payoutSchema).parse(data) };
const promoMaterialListSchema = { parse: (data: unknown) => z.array(promoMaterialSchema).parse(data) };
const productEconomicsListSchema = {
  parse: (data: unknown) => z.array(productEconomicsRowSchema).parse(data),
};

async function remoteRequest<T>(
  path: string,
  init?: RequestInit,
  schema?: { parse: (data: unknown) => T },
  errorCode: ApiErrorCode = ApiErrorCode.UNKNOWN_ERROR
): Promise<T> {
  assertRemoteConfigured();

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;

  if (!body || typeof body !== "object" || !("ok" in body)) {
    throw new ApiClientError(
      ApiErrorCode.UNKNOWN_ERROR,
      `Invalid API response from ${path}`
    );
  }

  if (!res.ok && body.ok === false) {
    throw new ApiClientError(
      body.error.code,
      body.error.message,
      body.error.fieldErrors,
      body.error.details
    );
  }

  if (body.ok === false) {
    throw new ApiClientError(
      body.error.code,
      body.error.message,
      body.error.fieldErrors,
      body.error.details
    );
  }

  const data = unwrapApiResponse(body);
  if (schema) {
    try {
      return schema.parse(data);
    } catch (error) {
      throw new ApiClientError(errorCode, "Response validation failed", undefined, error);
    }
  }
  return data as T;
}

async function remoteRequestRaw<T>(path: string, init?: RequestInit): Promise<T> {
  assertRemoteConfigured();
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!body || typeof body !== "object" || !("ok" in body)) {
    throw new ApiClientError(ApiErrorCode.UNKNOWN_ERROR, `Invalid API response from ${path}`);
  }
  if (body.ok === false) {
    throw new ApiClientError(
      body.error.code,
      body.error.message,
      body.error.fieldErrors,
      body.error.details
    );
  }
  return body.data;
}

function parseAnyReport(data: unknown): AnyReport | undefined {
  const v2 = reportV2Schema.safeParse(data);
  if (v2.success) return v2.data;
  const v1 = reportResponseSchema.safeParse(data);
  if (v1.success) return v1.data;
  return undefined;
}

async function fetchReportStatus(reportId: string): Promise<ReportStatusResponse> {
  const data = await remoteRequestRaw<unknown>(API_ENDPOINTS.report(reportId));
  const report = parseAnyReport(data);
  if (report) {
    const createdAt = isReportV2(report)
      ? (report.createdAt ?? new Date().toISOString())
      : report.generatedAt;
    return {
      id: report.id,
      status: "completed",
      reportType: isReportV2(report) ? report.productType : report.type,
      locale: "ru",
      createdAt,
      completedAt: isReportV2(report) ? report.updatedAt ?? createdAt : report.generatedAt,
      report: report as ReportStatusResponse["report"],
    };
  }
  const parsed = reportStatusResponseSchema.parse(data);
  const nested =
    parsed.report != null ? parseAnyReport(parsed.report) : parsed.report;
  return {
    ...parsed,
    report: (nested ?? null) as ReportStatusResponse["report"],
  };
}

export const remoteAdapter: ApiAdapter = {
  getTenantConfig: (slug, preview) =>
    remoteRequest(API_ENDPOINTS.tenantConfig(slug, preview), undefined, tenantConfigResponseSchema),
  getPublishedTenantConfig: (slug) =>
    remoteRequest(
      API_ENDPOINTS.tenantPublishedConfig(slug),
      undefined,
      tenantConfigResponseSchema.nullable()
    ),
  listTenants: () =>
    remoteRequest(API_ENDPOINTS.dashboardTenants, undefined, tenantListSchema),
  getTenantDetail: (tenantId) =>
    remoteRequest(API_ENDPOINTS.dashboardTenant(tenantId), undefined, tenantListItemSchema),
  getDraftConfig: (tenantId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardTenantDraft(tenantId),
      undefined,
      tenantConfigResponseSchema
    ),
  saveDraftConfig: (tenantId, config) =>
    remoteRequest(
      API_ENDPOINTS.dashboardTenantDraft(tenantId),
      { method: "PUT", body: JSON.stringify(config) },
      tenantConfigResponseSchema
    ),
  publishConfig: (tenantId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardTenantPublish(tenantId),
      { method: "POST" },
      tenantConfigResponseSchema,
      ApiErrorCode.PUBLISH_FAILED
    ),
  createTenant: (input) =>
    remoteRequestRaw<TenantRecord>(API_ENDPOINTS.dashboardTenants, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  setTenantStatus: (tenantId, status) =>
    remoteRequestRaw<TenantRecord>(API_ENDPOINTS.dashboardTenant(tenantId), {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getTenantBundle: (tenantId) =>
    remoteRequestRaw<TenantConfigBundle>(
      `${API_ENDPOINTS.dashboardTenant(tenantId)}/bundle`
    ).then((bundle) => validateOrThrow(tenantConfigBundleSchema, bundle)),
  getPublishedConfig: (tenantId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardTenantPublished(tenantId),
      undefined,
      tenantConfigResponseSchema.nullable()
    ),
  getConfigStatus: (tenantId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardTenantStatus(tenantId),
      undefined,
      tenantConfigStatusResponseSchema
    ),
  restoreDraftFromPublished: (tenantId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardTenantRestoreDraft(tenantId),
      { method: "POST" },
      tenantConfigResponseSchema
    ),
  discardDraftConfig: (tenantId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardTenantDiscardDraft(tenantId),
      { method: "POST" },
      tenantConfigResponseSchema
    ),
  submitBirthProfile: (_tenantId, _userId, profile) =>
    remoteRequest(
      API_ENDPOINTS.birthProfile,
      {
        method: "POST",
        body: JSON.stringify({
          name: profile.name,
          birthDate: profile.birthDate,
          birthTime: profile.birthTime,
          birthPlace: profile.birthPlace,
          topic: profile.topic,
          locale: profile.locale ?? "en",
        }),
      },
      birthProfileResponseSchema
    ),
  getBirthProfile: async () => {
    try {
      return await remoteRequest(
        API_ENDPOINTS.birthProfile,
        undefined,
        birthProfileResponseSchema
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.code === ApiErrorCode.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  },
  generateFreeReport: (_tenantId, options) =>
    remoteRequest(
      API_ENDPOINTS.reportsFree,
      {
        method: "POST",
        body: JSON.stringify({
          tenantSlug: options?.tenantSlug,
          locale: options?.locale ?? "en",
          birthProfile: options?.birthProfile
            ? {
                name: options.birthProfile.name,
                birthDate: options.birthProfile.birthDate,
                birthTime: options.birthProfile.birthTime,
                birthPlace: options.birthProfile.birthPlace,
                topic: options.birthProfile.topic ?? options.topic ?? "relationships",
                locale: options.locale ?? "en",
              }
            : {
                topic: options?.topic ?? "relationships",
                locale: options?.locale ?? "en",
              },
        }),
      },
      reportResponseSchema,
      ApiErrorCode.REPORT_GENERATION_FAILED
    ),
  getReport: async (reportId) => {
    const status = await fetchReportStatus(reportId);
    if (status.status !== "completed" || !status.report) {
      throw new ApiClientError(ApiErrorCode.NOT_FOUND, "Report is not ready");
    }
    const parsed = parseAnyReport(status.report);
    if (!parsed) {
      throw new ApiClientError(ApiErrorCode.NOT_FOUND, "Report payload invalid");
    }
    return parsed;
  },
  getReportStatus: (reportId) => fetchReportStatus(reportId),
  listReports: () =>
    remoteRequest(`${API_ENDPOINTS.reports}`, undefined, reportListSchema),
  getProducts: (slug) =>
    remoteRequest(API_ENDPOINTS.tenantProducts(slug), undefined, productListSchema),
  getProduct: async (slug, productId) => {
    try {
      return await remoteRequest(
        API_ENDPOINTS.tenantProduct(slug, productId),
        undefined,
        productResponseSchema
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.code === ApiErrorCode.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  },
  getDashboardStats: (tenantId) =>
    remoteRequestRaw<DashboardStats>(API_ENDPOINTS.dashboardTenantStats(tenantId)),
  getDashboardSummary: (tenantId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardTenantSummary(tenantId),
      undefined,
      dashboardSummarySchema
    ),
  trackEvent: async (tenantId, name, payload = {}) => {
    const props = payload ?? {};
    const event: Record<string, unknown> = {
      tenantId,
      eventName: name,
      properties: props,
    };
    if (typeof props.tenantSlug === "string") event.tenantSlug = props.tenantSlug;
    if (typeof props.userId === "string") event.userId = props.userId;
    if (typeof props.sessionId === "string") event.sessionId = props.sessionId;
    if (typeof props.timestamp === "string") event.timestamp = props.timestamp;
    await remoteRequestRaw<void>(API_ENDPOINTS.analyticsEvents, {
      method: "POST",
      body: JSON.stringify({ events: [event] }),
    });
  },
  getDashboardMetrics: (tenantId, period = "7d") =>
    remoteRequest(
      API_ENDPOINTS.dashboardTenantMetrics(tenantId, period),
      undefined,
      dashboardMetricsSchema
    ),
  uploadTenantMedia: async (tenantId, file, kind) => {
    assertRemoteConfigured();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.dashboardTenantMedia(tenantId)}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const body = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;
    if (!body || typeof body !== "object" || !("ok" in body)) {
      throw new ApiClientError(ApiErrorCode.UNKNOWN_ERROR, "Invalid upload response");
    }
    if (body.ok === false) {
      throw new ApiClientError(
        body.error.code,
        body.error.message,
        body.error.fieldErrors,
        body.error.details
      );
    }
    return mediaAssetSchema.parse(body.data);
  },
  listTenantMedia: (tenantId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardTenantMedia(tenantId),
      undefined,
      mediaAssetListSchema
    ),
  deleteTenantMedia: (tenantId, assetId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardTenantMediaItem(tenantId, assetId),
      { method: "DELETE" },
      mediaDeleteResponseSchema
    ),
  getTenantHealth: (tenantId) =>
    remoteRequest(API_ENDPOINTS.adminTenantHealth(tenantId), undefined, tenantHealthSchema),
  listAuditLogs: (params) =>
    remoteRequest(API_ENDPOINTS.adminAuditLogs(params), undefined, auditLogListSchema),
  login: async (email, password) => {
    const data = await remoteRequest(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      loginResponseSchema
    );
    return data;
  },
  logout: () => remoteRequestRaw<void>("/auth/logout", { method: "POST" }),
  getCurrentAccount: () =>
    remoteRequest("/auth/me", undefined, accountSummarySchema),
  validateTelegramInitData: async (tenantSlug, initData) => {
    const data = await remoteRequest(
      API_ENDPOINTS.telegramValidateInitData,
      {
        method: "POST",
        body: JSON.stringify({ tenantSlug, initData }),
      },
      validateInitDataResponseSchema
    );
    return data.user;
  },
  getCurrentUser: () => remoteRequest(API_ENDPOINTS.currentUser, undefined, endUserSummarySchema),
  listOrders: (tenantId, params) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsOrders(tenantId, params as Record<string, string | undefined>),
      undefined,
      orderListSchema
    ),
  getOrder: async (tenantId, orderId) => {
    try {
      return await remoteRequest(
        API_ENDPOINTS.dashboardOpsOrder(tenantId, orderId),
        undefined,
        orderSchema
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.code === ApiErrorCode.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  },
  setOrderNotes: async () => {
    throw new ApiClientError(
      ApiErrorCode.REMOTE_API_NOT_CONFIGURED,
      "Order notes endpoint is not configured for remote mode."
    );
  },
  getRevenueSummary: (tenantId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsRevenue(tenantId),
      undefined,
      revenueSummarySchema
    ),
  listPartners: (tenantId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsPartners(tenantId),
      undefined,
      partnerListSchema
    ),
  getPartner: async (tenantId, partnerId) => {
    try {
      return await remoteRequestRaw<PartnerDetail>(
        API_ENDPOINTS.dashboardOpsPartner(tenantId, partnerId)
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.code === ApiErrorCode.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  },
  getPartnerLinkSets: async (tenantId) => {
    const partners = await remoteRequest(
      API_ENDPOINTS.dashboardOpsPartners(tenantId),
      undefined,
      partnerListSchema
    );
    return partners.map(
      (partner): PartnerLinkSet => ({
        partnerId: partner.id,
        partnerName: partner.name,
        partnerSlug: partner.slug,
        general: `/b/${partner.slug}`,
        money: `/b/${partner.slug}/money`,
        relationships: `/b/${partner.slug}/relationships`,
        personality: `/b/${partner.slug}/personality`,
      })
    );
  },
  listCommissions: (tenantId, partnerId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsCommissions(tenantId, partnerId),
      undefined,
      commissionListSchema
    ),
  getCommissionSummary: (tenantId, partnerId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsCommissionSummary(tenantId, partnerId),
      undefined,
      commissionSummarySchema
    ),
  releaseCommission: (tenantId, commissionId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsCommissionRelease(tenantId, commissionId),
      { method: "POST" },
      commissionSchema
    ),
  holdCommission: (tenantId, commissionId, reason) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsCommissionHold(tenantId, commissionId),
      { method: "POST", body: JSON.stringify({ reason }) },
      commissionSchema
    ),
  listPayouts: (tenantId, partnerId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsPayouts(tenantId, partnerId),
      undefined,
      payoutListSchema
    ),
  createPayout: (tenantId, input) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsPayouts(tenantId),
      { method: "POST", body: JSON.stringify(input) },
      payoutSchema
    ),
  updatePayout: async (tenantId, payoutId, update) => {
    try {
      return await remoteRequest(
        API_ENDPOINTS.dashboardOpsPayout(tenantId, payoutId),
        { method: "PATCH", body: JSON.stringify(update) },
        payoutSchema
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.code === ApiErrorCode.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  },
  listPayments: (tenantId, params) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsPayments(tenantId, params),
      undefined,
      paymentListSchema
    ),
  getPayment: async (tenantId, paymentId) => {
    try {
      return await remoteRequest(
        API_ENDPOINTS.dashboardOpsPayment(tenantId, paymentId),
        undefined,
        paymentSchema
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.code === ApiErrorCode.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  },
  listBalances: (tenantId, partnerId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsBalances(tenantId, partnerId),
      undefined,
      balanceListSchema
    ),
  getPartnerBalance: async (tenantId, partnerId, currency = "USD") => {
    try {
      return await remoteRequest(
        API_ENDPOINTS.dashboardOpsBalance(tenantId, partnerId, currency),
        undefined,
        partnerBalanceSchema
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.code === ApiErrorCode.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  },
  createManualAdjustment: (tenantId, partnerId, input) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsBalanceAdjustment(tenantId, partnerId),
      { method: "POST", body: JSON.stringify(input) },
      partnerBalanceSchema
    ),
  listLedger: (tenantId, params) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsLedger(tenantId, params),
      undefined,
      ledgerListSchema
    ),
  getPartnerFinance: async (tenantId, partnerId) => {
    try {
      return await remoteRequest(
        API_ENDPOINTS.dashboardOpsPartnerFinance(tenantId, partnerId),
        undefined,
        partnerFinanceSchema
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.code === ApiErrorCode.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  },
  markOrderRefunded: (tenantId, orderId, input) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsOrderMarkRefunded(tenantId, orderId),
      { method: "POST", body: JSON.stringify(input) },
      z.record(z.unknown())
    ),
  listPromoMaterials: (tenantId, partnerId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsPromoMaterials(tenantId, partnerId),
      undefined,
      promoMaterialListSchema
    ),
  getProductEconomics: (tenantId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsProductEconomics(tenantId),
      undefined,
      productEconomicsListSchema
    ),
  getFunnelAnalytics: (tenantId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsFunnelAnalytics(tenantId),
      undefined,
      funnelAnalyticsSummarySchema
    ),
  startCheckout: (request) =>
    remoteRequest(
      API_ENDPOINTS.checkoutStart,
      { method: "POST", body: JSON.stringify(request) },
      startCheckoutResponseSchema
    ),
  getCheckoutOrder: async (orderId) => {
    try {
      return await remoteRequest(
        API_ENDPOINTS.checkoutOrder(orderId),
        undefined,
        checkoutOrderDetailSchema
      );
    } catch {
      return null;
    }
  },
  confirmPaymentReturn: (orderId, request) =>
    remoteRequest(
      API_ENDPOINTS.checkoutConfirmReturn(orderId),
      { method: "POST", body: JSON.stringify(request) },
      confirmPaymentReturnResponseSchema
    ),
  getUserEntitlements: (options) => {
    const params = new URLSearchParams();
    params.set("tenantId", options.tenantId);
    return remoteRequest(
      `${API_ENDPOINTS.userEntitlements}?${params.toString()}`,
      undefined,
      entitlementListSchema
    );
  },
  checkReportAccess: (tenantId, reportId) => {
    const params = new URLSearchParams();
    params.set("tenantId", tenantId);
    return remoteRequest(
      `${API_ENDPOINTS.reportAccess(reportId)}?${params.toString()}`,
      undefined,
      reportAccessCheckSchema
    );
  },
  syncOrderPayment: (tenantId, orderId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsOrderSyncPayment(tenantId, orderId),
      { method: "POST" },
      orderSchema
    ),
  syncOrderReport: (tenantId, orderId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsOrderSyncReport(tenantId, orderId),
      { method: "POST" },
      orderSchema
    ),
  retryOrderReport: (tenantId, orderId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsOrderRetryReport(tenantId, orderId),
      { method: "POST" },
      orderSchema
    ),
  setOrderNeedsReview: (tenantId, orderId, needsReview = true) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsOrderNeedsReview(tenantId, orderId),
      { method: "POST", body: JSON.stringify({ needsReview }) },
      orderSchema
    ),
  revokeEntitlement: (tenantId, orderId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsEntitlementRevoke(tenantId, orderId),
      { method: "POST" },
      orderSchema
    ),
  unlockEntitlement: (tenantId, orderId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsEntitlementUnlock(tenantId, orderId),
      { method: "POST" },
      orderSchema
    ),
  approveMockPayment: (tenantId, orderId) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsOrderApproveMockPayment(tenantId, orderId),
      { method: "POST" },
      orderSchema
    ),
  resolvePublicPartner: (slug) =>
    remoteRequest(API_ENDPOINTS.publicPartner(slug), undefined, publicPartnerSchema),
  listMyPremiumRequests: (options) => {
    const params = new URLSearchParams();
    params.set("tenantId", options.tenantId);
    return remoteRequest(
      `${API_ENDPOINTS.premiumRequests}?${params.toString()}`,
      undefined,
      premiumRequestListSchema
    );
  },
  getPremiumRequest: async (requestId) => {
    try {
      return await remoteRequest(
        API_ENDPOINTS.premiumRequest(requestId),
        undefined,
        premiumRequestSchema
      );
    } catch {
      return null;
    }
  },
  createPremiumRequest: (input) =>
    remoteRequest(
      API_ENDPOINTS.premiumRequests,
      { method: "POST", body: JSON.stringify(input) },
      premiumRequestSchema
    ),
  listPremiumRequestsForTenant: (tenantId, filters) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsPremiumRequests(tenantId, filters),
      undefined,
      premiumRequestListSchema
    ),
  getPremiumRequestForTenant: async (tenantId, requestId) => {
    try {
      return await remoteRequest(
        API_ENDPOINTS.dashboardOpsPremiumRequest(tenantId, requestId),
        undefined,
        premiumRequestSchema
      );
    } catch {
      return null;
    }
  },
  updatePremiumRequestAdmin: (tenantId, requestId, update) =>
    remoteRequest(
      API_ENDPOINTS.dashboardOpsPremiumRequest(tenantId, requestId),
      { method: "PATCH", body: JSON.stringify(update) },
      premiumRequestSchema
    ),
};
