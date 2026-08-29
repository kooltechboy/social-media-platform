import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  initiateMfaLogin,
  setupMfa,
  validateMfaSession,
  verifyMfaChallenge,
} from '../../apps/web/src/lib/auth/actions';

const unsupportedMfaMessage =
  'Custom MFA actions are unavailable. Use Supabase Auth MFA after signing in.';

describe('custom MFA actions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects login initiation instead of accepting an arbitrary email identity', async () => {
    await expect(initiateMfaLogin('attacker@example.com')).rejects.toThrow(unsupportedMfaMessage);
  });

  it('rejects challenge verification for an arbitrary user ID', async () => {
    await expect(verifyMfaChallenge('arbitrary-user-id', '123456')).rejects.toThrow(
      unsupportedMfaMessage,
    );
  });

  it('rejects MFA setup for an arbitrary user ID', async () => {
    await expect(setupMfa('arbitrary-user-id', 'authenticator_app')).rejects.toThrow(
      unsupportedMfaMessage,
    );
  });

  it('rejects session validation for an arbitrary user ID', async () => {
    await expect(validateMfaSession('arbitrary-user-id', 'arbitrary-token')).rejects.toThrow(
      unsupportedMfaMessage,
    );
  });

  it('does not log secrets or OTP codes', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const secret = 'otpauth-secret-or-code';

    await expect(initiateMfaLogin(secret)).rejects.toThrow(unsupportedMfaMessage);
    await expect(verifyMfaChallenge('arbitrary-user-id', '123456')).rejects.toThrow(
      unsupportedMfaMessage,
    );
    await expect(setupMfa('arbitrary-user-id', 'authenticator_app')).rejects.toThrow(
      unsupportedMfaMessage,
    );

    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleLog.mock.calls.flat().join(' ')).not.toContain(secret);
  });
});
