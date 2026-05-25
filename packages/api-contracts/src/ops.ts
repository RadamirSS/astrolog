import { z } from "zod";

export const entitlementStatusSchema = z.enum([
  "locked",
  "pending_payment",
  "paid_generating",
  "ready",
  "failed",
  "revoked",
]);

export const orderStatusSchema = z.enum([
  "created",
  "payment_pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "expired",
]);

export const reportStatusOpsSchema = z.enum([
  "draft",
  "queued",
  "generating",
  "ready",
  "failed",
  "locked",
  "paid_pending",
]);

export const partnerStatusSchema = z.enum(["active", "paused", "pending", "blocked"]);

export const commissionStatusSchema = z.enum([
  "pending",
  "available",
  "on_hold",
  "approved",
  "paid",
  "cancelled",
  "adjusted",
]);

export const payoutStatusSchema = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "processing",
  "paid",
  "failed",
  "cancelled",
]);

export const paymentStatusSchema = z.enum([
  "created",
  "pending",
  "paid",
  "failed",
  "cancelled",
  "expired",
  "refunded",
  "partially_refunded",
  "chargeback",
]);

export const ledgerEntryTypeSchema = z.enum([
  "payment_received",
  "provider_fee",
  "platform_revenue",
  "partner_commission_pending",
  "partner_commission_available",
  "partner_commission_hold",
  "partner_commission_cancelled",
  "partner_commission_adjusted",
  "refund",
  "chargeback",
  "manual_adjustment",
  "payout_created",
  "payout_approved",
  "payout_paid",
  "payout_failed",
  "payout_cancelled",
]);

export const ledgerDirectionSchema = z.enum(["credit", "debit"]);

export const ledgerEntryStatusSchema = z.enum(["pending", "posted", "voided", "reversed"]);

export const payoutMethodTypeSchema = z.enum([
  "manual",
  "bank_transfer",
  "paypal",
  "crypto_usdt",
  "other",
]);

export const promoMaterialTypeSchema = z.enum([
  "story_text",
  "post_text",
  "cta",
  "link",
  "qr_placeholder",
]);

export const funnelStageSchema = z.enum([
  "landing_viewed",
  "topic_selected",
  "birth_form_completed",
  "free_report_viewed",
  "paywall_viewed",
  "product_viewed",
  "checkout_started",
  "payment_paid",
  "paid_report_ready",
]);

export const realProductTypeSchema = z.enum([
  "free_report",
  "low_ticket_money",
  "low_ticket_relationships",
  "low_ticket_personality",
  "bundle_all_topics",
  "main_natal_portrait",
  "premium_consultation",
]);

export const funnelTopicSchema = z.enum(["money", "relationships", "personality"]);

export const visualPackSchema = z.enum([
  "sky_clarity",
  "cosmic_pastel",
  "pink_love",
  "dark_gold_mystic",
  "brand_default",
]);

export const attributionSchema = z.object({
  partnerId: z.string().optional(),
  partnerSlug: z.string().optional(),
  campaignId: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  firstTouchAt: z.string().optional(),
  lastTouchAt: z.string().optional(),
  clickId: z.string().optional(),
});

export const orderSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  productType: realProductTypeSchema,
  productTitle: z.string(),
  theme: funnelTopicSchema.optional(),
  amount: z.number(),
  currency: z.string(),
  status: orderStatusSchema,
  paymentStatus: orderStatusSchema,
  reportStatus: reportStatusOpsSchema,
  partnerId: z.string().optional(),
  partnerSlug: z.string().optional(),
  campaignId: z.string().optional(),
  paymentProviderId: z.string().optional(),
  externalPaymentId: z.string().optional(),
  externalReportId: z.string().optional(),
  entitlementId: z.string().optional(),
  entitlementStatus: entitlementStatusSchema.optional(),
  paymentUrl: z.string().optional(),
  reportProgress: z.number().min(0).max(100).optional(),
  reportErrorCode: z.string().optional(),
  reportErrorMessage: z.string().optional(),
  lastSyncAt: z.string().optional(),
  needsReview: z.boolean().optional(),
  createdAt: z.string(),
  paidAt: z.string().optional(),
  refundedAt: z.string().optional(),
  notes: z.string().optional(),
  pdfUrl: z.string().url().nullable().optional(),
  mockPaymentApprovalAllowed: z.boolean().optional(),
});

export const partnerSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  slug: z.string(),
  status: partnerStatusSchema,
  commissionRate: z.number().min(0).max(1),
  defaultVisualPack: visualPackSchema,
  contact: z.string().optional(),
  createdAt: z.string(),
  clicks: z.number().int().min(0).optional(),
  leads: z.number().int().min(0).optional(),
  freeReports: z.number().int().min(0).optional(),
  paidOrders: z.number().int().min(0).optional(),
  revenue: z.number().min(0).optional(),
  commission: z.number().min(0).optional(),
  unpaidCommission: z.number().min(0).optional(),
});

export const commissionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  partnerName: z.string().optional(),
  orderId: z.string(),
  paymentId: z.string().optional(),
  productType: realProductTypeSchema,
  productTitle: z.string().optional(),
  grossAmount: z.number(),
  currency: z.string().optional(),
  commissionRate: z.number(),
  commissionAmount: z.number(),
  status: commissionStatusSchema,
  holdUntil: z.string().optional(),
  availableAt: z.string().optional(),
  createdAt: z.string(),
  approvedAt: z.string().optional(),
  paidAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  adjustmentReason: z.string().optional(),
});

export const payoutSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  partnerName: z.string().optional(),
  currency: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  amount: z.number(),
  status: payoutStatusSchema,
  method: payoutMethodTypeSchema.optional(),
  provider: z.string().optional(),
  externalPayoutId: z.string().optional(),
  failureReason: z.string().optional(),
  createdAt: z.string(),
  approvedAt: z.string().optional(),
  paidAt: z.string().optional(),
  failedAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  notes: z.string().optional(),
  createdByAdminId: z.string().optional(),
  approvedByAdminId: z.string().optional(),
  paidByAdminId: z.string().optional(),
});

export const paymentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  orderId: z.string(),
  userId: z.string().optional(),
  partnerId: z.string().optional(),
  partnerName: z.string().optional(),
  productTitle: z.string().optional(),
  provider: z.string(),
  externalPaymentId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: paymentStatusSchema,
  method: z.string().nullable().optional(),
  providerFee: z.number().nullable().optional(),
  platformReceivedAmount: z.number().nullable().optional(),
  rawProviderPayload: z.unknown().optional(),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  confirmedAt: z.string().nullable().optional(),
  failedAt: z.string().nullable().optional(),
  refundedAt: z.string().nullable().optional(),
});

export const partnerBalanceSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  partnerName: z.string().optional(),
  currency: z.string(),
  pendingBalance: z.number(),
  availableBalance: z.number(),
  onHoldBalance: z.number(),
  paidOutTotal: z.number(),
  adjustedTotal: z.number(),
  refundedTotal: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ledgerEntrySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string().optional(),
  partnerName: z.string().optional(),
  orderId: z.string().optional(),
  paymentId: z.string().optional(),
  commissionId: z.string().optional(),
  payoutId: z.string().optional(),
  type: ledgerEntryTypeSchema,
  direction: ledgerDirectionSchema,
  amount: z.number(),
  currency: z.string(),
  status: ledgerEntryStatusSchema,
  description: z.string(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  createdBy: z.string().optional(),
});

export const payoutMethodSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  type: payoutMethodTypeSchema,
  status: z.enum(["not_configured", "pending_review", "verified", "rejected", "disabled"]),
  displayName: z.string().optional(),
  maskedDetails: z.string().optional(),
  adminNote: z.string().optional(),
  createdAt: z.string(),
  verifiedAt: z.string().optional(),
});

export const promoMaterialSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string().optional(),
  partnerSlug: z.string().optional(),
  productType: realProductTypeSchema.optional(),
  topic: funnelTopicSchema.optional(),
  visualPack: visualPackSchema,
  type: promoMaterialTypeSchema,
  title: z.string(),
  body: z.string(),
  url: z.string().optional(),
});

export const revenueBreakdownItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  revenue: z.number(),
  orderCount: z.number().int(),
});

export const revenueSummarySchema = z.object({
  revenueToday: z.number(),
  revenueLast7Days: z.number(),
  revenueLast30Days: z.number(),
  paidOrdersCount: z.number().int(),
  averageOrderValue: z.number(),
  refundsAmount: z.number(),
  refundsCount: z.number().int(),
  byProduct: z.array(revenueBreakdownItemSchema),
  byTheme: z.array(revenueBreakdownItemSchema),
  byPartner: z.array(revenueBreakdownItemSchema),
});

export const productEconomicsRowSchema = z.object({
  productType: realProductTypeSchema.optional(),
  productName: z.string(),
  level: z.string().optional(),
  price: z.number().optional(),
  priceLabel: z.string().optional(),
  salesCount: z.number().int(),
  grossRevenue: z.number(),
  partnerCommission: z.number(),
  providerFees: z.number().optional(),
  refundAmount: z.number().optional(),
  estimatedApiCost: z.number(),
  grossProfitEstimate: z.number(),
  conversionRate: z.number().nullable().optional(),
  conversionRatePlaceholder: z.number().optional(),
});

export const funnelStageMetricSchema = z.object({
  stage: funnelStageSchema,
  count: z.number().int(),
  conversionFromPrevious: z.number().optional(),
  conversionFromFirst: z.number(),
});

export const funnelBreakdownItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  stages: z.array(funnelStageMetricSchema),
});

export const funnelAnalyticsSummarySchema = z.object({
  stages: z.array(funnelStageMetricSchema),
  byPartner: z.array(funnelBreakdownItemSchema),
  byProduct: z.array(funnelBreakdownItemSchema),
  byTheme: z.array(funnelBreakdownItemSchema),
  byVisualPack: z.array(funnelBreakdownItemSchema),
});

export const commissionSummarySchema = z.object({
  pending: z.number(),
  available: z.number(),
  onHold: z.number(),
  approved: z.number(),
  paid: z.number(),
  adjusted: z.number(),
  cancelled: z.number(),
});

export const partnerFinanceSchema = z.object({
  partnerId: z.string(),
  balances: z.array(partnerBalanceSchema),
  commissionSummary: commissionSummarySchema,
  recentCommissions: z.array(commissionSchema),
  recentPayouts: z.array(payoutSchema),
});

export const orderListParamsSchema = z.object({
  status: orderStatusSchema.optional(),
  productType: realProductTypeSchema.optional(),
  partnerId: z.string().optional(),
  theme: funnelTopicSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const updatePayoutRequestSchema = z.object({
  action: z.enum(["approve", "paid", "failed", "cancel"]).optional(),
  status: payoutStatusSchema.optional(),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

export const createPayoutRequestSchema = z.object({
  partnerId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
});

export const manualAdjustmentRequestSchema = z.object({
  amount: z.number(),
  currency: z.string().default("USD"),
  reason: z.string().min(1),
});

export const commissionActionRequestSchema = z.object({
  reason: z.string().optional(),
});

export const markRefundedRequestSchema = z.object({
  reason: z.string().min(1),
});

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type ReportStatusOps = z.infer<typeof reportStatusOpsSchema>;
export type PartnerStatus = z.infer<typeof partnerStatusSchema>;
export type CommissionStatus = z.infer<typeof commissionStatusSchema>;
export type PayoutStatus = z.infer<typeof payoutStatusSchema>;
export type PromoMaterialType = z.infer<typeof promoMaterialTypeSchema>;
export type FunnelStage = z.infer<typeof funnelStageSchema>;
export type Attribution = z.infer<typeof attributionSchema>;
export type Order = z.infer<typeof orderSchema>;
export type Partner = z.infer<typeof partnerSchema>;
export type Commission = z.infer<typeof commissionSchema>;
export type Payout = z.infer<typeof payoutSchema>;
export type PromoMaterial = z.infer<typeof promoMaterialSchema>;
export type RevenueBreakdownItem = z.infer<typeof revenueBreakdownItemSchema>;
export type RevenueSummary = z.infer<typeof revenueSummarySchema>;
export type ProductEconomicsRow = z.infer<typeof productEconomicsRowSchema>;
export type FunnelStageMetric = z.infer<typeof funnelStageMetricSchema>;
export type FunnelBreakdownItem = z.infer<typeof funnelBreakdownItemSchema>;
export type FunnelAnalyticsSummary = z.infer<typeof funnelAnalyticsSummarySchema>;
export type CommissionSummary = z.infer<typeof commissionSummarySchema>;
export type OrderListParams = z.infer<typeof orderListParamsSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type LedgerEntryType = z.infer<typeof ledgerEntryTypeSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type PartnerBalance = z.infer<typeof partnerBalanceSchema>;
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;
export type PayoutMethod = z.infer<typeof payoutMethodSchema>;
export type PartnerFinance = z.infer<typeof partnerFinanceSchema>;
export type CreatePayoutRequest = z.infer<typeof createPayoutRequestSchema>;
export type ManualAdjustmentRequest = z.infer<typeof manualAdjustmentRequestSchema>;
export type MarkRefundedRequest = z.infer<typeof markRefundedRequestSchema>;
export type UpdatePayoutRequest = z.infer<typeof updatePayoutRequestSchema>;

export interface PartnerDetail extends Partner {
  recentOrders: Order[];
  commissionSummary: CommissionSummary;
  bestProduct?: { productType: string; label: string; count: number };
  bestTopic?: { topic: string; label: string; count: number };
}

export interface PartnerLinkSet {
  partnerId: string;
  partnerSlug: string;
  partnerName: string;
  general: string;
  money: string;
  relationships: string;
  personality: string;
}
