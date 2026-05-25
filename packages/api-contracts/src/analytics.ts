import { z } from "zod";

export const MINIAPP_ANALYTICS_EVENTS = [
  "miniapp_opened",
  "partner_link_clicked",
  "landing_viewed",
  "tenant_home_viewed",
  "topic_selected",
  "onboarding_started",
  "birth_form_started",
  "birth_form_completed",
  "birth_profile_submitted",
  "free_report_requested",
  "free_report_ready",
  "free_report_viewed",
  "paywall_viewed",
  "product_viewed",
  "checkout_started",
  "mock_payment_created",
  "payment_created",
  "payment_redirected",
  "payment_return_success",
  "payment_return_cancel",
  "payment_return_pending",
  "payment_return_failed",
  "payment_status_checked",
  "payment_paid",
  "entitlement_created",
  "entitlement_ready",
  "entitlement_failed",
  "paid_report_requested",
  "paid_report_status_checked",
  "paid_report_ready",
  "paid_report_failed",
  "report_retry_requested",
  "my_reports_viewed",
  "report_opened",
  "paid_report_opened",
  "pdf_downloaded",
  "premium_product_viewed",
  "premium_request_started",
  "premium_request_submitted",
  "premium_request_status_viewed",
  "report_failed_viewed",
  "report_retry_clicked",
  "support_needed_clicked",
  "product_list_viewed",
  "product_clicked",
  "product_cta_clicked",
  "profile_viewed",
] as const;

export const DASHBOARD_ANALYTICS_EVENTS = [
  "dashboard_opened",
  "dashboard_setup_started",
  "dashboard_setup_completed",
  "dashboard_brand_saved",
  "dashboard_design_saved",
  "dashboard_content_saved",
  "dashboard_product_created",
  "dashboard_product_updated",
  "dashboard_product_deleted",
  "dashboard_preview_opened",
  "dashboard_publish_clicked",
  "dashboard_config_published",
  "dashboard_draft_discarded",
  "dashboard_order_payment_synced",
  "dashboard_order_report_synced",
  "dashboard_order_report_retried",
  "dashboard_order_needs_review",
  "dashboard_entitlement_revoked",
  "dashboard_entitlement_unlocked",
  "dashboard_premium_request_updated",
  "dashboard_premium_request_note_added",
] as const;

export const SUPERADMIN_ANALYTICS_EVENTS = [
  "superadmin_opened",
  "superadmin_tenant_created",
  "superadmin_tenant_status_changed",
  "superadmin_tenant_preview_opened",
] as const;

export const ANALYTICS_EVENT_NAMES = [
  ...MINIAPP_ANALYTICS_EVENTS,
  ...DASHBOARD_ANALYTICS_EVENTS,
  ...SUPERADMIN_ANALYTICS_EVENTS,
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export interface AnalyticsEventBase {
  eventName: AnalyticsEventName;
  tenantId?: string;
  tenantSlug?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  properties?: Record<string, unknown>;
}

export interface AnalyticsEventPayload extends Omit<AnalyticsEventBase, "timestamp"> {
  timestamp?: string;
}

export interface TrackAnalyticsEventsRequest {
  events: AnalyticsEventPayload[];
}

export const analyticsEventNameSchema = z.enum(ANALYTICS_EVENT_NAMES);

export const analyticsEventPayloadSchema = z.object({
  eventName: analyticsEventNameSchema,
  tenantId: z.string().optional(),
  tenantSlug: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  timestamp: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

export const trackAnalyticsEventsRequestSchema = z.object({
  events: z.array(analyticsEventPayloadSchema).min(1),
});
