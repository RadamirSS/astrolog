import { z } from "zod";
import { funnelTopicSchema, realProductTypeSchema } from "../ops";

export const paymentLifecycleStatusSchema = z.enum([
  "created",
  "pending",
  "paid",
  "failed",
  "cancelled",
  "expired",
  "refunded",
]);

export const createPaymentRequestSchema = z.object({
  orderId: z.string(),
  tenantId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  productType: realProductTypeSchema,
  productTitle: z.string(),
  amount: z.number(),
  currency: z.string(),
  successUrl: z.string(),
  cancelUrl: z.string(),
  pendingUrl: z.string(),
  metadata: z
    .object({
      partnerId: z.string().nullable().optional(),
      partnerSlug: z.string().nullable().optional(),
      campaignId: z.string().nullable().optional(),
      theme: funnelTopicSchema.optional(),
      locale: z.string().optional(),
    })
    .optional(),
});

export const createPaymentResponseSchema = z.object({
  paymentId: z.string(),
  paymentUrl: z.string(),
  status: z.enum(["created", "pending", "failed"]),
  expiresAt: z.string().nullable().optional(),
});

export const paymentStatusResponseSchema = z.object({
  paymentId: z.string(),
  orderId: z.string(),
  status: paymentLifecycleStatusSchema,
  paidAt: z.string().nullable().optional(),
  amount: z.number(),
  currency: z.string(),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
});

export type PaymentLifecycleStatus = z.infer<typeof paymentLifecycleStatusSchema>;
export type CreatePaymentRequest = z.infer<typeof createPaymentRequestSchema>;
export type CreatePaymentResponse = z.infer<typeof createPaymentResponseSchema>;
export type PaymentStatusResponse = z.infer<typeof paymentStatusResponseSchema>;
