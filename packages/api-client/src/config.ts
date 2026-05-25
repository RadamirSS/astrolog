import { ApiClientError, ApiErrorCode } from "@astro/api-contracts";

export type ApiMode = "mock" | "remote";

export function getApiMode(): ApiMode {
  const mode = process.env.NEXT_PUBLIC_API_MODE ?? "mock";
  return mode === "remote" ? "remote" : "mock";
}

export function isRemoteConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_API_BASE_URL?.trim());
}

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!url) {
    throw new ApiClientError(
      ApiErrorCode.REMOTE_API_NOT_CONFIGURED,
      "NEXT_PUBLIC_API_BASE_URL is not configured. Set it or use NEXT_PUBLIC_API_MODE=mock."
    );
  }
  return url;
}

export function assertRemoteConfigured(): void {
  if (getApiMode() === "remote" && !isRemoteConfigured()) {
    throw new ApiClientError(
      ApiErrorCode.REMOTE_API_NOT_CONFIGURED,
      "Remote API mode requires NEXT_PUBLIC_API_BASE_URL to be set."
    );
  }
}

/** @deprecated Use ApiClientError from @astro/api-contracts */
export { ApiClientError as ApiError } from "@astro/api-contracts";

export { ApiClientError, ApiErrorCode } from "@astro/api-contracts";
