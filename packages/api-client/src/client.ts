import type {
  AnalyticsEventName,
  AuditLogItem,
  DashboardMetrics,
  DashboardSummary,
  TenantDetail,
  TenantHealth,
  TenantListItem,
} from "@astro/api-contracts";
import type {
  BirthProfile,
  DashboardStats,
  ProductConfig,
  AnyReport,
  Report,
  TenantConfig,
  TenantConfigBundle,
  TenantConfigStatus,
  TenantRecord,
  ThemePreset,
} from "@astro/tenant-config";
import { getApiMode } from "./config";
import { mockAdapter } from "./adapters/mock";
import { remoteAdapter } from "./adapters/remote";
import type { ApiAdapter } from "./adapters/types";

function getAdapter(): ApiAdapter {
  return getApiMode() === "mock" ? mockAdapter : remoteAdapter;
}

export { getAdapter };

export async function getTenantConfig(
  slug: string,
  preview: "draft" | "published" = "published"
): Promise<TenantConfig> {
  return getAdapter().getTenantConfig(slug, preview);
}

export async function getPublishedTenantConfig(slug: string): Promise<TenantConfig | null> {
  return getAdapter().getPublishedTenantConfig(slug);
}

export async function listTenants(): Promise<TenantListItem[]> {
  return getAdapter().listTenants();
}

export async function getTenantDetail(tenantId: string): Promise<TenantDetail> {
  return getAdapter().getTenantDetail(tenantId);
}

export async function getDraftConfig(tenantId: string): Promise<TenantConfig> {
  return getAdapter().getDraftConfig(tenantId);
}

export async function saveDraftConfig(
  tenantId: string,
  config: TenantConfig
): Promise<TenantConfig> {
  return getAdapter().saveDraftConfig(tenantId, config);
}

export async function publishConfig(tenantId: string): Promise<TenantConfig> {
  return getAdapter().publishConfig(tenantId);
}

export async function createTenant(input: {
  slug: string;
  displayName: string;
  preset: ThemePreset;
  ownerEmail?: string;
}): Promise<TenantRecord> {
  return getAdapter().createTenant(input);
}

export async function setTenantStatus(
  tenantId: string,
  status: "active" | "paused" | "draft"
): Promise<TenantRecord> {
  return getAdapter().setTenantStatus(tenantId, status);
}

export async function getTenantBundle(tenantId: string): Promise<TenantConfigBundle> {
  return getAdapter().getTenantBundle(tenantId);
}

export async function getPublishedConfig(tenantId: string): Promise<TenantConfig | null> {
  return getAdapter().getPublishedConfig(tenantId);
}

export async function getConfigStatus(tenantId: string): Promise<TenantConfigStatus> {
  return getAdapter().getConfigStatus(tenantId);
}

export async function restoreDraftFromPublished(tenantId: string): Promise<TenantConfig> {
  return getAdapter().restoreDraftFromPublished(tenantId);
}

export async function discardDraftConfig(tenantId: string): Promise<TenantConfig> {
  return getAdapter().discardDraftConfig(tenantId);
}

export async function submitBirthProfile(
  tenantId: string,
  userId: string,
  profile: Omit<BirthProfile, "userId" | "tenantId" | "createdAt"> & { locale?: string }
): Promise<BirthProfile> {
  return getAdapter().submitBirthProfile(tenantId, userId, profile);
}

export async function getBirthProfile(
  tenantId: string,
  userId: string
): Promise<BirthProfile | null> {
  return getAdapter().getBirthProfile(tenantId, userId);
}

export async function generateFreeReport(
  tenantId: string,
  options?: {
    userId?: string;
    topic?: string;
    locale?: "en" | "ru";
    tenantSlug?: string;
    birthProfile?: BirthProfile;
  }
): Promise<AnyReport> {
  return getAdapter().generateFreeReport(tenantId, options);
}

export async function getReport(reportId: string): Promise<AnyReport> {
  return getAdapter().getReport(reportId);
}

export async function getReportStatus(reportId: string) {
  return getAdapter().getReportStatus(reportId);
}

export async function listReports(options?: {
  tenantId?: string;
  userId?: string;
}): Promise<Array<{ id: string; type: Report["type"]; title: string; generatedAt: string }>> {
  return getAdapter().listReports(options);
}

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  return getAdapter().getDashboardStats(tenantId);
}

export async function trackEvent(
  tenantId: string,
  name: AnalyticsEventName,
  payload?: Record<string, unknown>
): Promise<void> {
  return getAdapter().trackEvent(tenantId, name, payload);
}

export async function getTenants(): Promise<TenantListItem[]> {
  return listTenants();
}

export async function getProducts(slug: string): Promise<ProductConfig[]> {
  return getAdapter().getProducts(slug);
}

export async function getProduct(
  slug: string,
  productId: string
): Promise<ProductConfig | null> {
  return getAdapter().getProduct(slug, productId);
}

export async function getDashboardSummary(tenantId: string): Promise<DashboardSummary> {
  return getAdapter().getDashboardSummary(tenantId);
}

export async function getDashboardMetrics(
  tenantId: string,
  period: import("@astro/api-contracts").DashboardMetricsPeriod = "7d"
) {
  return getAdapter().getDashboardMetrics(tenantId, period);
}

export async function uploadTenantMedia(
  tenantId: string,
  file: File,
  kind: import("@astro/api-contracts").MediaKind
) {
  return getAdapter().uploadTenantMedia(tenantId, file, kind);
}

export async function listTenantMedia(tenantId: string) {
  return getAdapter().listTenantMedia(tenantId);
}

export async function deleteTenantMedia(tenantId: string, assetId: string) {
  return getAdapter().deleteTenantMedia(tenantId, assetId);
}

export async function getTenantHealth(tenantId: string) {
  return getAdapter().getTenantHealth(tenantId);
}

export async function listAuditLogs(params?: {
  tenantId?: string;
  action?: string;
  limit?: number;
}) {
  return getAdapter().listAuditLogs(params);
}

export async function login(email: string, password: string) {
  return getAdapter().login(email, password);
}

export async function logout() {
  return getAdapter().logout();
}

export async function getCurrentAccount() {
  return getAdapter().getCurrentAccount();
}

export async function validateTelegramInitData(tenantSlug: string, initData: string) {
  return getAdapter().validateTelegramInitData(tenantSlug, initData);
}

export async function getCurrentUser() {
  return getAdapter().getCurrentUser();
}

export async function listOrders(tenantId: string, params?: import("@astro/api-contracts").OrderListParams) {
  return getAdapter().listOrders(tenantId, params);
}

export async function getOrder(tenantId: string, orderId: string) {
  return getAdapter().getOrder(tenantId, orderId);
}

export async function setOrderNotes(tenantId: string, orderId: string, notes: string) {
  return getAdapter().setOrderNotes(tenantId, orderId, notes);
}

export async function getRevenueSummary(tenantId: string) {
  return getAdapter().getRevenueSummary(tenantId);
}

export async function listPartners(tenantId: string) {
  return getAdapter().listPartners(tenantId);
}

export async function getPartner(tenantId: string, partnerId: string) {
  return getAdapter().getPartner(tenantId, partnerId);
}

export async function getPartnerLinkSets(tenantId: string, baseUrl?: string) {
  return getAdapter().getPartnerLinkSets(tenantId, baseUrl);
}

export async function listCommissions(tenantId: string, partnerId?: string) {
  return getAdapter().listCommissions(tenantId, partnerId);
}

export async function getCommissionSummary(tenantId: string, partnerId?: string) {
  return getAdapter().getCommissionSummary(tenantId, partnerId);
}

export async function releaseCommission(tenantId: string, commissionId: string) {
  return getAdapter().releaseCommission(tenantId, commissionId);
}

export async function holdCommission(tenantId: string, commissionId: string, reason: string) {
  return getAdapter().holdCommission(tenantId, commissionId, reason);
}

export async function listPayouts(tenantId: string, partnerId?: string) {
  return getAdapter().listPayouts(tenantId, partnerId);
}

export async function createPayout(
  tenantId: string,
  input: import("@astro/api-contracts").CreatePayoutRequest
) {
  return getAdapter().createPayout(tenantId, input);
}

export async function updatePayout(
  tenantId: string,
  payoutId: string,
  update: import("@astro/api-contracts").UpdatePayoutRequest
) {
  return getAdapter().updatePayout(tenantId, payoutId, update);
}

export async function listPayments(
  tenantId: string,
  params?: { partnerId?: string; status?: string }
) {
  return getAdapter().listPayments(tenantId, params);
}

export async function getPayment(tenantId: string, paymentId: string) {
  return getAdapter().getPayment(tenantId, paymentId);
}

export async function listBalances(tenantId: string, partnerId?: string) {
  return getAdapter().listBalances(tenantId, partnerId);
}

export async function getPartnerBalance(
  tenantId: string,
  partnerId: string,
  currency = "USD"
) {
  return getAdapter().getPartnerBalance(tenantId, partnerId, currency);
}

export async function createManualAdjustment(
  tenantId: string,
  partnerId: string,
  input: import("@astro/api-contracts").ManualAdjustmentRequest
) {
  return getAdapter().createManualAdjustment(tenantId, partnerId, input);
}

export async function listLedger(
  tenantId: string,
  params?: {
    partnerId?: string;
    type?: string;
    currency?: string;
    orderId?: string;
    paymentId?: string;
    payoutId?: string;
  }
) {
  return getAdapter().listLedger(tenantId, params);
}

export async function getPartnerFinance(tenantId: string, partnerId: string) {
  return getAdapter().getPartnerFinance(tenantId, partnerId);
}

export async function markOrderRefunded(
  tenantId: string,
  orderId: string,
  input: import("@astro/api-contracts").MarkRefundedRequest
) {
  return getAdapter().markOrderRefunded(tenantId, orderId, input);
}

export async function listPromoMaterials(tenantId: string, partnerId?: string) {
  return getAdapter().listPromoMaterials(tenantId, partnerId);
}

export async function getProductEconomics(tenantId: string) {
  return getAdapter().getProductEconomics(tenantId);
}

export async function getFunnelAnalytics(tenantId: string) {
  return getAdapter().getFunnelAnalytics(tenantId);
}

export async function startCheckout(
  request: import("@astro/api-contracts").StartCheckoutRequest
) {
  return getAdapter().startCheckout(request);
}

export async function getCheckoutOrder(orderId: string) {
  return getAdapter().getCheckoutOrder(orderId);
}

export async function confirmPaymentReturn(
  orderId: string,
  request: import("@astro/api-contracts").ConfirmPaymentReturnRequest
) {
  return getAdapter().confirmPaymentReturn(orderId, request);
}

export async function getUserEntitlements(options: {
  tenantId: string;
  userId?: string;
  sessionId?: string;
}) {
  return getAdapter().getUserEntitlements(options);
}

export async function checkReportAccess(
  tenantId: string,
  reportId: string,
  options: { userId?: string; sessionId?: string }
) {
  return getAdapter().checkReportAccess(tenantId, reportId, options);
}

export async function syncOrderPayment(tenantId: string, orderId: string) {
  return getAdapter().syncOrderPayment(tenantId, orderId);
}

export async function syncOrderReport(tenantId: string, orderId: string) {
  return getAdapter().syncOrderReport(tenantId, orderId);
}

export async function retryOrderReport(tenantId: string, orderId: string) {
  return getAdapter().retryOrderReport(tenantId, orderId);
}

export async function setOrderNeedsReview(
  tenantId: string,
  orderId: string,
  needsReview = true
) {
  return getAdapter().setOrderNeedsReview(tenantId, orderId, needsReview);
}

export async function revokeEntitlement(tenantId: string, orderId: string) {
  return getAdapter().revokeEntitlement(tenantId, orderId);
}

export async function unlockEntitlement(tenantId: string, orderId: string) {
  return getAdapter().unlockEntitlement(tenantId, orderId);
}

export async function approveMockPayment(tenantId: string, orderId: string) {
  return getAdapter().approveMockPayment(tenantId, orderId);
}

export async function resolvePublicPartner(slug: string) {
  return getAdapter().resolvePublicPartner(slug);
}

export async function listMyPremiumRequests(options: {
  tenantId: string;
  userId?: string;
  sessionId?: string;
}) {
  return getAdapter().listMyPremiumRequests(options);
}

export async function getPremiumRequest(requestId: string) {
  return getAdapter().getPremiumRequest(requestId);
}

export async function createPremiumRequest(
  input: import("@astro/api-contracts").CreatePremiumRequestInput & {
    userId?: string;
    sessionId?: string;
  }
) {
  return getAdapter().createPremiumRequest(input);
}

export async function listPremiumRequestsForTenant(
  tenantId: string,
  filters?: { status?: import("@astro/api-contracts").PremiumRequestStatus; topic?: string }
) {
  return getAdapter().listPremiumRequestsForTenant(tenantId, filters);
}

export async function getPremiumRequestForTenant(tenantId: string, requestId: string) {
  return getAdapter().getPremiumRequestForTenant(tenantId, requestId);
}

export async function updatePremiumRequestAdmin(
  tenantId: string,
  requestId: string,
  update: import("@astro/api-contracts").UpdatePremiumRequestAdminInput
) {
  return getAdapter().updatePremiumRequestAdmin(tenantId, requestId, update);
}

export async function saveBirthProfile(
  tenantId: string,
  userId: string,
  profile: Omit<BirthProfile, "userId" | "tenantId" | "createdAt"> & { locale?: string }
): Promise<BirthProfile> {
  return submitBirthProfile(tenantId, userId, profile);
}

export type {
  PremiumRequest,
  PremiumRequestStatus,
  PremiumTopic,
  CreatePremiumRequestInput,
  UpdatePremiumRequestAdminInput,
} from "@astro/api-contracts";

export type {
  AnalyticsEventName,
  AuditLogItem,
  BirthProfile,
  DashboardMetrics,
  DashboardStats,
  DashboardSummary,
  Report,
  TenantConfig,
  TenantConfigBundle,
  TenantConfigStatus,
  TenantDetail,
  TenantHealth,
  TenantListItem,
  TenantRecord,
  ThemePreset,
};

export {
  ApiClientError,
  ApiErrorCode,
  type ApiResponse,
  type ApiSuccess,
  type ApiFailure,
} from "@astro/api-contracts";
