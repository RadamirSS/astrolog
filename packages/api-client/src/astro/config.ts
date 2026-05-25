import { ApiClientError, ApiErrorCode } from "@astro/api-contracts";

export type AstroApiMode = "mock" | "remote";

export function getAstroApiMode(): AstroApiMode {
  const mode = process.env.ASTRO_API_MODE ?? process.env.NEXT_PUBLIC_ASTRO_API_MODE ?? "mock";
  return mode === "remote" ? "remote" : "mock";
}

export function getAstroApiBaseUrl(): string {
  const url =
    process.env.ASTRO_API_BASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_ASTRO_API_BASE_URL?.trim();
  if (!url) {
    throw new ApiClientError(
      ApiErrorCode.REMOTE_API_NOT_CONFIGURED,
      "ASTRO_API_BASE_URL is not configured. Use ASTRO_API_MODE=mock or set ASTRO_API_BASE_URL."
    );
  }
  return url;
}

export function getAstroApiToken(): string | undefined {
  return process.env.ASTRO_API_TOKEN?.trim();
}

export function getAstroApiTimeoutMs(): number {
  const raw = process.env.ASTRO_API_TIMEOUT_MS ?? "30000";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30000;
}

export function assertAstroRemoteConfig(): void {
  if (getAstroApiMode() !== "remote") return;
  getAstroApiBaseUrl();
}
