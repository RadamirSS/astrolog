import type {
  AstroFreeReportRequest,
  AstroPaidReportRequest,
  AstroReportRequestResponse,
  AstroReportStatusResponse,
} from "@astro/api-contracts";
import { ApiClientError, ApiErrorCode } from "@astro/api-contracts";
import type { RealProductType, ReportV2 } from "@astro/tenant-config";
import { buildMockFreeReportV2, getCatalogDef } from "@astro/tenant-config";
import {
  assertAstroRemoteConfig,
  getAstroApiBaseUrl,
  getAstroApiMode,
  getAstroApiTimeoutMs,
  getAstroApiToken,
} from "./config";

export class AstroApiNotConfiguredError extends ApiClientError {
  constructor(message = "Astro API remote mode is not configured.") {
    super(ApiErrorCode.REMOTE_API_NOT_CONFIGURED, message);
    this.name = "AstroApiNotConfiguredError";
  }
}

interface MockReportEntry {
  reportId: string;
  status: "queued" | "processing" | "ready" | "failed";
  progress: number;
  productType: RealProductType;
  payload?: ReportV2;
  errorCode?: string;
  errorMessage?: string;
  updatedAt: string;
  requestPayload?: AstroFreeReportRequest | AstroPaidReportRequest;
}

const mockReportStore = new Map<string, MockReportEntry>();

function mapAstroError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;
  if (error instanceof Error && error.name === "AbortError") {
    return new ApiClientError("astro_api_timeout", "Astro API request timed out.");
  }
  if (error instanceof Error) {
    return new ApiClientError("astro_api_unavailable", error.message);
  }
  return new ApiClientError("astro_api_unavailable", "Astro API unavailable.");
}

async function astroFetch<T>(path: string, init?: RequestInit): Promise<T> {
  assertAstroRemoteConfig();
  const baseUrl = getAstroApiBaseUrl();
  const token = getAstroApiToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getAstroApiTimeoutMs());
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
        res.status >= 500 ? "astro_api_unavailable" : "astro_api_invalid_response",
        `Astro API error: ${res.status}`
      );
    }
    return (await res.json()) as T;
  } catch (error) {
    throw mapAstroError(error);
  } finally {
    clearTimeout(timeout);
  }
}

function toSnakeFreePayload(payload: AstroFreeReportRequest): Record<string, unknown> {
  return {
    tenant_id: payload.tenantId,
    user_id: payload.userId ?? null,
    session_id: payload.sessionId ?? null,
    theme: payload.theme,
    locale: payload.locale ?? "ru",
    birth: {
      name: payload.birth.name,
      birth_date: payload.birth.birthDate,
      birth_time: payload.birth.birthTime ?? null,
      time_accuracy: payload.birth.timeAccuracy,
      birth_place: payload.birth.birthPlace,
    },
    partner: payload.partner
      ? {
          partner_id: payload.partner.partnerId ?? null,
          partner_slug: payload.partner.partnerSlug ?? null,
          campaign_id: payload.partner.campaignId ?? null,
          utm_source: payload.partner.utmSource ?? null,
          utm_medium: payload.partner.utmMedium ?? null,
          utm_campaign: payload.partner.utmCampaign ?? null,
          click_id: payload.partner.clickId ?? null,
        }
      : undefined,
  };
}

function toSnakePaidPayload(payload: AstroPaidReportRequest): Record<string, unknown> {
  return {
    tenant_id: payload.tenantId,
    user_id: payload.userId ?? null,
    session_id: payload.sessionId ?? null,
    order_id: payload.orderId,
    entitlement_id: payload.entitlementId,
    product_type: payload.productType,
    theme: payload.theme ?? null,
    locale: payload.locale ?? "ru",
    birth: {
      name: payload.birth.name,
      birth_date: payload.birth.birthDate,
      birth_time: payload.birth.birthTime ?? null,
      time_accuracy: payload.birth.timeAccuracy,
      birth_place: payload.birth.birthPlace,
    },
    partner: payload.partner
      ? {
          partner_id: payload.partner.partnerId ?? null,
          partner_slug: payload.partner.partnerSlug ?? null,
          campaign_id: payload.partner.campaignId ?? null,
          utm_source: payload.partner.utmSource ?? null,
          utm_medium: payload.partner.utmMedium ?? null,
          utm_campaign: payload.partner.utmCampaign ?? null,
          click_id: payload.partner.clickId ?? null,
        }
      : undefined,
  };
}

function fromSnakeRequestResponse(data: Record<string, unknown>): AstroReportRequestResponse {
  return {
    reportId: String(data.report_id ?? data.reportId ?? ""),
    status: (data.status as AstroReportRequestResponse["status"]) ?? "queued",
    estimatedReadyAt: (data.estimated_ready_at ?? data.estimatedReadyAt ?? null) as string | null,
  };
}

function fromSnakeStatusResponse(data: Record<string, unknown>): AstroReportStatusResponse {
  return {
    reportId: String(data.report_id ?? data.reportId ?? ""),
    status: (data.status as AstroReportStatusResponse["status"]) ?? "queued",
    progress: typeof data.progress === "number" ? data.progress : undefined,
    errorCode: (data.error_code ?? data.errorCode ?? null) as string | null,
    errorMessage: (data.error_message ?? data.errorMessage ?? null) as string | null,
    updatedAt: String(data.updated_at ?? data.updatedAt ?? new Date().toISOString()),
  };
}

function buildMockPaidReportV2(
  payload: AstroPaidReportRequest,
  reportId: string
): ReportV2 {
  const def = getCatalogDef(payload.productType);
  const theme = payload.theme ?? "personality";
  const isRu = (payload.locale ?? "ru") === "ru";
  const now = new Date().toISOString();
  return {
    schemaVersion: 2,
    id: reportId,
    productType: payload.productType,
    level: def.level,
    theme,
    title: isRu ? def.titleRu : def.titleEn,
    subtitle: isRu ? (def.subtitleRu ?? def.titleRu) : (def.subtitleEn ?? def.titleEn),
    visualPack: def.visualPack,
    status: "ready",
    sections: [
      {
        id: "hero",
        type: "hero",
        title: isRu ? "Ваш разбор готов" : "Your reading is ready",
        content: isRu
          ? `${payload.birth.name}, полный разбор по теме «${def.titleRu}» подготовлен.`
          : `${payload.birth.name}, your full reading for ${def.titleEn} is ready.`,
        order: 0,
      },
    ],
    actions: [],
    pdfUrl: "https://cdn.example.com/pilot/reports/mock-paid.pdf",
    createdAt: now,
    updatedAt: now,
  };
}

function scheduleMockReportReady(reportId: string, delayMs = 800): void {
  setTimeout(() => {
    const entry = mockReportStore.get(reportId);
    if (!entry || entry.status === "failed") return;
    entry.status = "processing";
    entry.progress = 50;
    entry.updatedAt = new Date().toISOString();
    setTimeout(() => {
      const current = mockReportStore.get(reportId);
      if (!current || current.status === "failed") return;
      if (current.requestPayload && "productType" in current.requestPayload) {
        current.payload = buildMockPaidReportV2(
          current.requestPayload as AstroPaidReportRequest,
          reportId
        );
      } else if (current.requestPayload) {
        const freePayload = current.requestPayload as AstroFreeReportRequest;
        current.payload = buildMockFreeReportV2({
          tenantId: freePayload.tenantId,
          birthProfile: {
            name: freePayload.birth.name,
            birthDate: freePayload.birth.birthDate,
            birthTime: freePayload.birth.birthTime,
            timeAccuracy: freePayload.birth.timeAccuracy,
            topic: freePayload.theme,
          },
          theme: freePayload.theme,
          locale: (freePayload.locale ?? "ru") as "ru" | "en",
        });
        current.payload.id = reportId;
      }
      current.status = "ready";
      current.progress = 100;
      current.updatedAt = new Date().toISOString();
    }, delayMs);
  }, delayMs);
}

export const astroClient = {
  async requestFreeReport(payload: AstroFreeReportRequest): Promise<AstroReportRequestResponse> {
    if (getAstroApiMode() === "remote") {
      const data = await astroFetch<Record<string, unknown>>("/v1/reports/free", {
        method: "POST",
        body: JSON.stringify(toSnakeFreePayload(payload)),
      });
      return fromSnakeRequestResponse(data);
    }

    const reportId = `${payload.tenantId}-free-${Date.now()}`;
    const now = new Date().toISOString();
    mockReportStore.set(reportId, {
      reportId,
      status: "queued",
      progress: 0,
      productType: "free_report",
      updatedAt: now,
      requestPayload: payload,
    });
    scheduleMockReportReady(reportId, 400);
    return { reportId, status: "queued", estimatedReadyAt: null };
  },

  async requestPaidReport(payload: AstroPaidReportRequest): Promise<AstroReportRequestResponse> {
    if (getAstroApiMode() === "remote") {
      const data = await astroFetch<Record<string, unknown>>("/v1/reports/paid", {
        method: "POST",
        body: JSON.stringify(toSnakePaidPayload(payload)),
      });
      return fromSnakeRequestResponse(data);
    }

    const reportId = `${payload.tenantId}-paid-${payload.productType}-${Date.now()}`;
    const now = new Date().toISOString();
    mockReportStore.set(reportId, {
      reportId,
      status: "queued",
      progress: 0,
      productType: payload.productType,
      updatedAt: now,
      requestPayload: payload,
    });
    scheduleMockReportReady(reportId, 600);
    return { reportId, status: "queued", estimatedReadyAt: null };
  },

  async getReportStatus(reportId: string): Promise<AstroReportStatusResponse> {
    if (getAstroApiMode() === "remote") {
      const data = await astroFetch<Record<string, unknown>>(`/v1/reports/${reportId}/status`);
      return fromSnakeStatusResponse(data);
    }

    const entry = mockReportStore.get(reportId);
    if (!entry) {
      throw new ApiClientError("report_not_found", `Report not found: ${reportId}`);
    }
    return {
      reportId,
      status: entry.status,
      progress: entry.progress,
      errorCode: entry.errorCode ?? null,
      errorMessage: entry.errorMessage ?? null,
      updatedAt: entry.updatedAt,
    };
  },

  async getReportResult(reportId: string): Promise<ReportV2> {
    if (getAstroApiMode() === "remote") {
      const data = await astroFetch<ReportV2>(`/v1/reports/${reportId}`);
      return data;
    }

    const entry = mockReportStore.get(reportId);
    if (!entry) {
      throw new ApiClientError("report_not_found", `Report not found: ${reportId}`);
    }
    if (entry.status !== "ready" || !entry.payload) {
      throw new ApiClientError(
        "report_generation_failed",
        `Report is not ready: ${entry.status}`
      );
    }
    return entry.payload;
  },

  async cancelReportRequest(reportId: string): Promise<void> {
    if (getAstroApiMode() === "remote") {
      await astroFetch(`/v1/reports/${reportId}/cancel`, { method: "POST" });
      return;
    }
    mockReportStore.delete(reportId);
  },

  /** @internal test helper */
  _resetMockStore(): void {
    mockReportStore.clear();
  },

  /** @internal test helper — force report to failed state */
  _setMockReportFailed(reportId: string, errorCode = "report_generation_failed"): void {
    const entry = mockReportStore.get(reportId);
    if (!entry) return;
    entry.status = "failed";
    entry.errorCode = errorCode;
    entry.errorMessage = "Mock report generation failed.";
    entry.updatedAt = new Date().toISOString();
  },
};

export type { AstroFreeReportRequest, AstroPaidReportRequest, AstroReportRequestResponse };
