import { z } from "zod";
import { funnelTopicSchema, orderStatusSchema, realProductTypeSchema } from "./ops";

export const premiumRequestStatusSchema = z.enum([
  "draft",
  "submitted",
  "payment_pending",
  "paid",
  "in_review",
  "scheduled",
  "completed",
  "cancelled",
]);

export const premiumTopicSchema = z.enum([
  "money",
  "relationships",
  "personality",
  "full_portrait",
  "other",
]);

export const premiumContactMethodSchema = z.enum([
  "telegram",
  "email",
  "phone",
  "whatsapp",
]);

export const premiumBirthSnapshotSchema = z.object({
  name: z.string(),
  birthDate: z.string(),
  birthTime: z.string().nullable().optional(),
  timeAccuracy: z.enum(["exact", "approximate", "unknown"]),
  birthPlace: z.string(),
  topic: funnelTopicSchema.optional(),
});

export const premiumRequestTimelineEntrySchema = z.object({
  at: z.string(),
  status: premiumRequestStatusSchema,
  note: z.string().optional(),
  actor: z.string().optional(),
});

export const premiumRequestSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  productId: z.string().optional(),
  productType: realProductTypeSchema,
  productTitle: z.string(),
  status: premiumRequestStatusSchema,
  topic: premiumTopicSchema,
  personalQuestion: z.string(),
  context: z.string().optional(),
  contactMethod: premiumContactMethodSchema.optional(),
  contactValue: z.string().optional(),
  desiredWindow: z.string().optional(),
  consentAccepted: z.boolean(),
  birthProfile: premiumBirthSnapshotSchema.optional(),
  orderId: z.string().optional(),
  orderStatus: orderStatusSchema.optional(),
  paymentStatus: orderStatusSchema.optional(),
  assignedExpert: z.string().optional(),
  adminNotes: z.array(z.string()).optional(),
  finalPdfUrl: z.string().url().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  submittedAt: z.string().optional(),
  timeline: z.array(premiumRequestTimelineEntrySchema).optional(),
});

export const createPremiumRequestSchema = z.object({
  tenantId: z.string(),
  tenantSlug: z.string(),
  productId: z.string().optional(),
  productType: realProductTypeSchema.default("premium_consultation"),
  productTitle: z.string().optional(),
  topic: premiumTopicSchema,
  personalQuestion: z.string().min(3),
  context: z.string().optional(),
  contactMethod: premiumContactMethodSchema.optional(),
  contactValue: z.string().optional(),
  desiredWindow: z.string().optional(),
  consentAccepted: z.literal(true),
  birthProfile: premiumBirthSnapshotSchema.optional(),
});

export const updatePremiumRequestAdminSchema = z.object({
  status: premiumRequestStatusSchema.optional(),
  assignedExpert: z.string().optional(),
  adminNote: z.string().optional(),
  finalPdfUrl: z.string().url().nullable().optional(),
});

export const premiumRequestListParamsSchema = z.object({
  status: premiumRequestStatusSchema.optional(),
  topic: premiumTopicSchema.optional(),
  limit: z.number().int().positive().optional(),
});

export const premiumRequestListSchema = z.array(premiumRequestSchema);

export type PremiumRequestStatus = z.infer<typeof premiumRequestStatusSchema>;
export type PremiumTopic = z.infer<typeof premiumTopicSchema>;
export type PremiumContactMethod = z.infer<typeof premiumContactMethodSchema>;
export type PremiumRequest = z.infer<typeof premiumRequestSchema>;
export type CreatePremiumRequestInput = z.infer<typeof createPremiumRequestSchema>;
export type UpdatePremiumRequestAdminInput = z.infer<typeof updatePremiumRequestAdminSchema>;
