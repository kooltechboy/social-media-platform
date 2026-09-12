/**
 * @file packages/sdk/src/errors.ts
 * @description Standardized SDK error classes with HTTP status mappings and retry-after hints.
 */

export class TukubiError extends Error {
  constructor(message: string, public statusCode?: number, public code?: string) {
    super(message);
    this.name = 'TukubiError';
  }
}

export class TukubiAuthenticationError extends TukubiError {
  constructor(message: string = 'Invalid or missing API key') {
    super(message, 401, 'AUTHENTICATION_REQUIRED');
    this.name = 'TukubiAuthenticationError';
  }
}

export class TukubiNotFoundError extends TukubiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'RESOURCE_NOT_FOUND');
    this.name = 'TukubiNotFoundError';
  }
}

export class TukubiRateLimitError extends TukubiError {
  constructor(message: string = 'Rate limit exceeded', public retryAfterSeconds: number = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'TukubiRateLimitError';
  }
}

export class TukubiValidationError extends TukubiError {
  constructor(message: string, public details?: unknown) {
    super(message, 400, 'VALIDATION_FAILED');
    this.name = 'TukubiValidationError';
  }
}

export class TukubiServerError extends TukubiError {
  constructor(message: string = 'TUKUBI server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
    this.name = 'TukubiServerError';
  }
}
