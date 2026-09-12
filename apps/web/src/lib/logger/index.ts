/**
 * TUKUBI Enterprise Structured JSON Logger
 * RFC 5424 log levels, OpenTelemetry-aligned context, automatic PII/credential redaction,
 * and seamless Sentry integration for Fortune-100 production observability.
 */

import * as Sentry from '@sentry/nextjs';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'authorization',
  'cookie',
  'set-cookie',
  'api_key',
  'apikey',
  'private_key',
  'credit_card',
  'card_number',
  'cvv',
  'cvc',
  'national_id',
  'ssn',
  'dob',
]);

/**
 * Deep redaction of sensitive credentials and PII.
 */
function redact(obj: unknown, depth: number = 0): unknown {
  if (depth > 6) return '[MAX_DEPTH]';
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, depth + 1));
  }

  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('secret') || lowerKey.includes('password')) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = redact(val, depth + 1);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

export interface LogContext {
  module?: string;
  userId?: string;
  requestId?: string;
  traceId?: string;
  [key: string]: unknown;
}

export class StructuredLogger {
  private minLevelSeverity: number;

  constructor(private defaultContext: LogContext = {}) {
    const envLevel = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')) as LogLevel;
    this.minLevelSeverity = LOG_LEVEL_SEVERITY[envLevel] || 30;
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const severity = LOG_LEVEL_SEVERITY[level];
    if (severity < this.minLevelSeverity) return;

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: redact({ ...this.defaultContext, ...meta }),
      environment: process.env.NODE_ENV || 'development',
      service: 'tukubi-web',
    };

    const serialized = JSON.stringify(payload);

    if (level === 'error' || level === 'fatal') {
      console.error(serialized);
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        try {
          const extra = payload.context as Record<string, unknown>;
          Sentry.captureMessage(message, {
            level: level === 'fatal' ? 'fatal' : 'error',
            extra,
          });
        } catch {
          // Ignore Sentry errors
        }
      }
    } else if (level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  trace(message: string, meta?: Record<string, unknown>): void {
    this.write('trace', message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write('warn', message, meta);
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const errObj = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { rawError: error };

    this.write('error', message, { ...meta, error: errObj });
  }

  fatal(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const errObj = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { rawError: error };

    this.write('fatal', message, { ...meta, error: errObj });
  }

  child(context: LogContext): StructuredLogger {
    return new StructuredLogger({ ...this.defaultContext, ...context });
  }
}

export const logger = new StructuredLogger();

export function createScopedLogger(moduleName: string, context: LogContext = {}): StructuredLogger {
  return logger.child({ module: moduleName, ...context });
}
