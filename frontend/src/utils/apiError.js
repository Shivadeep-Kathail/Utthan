/**
 * Normalized API error for safe UI rendering.
 *
 * Backend error shape: { status: 'fail'|'error', message: string, error?: object }
 * This utility normalizes Axios errors + backend responses into a consistent
 * shape that components can render without risk of exposing raw internals.
 */

/** Error code constants */
export const ERROR_CODES = Object.freeze({
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN',
});

/** Map HTTP status codes to semantic error codes */
const STATUS_CODE_MAP = {
  400: ERROR_CODES.VALIDATION,
  401: ERROR_CODES.UNAUTHORIZED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  409: ERROR_CODES.CONFLICT,
  422: ERROR_CODES.VALIDATION,
  429: ERROR_CODES.RATE_LIMITED,
};

/** User-friendly fallback messages by error code */
const FALLBACK_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Unable to connect. Please check your internet connection and try again.',
  [ERROR_CODES.VALIDATION]: 'The submitted data is invalid. Please check your input.',
  [ERROR_CODES.UNAUTHORIZED]: 'You need to be logged in to continue.',
  [ERROR_CODES.FORBIDDEN]: 'You don\'t have permission to perform this action.',
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODES.CONFLICT]: 'This action conflicts with existing data.',
  [ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
  [ERROR_CODES.SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
  [ERROR_CODES.UNKNOWN]: 'Something went wrong. Please try again.',
};

export class ApiError {
  constructor({ message, status, code, requestUrl }) {
    this.message = message;
    this.status = status;        // HTTP status code (number) or null for network errors
    this.code = code;            // Semantic error code string (e.g. 'UNAUTHORIZED')
    this.requestUrl = requestUrl; // The URL that was being requested
  }

  /** True if this is a network-level failure (no response received) */
  get isNetworkError() {
    return this.code === ERROR_CODES.NETWORK_ERROR;
  }

  /** True if the user is not authenticated */
  get isUnauthorized() {
    return this.code === ERROR_CODES.UNAUTHORIZED;
  }

  /** True if this is a server-side error (5xx) */
  get isServerError() {
    return this.code === ERROR_CODES.SERVER_ERROR;
  }

  /** True if the error is retryable (network or server errors) */
  get isRetryable() {
    return this.isNetworkError || this.isServerError || this.code === ERROR_CODES.RATE_LIMITED;
  }
}

/**
 * Normalize an Axios error into an ApiError.
 * Never exposes raw Axios error objects, stack traces, or internal details to the UI.
 */
export function normalizeError(axiosError) {
  // Cancelled requests (e.g. AbortController)
  if (axiosError?.code === 'ERR_CANCELED') {
    return new ApiError({
      message: 'Request was cancelled.',
      status: null,
      code: ERROR_CODES.UNKNOWN,
      requestUrl: axiosError.config?.url ?? null,
    });
  }

  // No response — network error
  if (!axiosError?.response) {
    return new ApiError({
      message: FALLBACK_MESSAGES[ERROR_CODES.NETWORK_ERROR],
      status: null,
      code: ERROR_CODES.NETWORK_ERROR,
      requestUrl: axiosError?.config?.url ?? null,
    });
  }

  const { status, data } = axiosError.response;
  const requestUrl = axiosError.config?.url ?? null;

  // Extract message from backend's { status, message } shape
  const backendMessage =
    typeof data?.message === 'string' && data.message.length > 0
      ? data.message
      : null;

  // Determine semantic code from status
  const code =
    STATUS_CODE_MAP[status] ??
    (status >= 500 ? ERROR_CODES.SERVER_ERROR : ERROR_CODES.UNKNOWN);

  return new ApiError({
    message: backendMessage ?? FALLBACK_MESSAGES[code] ?? FALLBACK_MESSAGES[ERROR_CODES.UNKNOWN],
    status,
    code,
    requestUrl,
  });
}
