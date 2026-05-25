export enum ApiErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  TENANT_NOT_FOUND = "TENANT_NOT_FOUND",
  TENANT_PAUSED = "TENANT_PAUSED",
  CONFIG_INVALID = "CONFIG_INVALID",
  REPORT_GENERATION_FAILED = "REPORT_GENERATION_FAILED",
  PRODUCT_NOT_FOUND = "PRODUCT_NOT_FOUND",
  DRAFT_CONFLICT = "DRAFT_CONFLICT",
  PUBLISH_FAILED = "PUBLISH_FAILED",
  RATE_LIMITED = "RATE_LIMITED",
  REMOTE_API_NOT_CONFIGURED = "REMOTE_API_NOT_CONFIGURED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class ApiClientError extends Error {
  constructor(
    public code: ApiErrorCode | string,
    message: string,
    public fieldErrors?: Record<string, string[]>,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function mapErrorMessageToCode(message: string): ApiErrorCode {
  const lower = message.toLowerCase();
  if (lower.includes("tenant not found")) return ApiErrorCode.TENANT_NOT_FOUND;
  if (lower.includes("tenant is paused")) return ApiErrorCode.TENANT_PAUSED;
  if (lower.includes("no published config")) return ApiErrorCode.NOT_FOUND;
  if (lower.includes("slug already exists")) return ApiErrorCode.VALIDATION_ERROR;
  if (lower.includes("product not found")) return ApiErrorCode.PRODUCT_NOT_FOUND;
  if (lower.includes("report not found")) return ApiErrorCode.NOT_FOUND;
  if (lower.includes("publish")) return ApiErrorCode.PUBLISH_FAILED;
  if (lower.includes("draft")) return ApiErrorCode.DRAFT_CONFLICT;
  return ApiErrorCode.UNKNOWN_ERROR;
}

export function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;
  if (error instanceof Error) {
    return new ApiClientError(mapErrorMessageToCode(error.message), error.message);
  }
  return new ApiClientError(ApiErrorCode.UNKNOWN_ERROR, "Unknown error");
}
