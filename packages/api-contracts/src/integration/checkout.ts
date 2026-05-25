import { z } from "zod";
import { attributionSchema, funnelTopicSchema, orderStatusSchema, realProductTypeSchema, entitlementStatusSchema, reportStatusOpsSchema } from "../ops";

export const startCheckoutRequestSchema = z.object({
  tenantId: z.string(),
  tenantSlug: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  productId: z.string(),
  productType: realProductTypeSchema,
  theme: funnelTopicSchema.optional(),
  locale: z.string().optional(),
  birth: z
    .object({
      name: z.string(),
      birthDate: z.string(),
      birthTime: z.string().nullable().optional(),
      timeAccuracy: z.enum(["exact", "approximate", "unknown"]),
      birthPlace: z.string(),
    })
    .optional(),
  partner: attributionSchema.optional(),
});

export const startCheckoutResponseSchema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  paymentUrl: z.string(),
  status: orderStatusSchema,
  entitlementId: z.string(),
});

export const confirmPaymentReturnRequestSchema = z.object({
  orderId: z.string(),
  returnState: z.enum(["success", "cancel", "pending", "failed"]),
});

export const confirmPaymentReturnResponseSchema = z.object({
  orderId: z.string(),
  orderStatus: orderStatusSchema,
  paymentStatus: orderStatusSchema,
  entitlementStatus: entitlementStatusSchema,
  reportStatus: reportStatusOpsSchema.optional(),
  externalReportId: z.string().optional(),
  message: z.string().optional(),
});

export const checkoutOrderDetailSchema = z.object({
  orderId: z.string(),
  orderStatus: orderStatusSchema,
  paymentStatus: orderStatusSchema,
  paymentUrl: z.string().optional(),
  externalPaymentId: z.string().optional(),
  entitlementId: z.string().optional(),
  entitlementStatus: entitlementStatusSchema.optional(),
  reportStatus: reportStatusOpsSchema.optional(),
  externalReportId: z.string().optional(),
});

export type StartCheckoutRequest = z.infer<typeof startCheckoutRequestSchema>;
export type StartCheckoutResponse = z.infer<typeof startCheckoutResponseSchema>;
export type ConfirmPaymentReturnRequest = z.infer<typeof confirmPaymentReturnRequestSchema>;
export type ConfirmPaymentReturnResponse = z.infer<typeof confirmPaymentReturnResponseSchema>;
export type CheckoutOrderDetail = z.infer<typeof checkoutOrderDetailSchema>;
