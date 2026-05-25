import { ApiClientError, ApiErrorCode } from "@astro/api-contracts";

export type PaymentApiMode = "mock" | "remote";

export type OrderStatus =
  | "created"
  | "payment_pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "expired";

export function getPaymentApiMode(): PaymentApiMode {
  const mode = process.env.PAYMENT_API_MODE ?? process.env.NEXT_PUBLIC_PAYMENT_API_MODE ?? "mock";
  return mode === "remote" ? "remote" : "mock";
}

export function getPaymentApiBaseUrl(): string {
  const url =
    process.env.PAYMENT_API_BASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_PAYMENT_API_BASE_URL?.trim();
  if (!url) {
    throw new ApiClientError(
      ApiErrorCode.REMOTE_API_NOT_CONFIGURED,
      "PAYMENT_API_BASE_URL is not configured. Use PAYMENT_API_MODE=mock or set PAYMENT_API_BASE_URL."
    );
  }
  return url;
}

export function getPaymentApiToken(): string | undefined {
  return process.env.PAYMENT_API_TOKEN?.trim();
}

export function getPaymentApiTimeoutMs(): number {
  const raw = process.env.PAYMENT_API_TIMEOUT_MS ?? "30000";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30000;
}

export function assertPaymentRemoteConfig(): void {
  if (getPaymentApiMode() !== "remote") return;
  getPaymentApiBaseUrl();
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    process.env.NEXT_PUBLIC_MINIAPP_URL?.trim() ??
    "http://localhost:3000"
  );
}

export function getPaymentSuccessPath(): string {
  return process.env.PAYMENT_SUCCESS_PATH?.trim() || "/payment/success";
}

export function getPaymentCancelPath(): string {
  return process.env.PAYMENT_CANCEL_PATH?.trim() || "/payment/cancel";
}

export function getPaymentPendingPath(): string {
  return process.env.PAYMENT_PENDING_PATH?.trim() || "/payment/pending";
}

export function buildPaymentReturnUrls(tenantSlug: string): {
  successUrl: string;
  cancelUrl: string;
  pendingUrl: string;
} {
  const base = getAppBaseUrl().replace(/\/$/, "");
  const prefix = `${base}/${tenantSlug}`;
  return {
    successUrl: `${prefix}${getPaymentSuccessPath()}`,
    cancelUrl: `${prefix}${getPaymentCancelPath()}`,
    pendingUrl: `${prefix}${getPaymentPendingPath()}`,
  };
}
