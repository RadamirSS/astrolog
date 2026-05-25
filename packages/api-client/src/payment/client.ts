import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusResponse,
} from "@astro/api-contracts";
import { ApiClientError, ApiErrorCode } from "@astro/api-contracts";
import {
  assertPaymentRemoteConfig,
  buildPaymentReturnUrls,
  getPaymentApiBaseUrl,
  getPaymentApiMode,
  getPaymentApiTimeoutMs,
  getPaymentApiToken,
} from "./config";

export class PaymentApiNotConfiguredError extends ApiClientError {
  constructor(message = "Payment API remote mode is not configured.") {
    super(ApiErrorCode.REMOTE_API_NOT_CONFIGURED, message);
    this.name = "PaymentApiNotConfiguredError";
  }
}

interface MockPaymentEntry {
  paymentId: string;
  orderId: string;
  status: PaymentStatusResponse["status"];
  amount: number;
  currency: string;
  paidAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  paymentUrl: string;
}

const mockPayments = new Map<string, MockPaymentEntry>();

function mapPaymentError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;
  if (error instanceof Error && error.name === "AbortError") {
    return new ApiClientError("payment_api_timeout", "Payment API request timed out.");
  }
  if (error instanceof Error) {
    return new ApiClientError("payment_api_unavailable", error.message);
  }
  return new ApiClientError("payment_api_unavailable", "Payment API unavailable.");
}

async function paymentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  assertPaymentRemoteConfig();
  const baseUrl = getPaymentApiBaseUrl();
  const token = getPaymentApiToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getPaymentApiTimeoutMs());
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      throw new ApiClientError(
        res.status >= 500 ? "payment_api_unavailable" : "payment_api_invalid_response",
        `Payment API error: ${res.status}`
      );
    }
    return (await res.json()) as T;
  } catch (error) {
    throw mapPaymentError(error);
  } finally {
    clearTimeout(timeout);
  }
}

function toSnakeCreatePayload(payload: CreatePaymentRequest): Record<string, unknown> {
  return {
    order_id: payload.orderId,
    tenant_id: payload.tenantId,
    user_id: payload.userId ?? null,
    session_id: payload.sessionId ?? null,
    product_type: payload.productType,
    product_title: payload.productTitle,
    amount: payload.amount,
    currency: payload.currency,
    success_url: payload.successUrl,
    cancel_url: payload.cancelUrl,
    pending_url: payload.pendingUrl,
    metadata: payload.metadata
      ? {
          partner_id: payload.metadata.partnerId ?? null,
          partner_slug: payload.metadata.partnerSlug ?? null,
          campaign_id: payload.metadata.campaignId ?? null,
          theme: payload.metadata.theme ?? null,
          locale: payload.metadata.locale ?? null,
        }
      : undefined,
  };
}

function fromSnakeCreateResponse(data: Record<string, unknown>): CreatePaymentResponse {
  return {
    paymentId: String(data.payment_id ?? data.paymentId ?? ""),
    paymentUrl: String(data.payment_url ?? data.paymentUrl ?? ""),
    status: (data.status as CreatePaymentResponse["status"]) ?? "created",
    expiresAt: (data.expires_at ?? data.expiresAt ?? null) as string | null,
  };
}

function fromSnakeStatusResponse(data: Record<string, unknown>): PaymentStatusResponse {
  return {
    paymentId: String(data.payment_id ?? data.paymentId ?? ""),
    orderId: String(data.order_id ?? data.orderId ?? ""),
    status: (data.status as PaymentStatusResponse["status"]) ?? "pending",
    paidAt: (data.paid_at ?? data.paidAt ?? null) as string | null,
    amount: Number(data.amount ?? 0),
    currency: String(data.currency ?? "USD"),
    errorCode: (data.error_code ?? data.errorCode ?? null) as string | null,
    errorMessage: (data.error_message ?? data.errorMessage ?? null) as string | null,
  };
}

function buildMockPaymentUrl(
  tenantSlug: string,
  orderId: string,
  paymentId: string,
  state: "pending" | "success" | "cancel" | "failed" = "pending"
): string {
  const urls = buildPaymentReturnUrls(tenantSlug);
  const target =
    state === "success"
      ? urls.successUrl
      : state === "cancel"
        ? urls.cancelUrl
        : state === "failed"
          ? `${urls.cancelUrl}?reason=failed`
          : urls.pendingUrl;
  const sep = target.includes("?") ? "&" : "?";
  return `${target}${sep}orderId=${encodeURIComponent(orderId)}&paymentId=${encodeURIComponent(paymentId)}&mock=${state}`;
}

export const paymentClient = {
  async createPayment(
    payload: CreatePaymentRequest & { tenantSlug?: string }
  ): Promise<CreatePaymentResponse> {
    if (getPaymentApiMode() === "remote") {
      const data = await paymentFetch<Record<string, unknown>>("/v1/payments/create", {
        method: "POST",
        body: JSON.stringify(toSnakeCreatePayload(payload)),
      });
      return fromSnakeCreateResponse(data);
    }

    const paymentId = `pay_${payload.tenantId}_${Date.now()}`;
    const tenantSlug = payload.tenantSlug ?? payload.tenantId;
    const paymentUrl = buildMockPaymentUrl(tenantSlug, payload.orderId, paymentId, "pending");
    const entry: MockPaymentEntry = {
      paymentId,
      orderId: payload.orderId,
      status: "pending",
      amount: payload.amount,
      currency: payload.currency,
      paymentUrl,
      paidAt: null,
    };
    mockPayments.set(paymentId, entry);
    mockPayments.set(`order:${payload.orderId}`, entry);
    return {
      paymentId,
      paymentUrl,
      status: "created",
      expiresAt: null,
    };
  },

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    if (getPaymentApiMode() === "remote") {
      const data = await paymentFetch<Record<string, unknown>>(
        `/v1/payments/${paymentId}/status`
      );
      return fromSnakeStatusResponse(data);
    }

    const entry = mockPayments.get(paymentId);
    if (!entry) {
      throw new ApiClientError("payment_status_failed", `Payment not found: ${paymentId}`);
    }
    return {
      paymentId: entry.paymentId,
      orderId: entry.orderId,
      status: entry.status,
      paidAt: entry.paidAt ?? null,
      amount: entry.amount,
      currency: entry.currency,
      errorCode: entry.errorCode ?? null,
      errorMessage: entry.errorMessage ?? null,
    };
  },

  async syncPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    if (getPaymentApiMode() === "remote") {
      const data = await paymentFetch<Record<string, unknown>>(
        `/v1/orders/${orderId}/payment-status`
      );
      return fromSnakeStatusResponse(data);
    }

    const entry = mockPayments.get(`order:${orderId}`);
    if (!entry) {
      throw new ApiClientError("payment_status_failed", `Payment not found for order: ${orderId}`);
    }
    return paymentClient.getPaymentStatus(entry.paymentId);
  },

  /** Mock helper: mark payment as paid (for smoke testing). */
  _mockMarkPaid(paymentId: string): void {
    const entry = mockPayments.get(paymentId);
    if (!entry) return;
    entry.status = "paid";
    entry.paidAt = new Date().toISOString();
  },

  /** Mock helper: mark payment as failed. */
  _mockMarkFailed(paymentId: string): void {
    const entry = mockPayments.get(paymentId);
    if (!entry) return;
    entry.status = "failed";
    entry.errorCode = "payment_failed";
    entry.errorMessage = "Mock payment failed.";
  },

  /** @internal test helper */
  _resetMockStore(): void {
    mockPayments.clear();
  },
};

export type { CreatePaymentRequest, CreatePaymentResponse, PaymentStatusResponse };
