import { z } from "zod";
import { entitlementStatusSchema, realProductTypeSchema } from "../ops";

export { entitlementStatusSchema };

export const entitlementSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  orderId: z.string().optional(),
  productType: realProductTypeSchema,
  reportId: z.string().optional(),
  pdfUrl: z.string().url().nullable().optional(),
  status: entitlementStatusSchema,
  grantedAt: z.string().optional(),
  revokedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const reportAccessCheckSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
  entitlementStatus: entitlementStatusSchema.optional(),
  reportStatus: z.string().optional(),
});

export type EntitlementStatus = z.infer<typeof entitlementStatusSchema>;
export type Entitlement = z.infer<typeof entitlementSchema>;
export type ReportAccessCheck = z.infer<typeof reportAccessCheckSchema>;
