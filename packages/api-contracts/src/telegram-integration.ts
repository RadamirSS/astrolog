import { z } from "zod";

export const connectTelegramBotRequestSchema = z.object({
  token: z.string().min(10),
});

export const telegramIntegrationStatusSchema = z.object({
  integrationId: z.string(),
  miniAppId: z.string().optional(),
  tenantId: z.string(),
  botId: z.string().optional(),
  botUsername: z.string().optional(),
  botDisplayName: z.string().optional(),
  status: z.enum([
    "not_connected",
    "connected",
    "invalid_token",
    "webhook_configured",
    "error",
    "disconnected",
  ]),
  webhookStatus: z.enum(["pending", "configured", "error", "not_configured"]).optional(),
  menuStatus: z.enum(["pending", "configured", "error", "not_configured"]).optional(),
  lastValidatedAt: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  miniAppUrl: z.string().optional(),
  deepLink: z.string().optional(),
});

export const validateTelegramBotRequestSchema = z.object({
  token: z.string().min(10),
});

export const validateTelegramBotResponseSchema = z.object({
  valid: z.boolean(),
  botUsername: z.string().optional(),
  botDisplayName: z.string().optional(),
  errorMessage: z.string().optional(),
});

export type ConnectTelegramBotRequest = z.infer<typeof connectTelegramBotRequestSchema>;
export type TelegramIntegrationStatusResponse = z.infer<typeof telegramIntegrationStatusSchema>;
export type ValidateTelegramBotRequest = z.infer<typeof validateTelegramBotRequestSchema>;
export type ValidateTelegramBotResponse = z.infer<typeof validateTelegramBotResponseSchema>;
