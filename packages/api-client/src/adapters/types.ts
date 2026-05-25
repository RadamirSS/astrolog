import type {
  AnalyticsEventName,
  AccountSummary,
  AuditLogItem,
  CheckoutOrderDetail,
  Commission,
  CommissionSummary,
  ConfirmPaymentReturnRequest,
  ConfirmPaymentReturnResponse,
  CreatePayoutRequest,
  DashboardMetrics,
  DashboardMetricsPeriod,
  DashboardSummary,
  EndUserSummary,
  Entitlement,
  FunnelAnalyticsSummary,
  LedgerEntry,
  ManualAdjustmentRequest,
  MarkRefundedRequest,
  MediaAsset,
  MediaKind,
  Order,
  OrderListParams,
  Partner,
  PartnerBalance,
  PartnerDetail,
  PartnerFinance,
  PartnerLinkSet,
  Payment,
  Payout,
  ProductEconomicsRow,
  PromoMaterial,
  ReportAccessCheck,
  ReportStatusResponse,
  RevenueSummary,
  StartCheckoutRequest,
  StartCheckoutResponse,
  TenantDetail,
  TenantHealth,
  TenantListItem,
  UpdatePayoutRequest,
  PremiumRequest,
  CreatePremiumRequestInput,
  UpdatePremiumRequestAdminInput,
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

export interface ApiAdapter {
  getTenantConfig(slug: string, preview?: "draft" | "published"): Promise<TenantConfig>;
  getPublishedTenantConfig(slug: string): Promise<TenantConfig | null>;
  listTenants(): Promise<TenantListItem[]>;
  getTenantDetail(tenantId: string): Promise<TenantDetail>;
  getDraftConfig(tenantId: string): Promise<TenantConfig>;
  saveDraftConfig(tenantId: string, config: TenantConfig): Promise<TenantConfig>;
  publishConfig(tenantId: string): Promise<TenantConfig>;
  createTenant(input: {
    slug: string;
    displayName: string;
    preset: ThemePreset;
    ownerEmail?: string;
  }): Promise<TenantRecord>;
  setTenantStatus(
    tenantId: string,
    status: "active" | "paused" | "draft"
  ): Promise<TenantRecord>;
  getTenantBundle(tenantId: string): Promise<TenantConfigBundle>;
  getPublishedConfig(tenantId: string): Promise<TenantConfig | null>;
  getConfigStatus(tenantId: string): Promise<TenantConfigStatus>;
  restoreDraftFromPublished(tenantId: string): Promise<TenantConfig>;
  discardDraftConfig(tenantId: string): Promise<TenantConfig>;
  submitBirthProfile(
    tenantId: string,
    userId: string,
    profile: Omit<BirthProfile, "userId" | "tenantId" | "createdAt"> & { locale?: string }
  ): Promise<BirthProfile>;
  getBirthProfile(tenantId: string, userId: string): Promise<BirthProfile | null>;
  generateFreeReport(
    tenantId: string,
    options?: {
      userId?: string;
      topic?: string;
      locale?: "en" | "ru";
      tenantSlug?: string;
      birthProfile?: BirthProfile;
    }
  ): Promise<AnyReport>;
  getReport(reportId: string): Promise<AnyReport>;
  getReportStatus(reportId: string): Promise<ReportStatusResponse>;
  listReports(options?: { tenantId?: string; userId?: string }): Promise<
    Array<{ id: string; type: Report["type"]; title: string; generatedAt: string }>
  >;
  getProducts(slug: string): Promise<ProductConfig[]>;
  getProduct(slug: string, productId: string): Promise<ProductConfig | null>;
  getDashboardStats(tenantId: string): Promise<DashboardStats>;
  getDashboardSummary(tenantId: string): Promise<DashboardSummary>;
  getDashboardMetrics(
    tenantId: string,
    period?: DashboardMetricsPeriod
  ): Promise<DashboardMetrics>;
  uploadTenantMedia(
    tenantId: string,
    file: File,
    kind: MediaKind
  ): Promise<MediaAsset>;
  listTenantMedia(tenantId: string): Promise<MediaAsset[]>;
  deleteTenantMedia(tenantId: string, assetId: string): Promise<{ deleted: boolean; id: string }>;
  getTenantHealth(tenantId: string): Promise<TenantHealth>;
  listAuditLogs(params?: {
    tenantId?: string;
    action?: string;
    limit?: number;
  }): Promise<AuditLogItem[]>;
  trackEvent(
    tenantId: string,
    name: AnalyticsEventName,
    payload?: Record<string, unknown>
  ): Promise<void>;
  login(email: string, password: string): Promise<{ account: AccountSummary }>;
  logout(): Promise<void>;
  getCurrentAccount(): Promise<AccountSummary>;
  validateTelegramInitData(tenantSlug: string, initData: string): Promise<EndUserSummary>;
  getCurrentUser(): Promise<EndUserSummary>;
  listOrders(tenantId: string, params?: OrderListParams): Promise<Order[]>;
  getOrder(
    tenantId: string,
    orderId: string
  ): Promise<(Order & { adminNotes?: string }) | null>;
  setOrderNotes(tenantId: string, orderId: string, notes: string): Promise<Order | null>;
  getRevenueSummary(tenantId: string): Promise<RevenueSummary>;
  listPartners(tenantId: string): Promise<Partner[]>;
  getPartner(tenantId: string, partnerId: string): Promise<PartnerDetail | null>;
  getPartnerLinkSets(tenantId: string, baseUrl?: string): Promise<PartnerLinkSet[]>;
  listCommissions(tenantId: string, partnerId?: string): Promise<Commission[]>;
  getCommissionSummary(tenantId: string, partnerId?: string): Promise<CommissionSummary>;
  releaseCommission(tenantId: string, commissionId: string): Promise<Commission>;
  holdCommission(tenantId: string, commissionId: string, reason: string): Promise<Commission>;
  listPayouts(tenantId: string, partnerId?: string): Promise<Payout[]>;
  createPayout(tenantId: string, input: CreatePayoutRequest): Promise<Payout>;
  updatePayout(
    tenantId: string,
    payoutId: string,
    update: UpdatePayoutRequest
  ): Promise<Payout | null>;
  listPayments(tenantId: string, params?: { partnerId?: string; status?: string }): Promise<Payment[]>;
  getPayment(tenantId: string, paymentId: string): Promise<Payment | null>;
  listBalances(tenantId: string, partnerId?: string): Promise<PartnerBalance[]>;
  getPartnerBalance(tenantId: string, partnerId: string, currency?: string): Promise<PartnerBalance | null>;
  createManualAdjustment(
    tenantId: string,
    partnerId: string,
    input: ManualAdjustmentRequest
  ): Promise<PartnerBalance>;
  listLedger(
    tenantId: string,
    params?: {
      partnerId?: string;
      type?: string;
      currency?: string;
      orderId?: string;
      paymentId?: string;
      payoutId?: string;
    }
  ): Promise<LedgerEntry[]>;
  getPartnerFinance(tenantId: string, partnerId: string): Promise<PartnerFinance | null>;
  markOrderRefunded(tenantId: string, orderId: string, input: MarkRefundedRequest): Promise<unknown>;
  listPromoMaterials(tenantId: string, partnerId?: string): Promise<PromoMaterial[]>;
  getProductEconomics(tenantId: string): Promise<ProductEconomicsRow[]>;
  getFunnelAnalytics(tenantId: string): Promise<FunnelAnalyticsSummary>;
  startCheckout(request: StartCheckoutRequest): Promise<StartCheckoutResponse>;
  getCheckoutOrder(orderId: string): Promise<CheckoutOrderDetail | null>;
  confirmPaymentReturn(
    orderId: string,
    request: ConfirmPaymentReturnRequest
  ): Promise<ConfirmPaymentReturnResponse>;
  getUserEntitlements(options: {
    tenantId: string;
    userId?: string;
    sessionId?: string;
  }): Promise<Entitlement[]>;
  checkReportAccess(
    tenantId: string,
    reportId: string,
    options: { userId?: string; sessionId?: string }
  ): Promise<ReportAccessCheck>;
  syncOrderPayment(tenantId: string, orderId: string): Promise<Order | null>;
  syncOrderReport(tenantId: string, orderId: string): Promise<Order | null>;
  retryOrderReport(tenantId: string, orderId: string): Promise<Order | null>;
  setOrderNeedsReview(tenantId: string, orderId: string, needsReview?: boolean): Promise<Order | null>;
  revokeEntitlement(tenantId: string, orderId: string): Promise<Order | null>;
  unlockEntitlement(tenantId: string, orderId: string): Promise<Order | null>;
  approveMockPayment(tenantId: string, orderId: string): Promise<Order | null>;
  resolvePublicPartner(slug: string): Promise<import("@astro/api-contracts").PublicPartner>;
  listMyPremiumRequests(options: {
    tenantId: string;
    userId?: string;
    sessionId?: string;
  }): Promise<PremiumRequest[]>;
  getPremiumRequest(requestId: string): Promise<PremiumRequest | null>;
  getPremiumRequestForTenant(
    tenantId: string,
    requestId: string
  ): Promise<PremiumRequest | null>;
  createPremiumRequest(
    input: CreatePremiumRequestInput & { userId?: string; sessionId?: string }
  ): Promise<PremiumRequest>;
  listPremiumRequestsForTenant(
    tenantId: string,
    filters?: { status?: import("@astro/api-contracts").PremiumRequestStatus; topic?: string }
  ): Promise<PremiumRequest[]>;
  updatePremiumRequestAdmin(
    tenantId: string,
    requestId: string,
    update: UpdatePremiumRequestAdminInput
  ): Promise<PremiumRequest | null>;
}
