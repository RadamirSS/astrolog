import type {
  CreatorMiniAppResponse,
  PublicSurfaceResponse,
  TelegramIntegrationStatusResponse,
  ValidateTelegramBotResponse,
} from "@astro/api-contracts";
import type { SurfaceConfig, SurfaceType } from "@astro/tenant-config";
import { getAdapter } from "../client";

export async function getCreatorMiniApp(tenantId: string): Promise<CreatorMiniAppResponse> {
  return getAdapter().getCreatorMiniApp(tenantId);
}

export async function updateCreatorMiniApp(
  tenantId: string,
  patch: Partial<CreatorMiniAppResponse>
): Promise<CreatorMiniAppResponse> {
  return getAdapter().updateCreatorMiniApp(tenantId, patch);
}

export async function publishCreatorMiniApp(tenantId: string): Promise<CreatorMiniAppResponse> {
  return getAdapter().publishCreatorMiniApp(tenantId);
}

export async function unpublishCreatorMiniApp(tenantId: string): Promise<CreatorMiniAppResponse> {
  return getAdapter().unpublishCreatorMiniApp(tenantId);
}

export async function updateSurfaceConfig(
  tenantId: string,
  surfaceId: string,
  patch: Partial<SurfaceConfig>
): Promise<CreatorMiniAppResponse> {
  return getAdapter().updateSurfaceConfig(tenantId, surfaceId, patch);
}

export async function setSurfaceEnabled(
  tenantId: string,
  type: SurfaceType,
  enabled: boolean
): Promise<CreatorMiniAppResponse> {
  return getAdapter().setSurfaceEnabled(tenantId, type, enabled);
}

export async function publishSurface(
  tenantId: string,
  surfaceId: string
): Promise<CreatorMiniAppResponse> {
  return getAdapter().publishSurface(tenantId, surfaceId);
}

export async function getSurfacePreview(
  tenantId: string,
  surfaceId: string
): Promise<{ previewUrl: string; config: CreatorMiniAppResponse }> {
  return getAdapter().getSurfacePreview(tenantId, surfaceId);
}

export async function connectTelegramBot(
  tenantId: string,
  token: string
): Promise<TelegramIntegrationStatusResponse> {
  return getAdapter().connectTelegramBot(tenantId, token);
}

export async function disconnectTelegramBot(
  tenantId: string,
  integrationId?: string
): Promise<TelegramIntegrationStatusResponse> {
  return getAdapter().disconnectTelegramBot(tenantId, integrationId);
}

export async function validateTelegramBotToken(
  tenantId: string,
  token: string
): Promise<ValidateTelegramBotResponse> {
  return getAdapter().validateTelegramBotToken(tenantId, token);
}

export async function getTelegramIntegrationStatus(
  tenantId: string
): Promise<TelegramIntegrationStatusResponse | null> {
  return getAdapter().getTelegramIntegrationStatus(tenantId);
}

export async function resolvePublicSurface(
  type: "telegram" | "website" | "mobile",
  slug: string
): Promise<PublicSurfaceResponse> {
  return getAdapter().resolvePublicSurface(type, slug);
}
