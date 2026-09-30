import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StructuredLogger, createScopedLogger } from '../../apps/web/src/lib/logger';

describe('Phase 22 — Observability, Sentry & Structured Audit Logs Certification', () => {
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // 1. Structured JSON Output & RFC Log Levels
  // ===========================================================================
  describe('1. Structured JSON Output & Severity Standards', () => {
    it('outputs compliant JSON logs with timestamp, service name, and context', () => {
      const logger = new StructuredLogger({ module: 'payments_audit' });
      logger.info('Double-entry ledger transaction completed', {
        transactionId: 'tx_carib_123',
        amountMinor: 5000,
        currency: 'USD',
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(output.level).toBe('info');
      expect(output.message).toBe('Double-entry ledger transaction completed');
      expect(output.service).toBe('tukubi-web');
      expect(output.context.module).toBe('payments_audit');
      expect(output.context.transactionId).toBe('tx_carib_123');
      expect(output.context.amountMinor).toBe(5000);
      expect(output.timestamp).toBeDefined();
    });

    it('routes warnings to console.warn with structured payload', () => {
      const logger = new StructuredLogger();
      logger.warn('Rate limit approaching for client IP', { ip: '190.213.1.1', count: 95 });

      expect(consoleWarnSpy).toHaveBeenCalled();
      const output = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(output.level).toBe('warn');
      expect(output.context.count).toBe(95);
    });
  });

  // ===========================================================================
  // 2. Sensitive Credential & PII Redaction
  // ===========================================================================
  describe('2. PII & Credential Masking Protections', () => {
    it('deeply sanitizes secrets, tokens, passwords, and payment card numbers', () => {
      const logger = new StructuredLogger();
      logger.info('Checkout attempt initiated', {
        user: 'trinidad_shopper',
        password: 'UnhashedPassword!@#',
        api_key: 'sk_live_caribbean_payments_secret',
        authorization: 'Bearer eyJhbGciOi...',
        credit_card: '4111222233334444',
        cvv: '123',
        nested: {
          token: 'sensitive_jwt_token',
          safeField: 'visible_data',
        },
      });

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.context.password).toBe('[REDACTED]');
      expect(output.context.api_key).toBe('[REDACTED]');
      expect(output.context.authorization).toBe('[REDACTED]');
      expect(output.context.credit_card).toBe('[REDACTED]');
      expect(output.context.cvv).toBe('[REDACTED]');
      expect(output.context.nested.token).toBe('[REDACTED]');
      expect(output.context.nested.safeField).toBe('visible_data');
    });
  });

  // ===========================================================================
  // 3. Error Capturing & Stack Tracing
  // ===========================================================================
  describe('3. Error Logging & Exception Serialization', () => {
    it('serializes native Error instances with stack traces into error level output', () => {
      const logger = new StructuredLogger();
      const boom = new Error('Database connection pool exhausted');
      logger.error('Database query timed out', boom, { queryTable: 'ledger_entries' });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(output.level).toBe('error');
      expect(output.message).toBe('Database query timed out');
      expect(output.context.error.name).toBe('Error');
      expect(output.context.error.message).toBe('Database connection pool exhausted');
      expect(output.context.error.stack).toBeDefined();
      expect(output.context.queryTable).toBe('ledger_entries');
    });

    it('handles fatal events with high-priority severity', () => {
      const logger = new StructuredLogger();
      logger.fatal('Service critical panic', new Error('Out of memory'));

      expect(consoleErrorSpy).toHaveBeenCalled();
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output.level).toBe('fatal');
      expect(output.context.error.message).toBe('Out of memory');
    });
  });

  // ===========================================================================
  // 4. Scoped Loggers & Module Context Inheritance
  // ===========================================================================
  describe('4. Scoped Loggers & Module Context', () => {
    it('inherits module name and default context in child loggers', () => {
      const scoped = createScopedLogger('trust_safety_engine', { subsystem: 'moderation' });
      scoped.info('Quarantine action dispatched', { caseId: 'case_404' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(output.context.module).toBe('trust_safety_engine');
      expect(output.context.subsystem).toBe('moderation');
      expect(output.context.caseId).toBe('case_404');
    });
  });
});
