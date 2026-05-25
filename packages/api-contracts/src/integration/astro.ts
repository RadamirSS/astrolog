import { z } from "zod";
import { attributionSchema, funnelTopicSchema, realProductTypeSchema } from "../ops";

export const astroReportLifecycleStatusSchema = z.enum([
  "queued",
  "processing",
  "ready",
  "failed",
]);

export const astroBirthPayloadSchema = z.object({
  name: z.string(),
  birthDate: z.string(),
  birthTime: z.string().nullable().optional(),
  timeAccuracy: z.enum(["exact", "approximate", "unknown"]),
  birthPlace: z.string(),
});

export const astroFreeReportRequestSchema = z.object({
  tenantId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  theme: funnelTopicSchema,
  locale: z.string().default("ru"),
  birth: astroBirthPayloadSchema,
  partner: attributionSchema.optional(),
});

export const astroPaidReportRequestSchema = z.object({
  tenantId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  orderId: z.string(),
  entitlementId: z.string(),
  productType: realProductTypeSchema,
  theme: funnelTopicSchema.nullable().optional(),
  locale: z.string().default("ru"),
  birth: astroBirthPayloadSchema,
  partner: attributionSchema.optional(),
});

export const astroReportRequestResponseSchema = z.object({
  reportId: z.string(),
  status: astroReportLifecycleStatusSchema,
  estimatedReadyAt: z.string().nullable().optional(),
});

export const astroReportStatusResponseSchema = z.object({
  reportId: z.string(),
  status: astroReportLifecycleStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  updatedAt: z.string(),
});

export type AstroReportLifecycleStatus = z.infer<typeof astroReportLifecycleStatusSchema>;
export type AstroBirthPayload = z.infer<typeof astroBirthPayloadSchema>;
export type AstroFreeReportRequest = z.infer<typeof astroFreeReportRequestSchema>;
export type AstroPaidReportRequest = z.infer<typeof astroPaidReportRequestSchema>;
export type AstroReportRequestResponse = z.infer<typeof astroReportRequestResponseSchema>;
export type AstroReportStatusResponse = z.infer<typeof astroReportStatusResponseSchema>;
