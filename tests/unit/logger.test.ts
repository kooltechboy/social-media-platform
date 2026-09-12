import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StructuredLogger, createScopedLogger } from '../../apps/web/src/lib/logger';

describe('TUKUBI Structured JSON Logger', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('outputs RFC-compliant structured JSON logs', () => {
    const logger = new StructuredLogger({ module: 'test_module' });
    logger.info('System operational', { healthy: true });

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);

    expect(output.message).toBe('System operational');
    expect(output.level).toBe('info');
    expect(output.service).toBe('tukubi-web');
    expect(output.context.module).toBe('test_module');
    expect(output.context.healthy).toBe(true);
    expect(output.timestamp).toBeDefined();
  });

  it('strictly redacts sensitive PII, passwords, and tokens', () => {
    const logger = new StructuredLogger();
    logger.info('User authentication attempt', {
      username: 'carib_creator',
      password: 'SuperSecretPassword123!',
      token: 'jwt.header.payload',
      api_key: 'sk_live_secret_key',
    });

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output.context.password).toBe('[REDACTED]');
    expect(output.context.token).toBe('[REDACTED]');
    expect(output.context.api_key).toBe('[REDACTED]');
    expect(output.context.username).toBe('carib_creator');
  });

  it('routes errors to console.error with stack trace', () => {
    const logger = new StructuredLogger();
    const error = new Error('Database timeout');
    logger.error('Query failed', error, { queryId: 'q-99' });

    expect(consoleErrorSpy).toHaveBeenCalled();
    const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    expect(output.level).toBe('error');
    expect(output.context.error.message).toBe('Database timeout');
    expect(output.context.queryId).toBe('q-99');
  });
});
