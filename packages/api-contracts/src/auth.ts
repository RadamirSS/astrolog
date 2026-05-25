import { z } from "zod";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AccountSummary {
  id: string;
  email: string;
  role: string;
  partnerId?: string | null;
}

export interface LoginResponse {
  account: AccountSummary;
}

export const accountSummarySchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  partnerId: z.string().nullable().optional(),
});

export const loginResponseSchema = z.object({
  account: accountSummarySchema,
});
