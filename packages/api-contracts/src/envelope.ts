export interface ApiSuccessMeta {
  requestId?: string;
  timestamp?: string;
  warnings?: string[];
}

export interface ApiFailureMeta {
  requestId?: string;
  timestamp?: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
  fieldErrors?: Record<string, string[]>;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: ApiSuccessMeta;
}

export interface ApiFailure {
  ok: false;
  error: ApiErrorBody;
  meta?: ApiFailureMeta;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function isApiFailure<T>(response: ApiResponse<T>): response is ApiFailure {
  return response.ok === false;
}

export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return response.ok === true;
}

export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  if (isApiFailure(response)) {
    throw new Error(`${response.error.code}: ${response.error.message}`);
  }
  return response.data;
}
