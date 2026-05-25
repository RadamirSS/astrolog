import { z } from "zod";

export interface EndUserSummary {
  id: string;
  tenantId: string;
  telegramId: string;
  telegramUsername?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
}

export interface ValidateInitDataRequest {
  tenantSlug: string;
  initData: string;
}

export interface ValidateInitDataResponse {
  user: EndUserSummary;
}

export const endUserSummarySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  telegramId: z.string().min(1),
  telegramUsername: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  languageCode: z.string().nullable().optional(),
});

export const validateInitDataResponseSchema = z.object({
  user: endUserSummarySchema,
});
