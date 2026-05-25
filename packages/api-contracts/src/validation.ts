import { z } from "zod";
import {
  productConfigSchema,
  reportSchema,
  tenantConfigSchema,
  tenantConfigStatusSchema,
} from "@astro/tenant-config";
import type { ApiResponse } from "./envelope";
import { isApiFailure, unwrapApiResponse } from "./envelope";
import { ApiClientError, ApiErrorCode } from "./errors";

export function validateOrThrow<T>(
  schema: z.ZodType<T>,
  data: unknown,
  errorCode: ApiErrorCode = ApiErrorCode.CONFIG_INVALID
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw new ApiClientError(
    errorCode,
    "Response validation failed",
    undefined,
    result.error.flatten()
  );
}

export function parseApiResponse<T>(
  response: ApiResponse<unknown>,
  schema: z.ZodType<T>,
  errorCode: ApiErrorCode = ApiErrorCode.CONFIG_INVALID
): T {
  if (isApiFailure(response)) {
    throw new ApiClientError(
      response.error.code,
      response.error.message,
      response.error.fieldErrors,
      response.error.details
    );
  }
  return validateOrThrow(schema, response.data, errorCode);
}

export function parseEnvelopeData<T>(
  response: ApiResponse<unknown>,
  schema: z.ZodType<T>,
  errorCode: ApiErrorCode = ApiErrorCode.CONFIG_INVALID
): T {
  const data = unwrapApiResponse(response);
  return validateOrThrow(schema, data, errorCode);
}

export const tenantConfigResponseSchema = tenantConfigSchema;
export const tenantConfigStatusResponseSchema = tenantConfigStatusSchema;
export const productResponseSchema = productConfigSchema;
export const reportResponseSchema = reportSchema;
