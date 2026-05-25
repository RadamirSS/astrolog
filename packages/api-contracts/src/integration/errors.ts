export const INTEGRATION_ERROR_CODES = [
  "missing_remote_config",
  "invalid_birth_data",
  "report_generation_failed",
  "report_not_found",
  "astro_api_timeout",
  "astro_api_unavailable",
  "astro_api_invalid_response",
  "payment_create_failed",
  "payment_status_failed",
  "payment_cancelled",
  "payment_expired",
  "payment_failed",
  "payment_api_timeout",
  "payment_api_unavailable",
  "payment_api_invalid_response",
  "entitlement_not_found",
  "entitlement_revoked",
  "entitlement_not_ready",
  "access_denied",
  "auth_not_configured",
  "order_not_found",
] as const;

export type IntegrationErrorCode = (typeof INTEGRATION_ERROR_CODES)[number];

export interface IntegrationError {
  code: IntegrationErrorCode;
  message: string;
  externalCode?: string | null;
  externalMessage?: string | null;
}
