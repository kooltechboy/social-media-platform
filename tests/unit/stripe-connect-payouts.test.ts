import { describe, it, expect, vi } from 'vitest';
import { StripeAdapter } from '../../packages/payments/src/adapters/stripe';

describe('StripeAdapter — Stripe Connect Marketplace & Creator Payout Rails', () => {
  describe('Unconfigured Adapter (Awaiting Production Credentials)', () => {
    const unconfigured = new StripeAdapter({ apiKey: '' });

    it('reports isConfigured = false when API key is missing', () => {
      expect(unconfigured.isConfigured).toBe(false);
    });

    it('returns a safe descriptive error when creating connect account without credentials', async () => {
      const res = await unconfigured.createConnectAccount({
        email: 'merchant@kingstonstore.com',
        country: 'JM',
      });
      expect(res.success).toBe(false);
      expect(res.errorMessage).toContain('Stripe credentials are unavailable');
    });

    it('returns a safe descriptive error when creating account link without credentials', async () => {
      const res = await unconfigured.createAccountLink({
        accountId: 'acct_123',
        refreshUrl: 'https://tukubi.com/refresh',
        returnUrl: 'https://tukubi.com/return',
      });
      expect(res.success).toBe(false);
      expect(res.errorMessage).toContain('Stripe credentials are unavailable');
    });

    it('returns a safe descriptive error when executing destination charge without credentials', async () => {
      const res = await unconfigured.createDestinationCharge({
        amountMinor: 5000,
        currency: 'USD',
        destinationAccountId: 'acct_123',
        applicationFeeMinor: 500,
        idempotencyKey: 'idemp_test_1',
      });
      expect(res.success).toBe(false);
      expect(res.errorMessage).toContain('Stripe credentials are unavailable');
    });

    it('returns a safe descriptive error when creating transfer payout without credentials', async () => {
      const res = await unconfigured.createTransfer({
        destinationAccountId: 'acct_123',
        amountMinor: 4500,
        currency: 'USD',
        idempotencyKey: 'idemp_test_2',
      });
      expect(res.success).toBe(false);
      expect(res.errorMessage).toContain('Stripe credentials are unavailable');
    });

    it('returns a safe descriptive error when retrieving account status without credentials', async () => {
      const res = await unconfigured.getAccountStatus('acct_123');
      expect(res.success).toBe(false);
      expect(res.errorMessage).toContain('Stripe credentials are unavailable');
    });
  });

  describe('Configured Adapter with Mocked Stripe SDK', () => {
    const mockApiKey = 'sk_test_mock_tukubi_secret_key_12345';
    const adapter = new StripeAdapter({ apiKey: mockApiKey, webhookSecret: 'whsec_test_secret' });

    it('reports isConfigured = true when API key is provided', () => {
      expect(adapter.isConfigured).toBe(true);
    });

    it('successfully creates an Express connected account when Stripe responds', async () => {
      const mockCreate = vi.fn().mockResolvedValue({ id: 'acct_mock_caribbean_456' });
      (adapter as any).stripeClient = {
        accounts: {
          create: mockCreate,
        },
      };

      const res = await adapter.createConnectAccount({
        email: 'creator@portofspain.tt',
        country: 'TT',
        businessType: 'individual',
        metadata: { tukubi_user_id: 'usr_789' },
      });

      expect(res.success).toBe(true);
      expect(res.accountId).toBe('acct_mock_caribbean_456');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'express',
          country: 'TT',
          email: 'creator@portofspain.tt',
          business_type: 'individual',
        })
      );
    });

    it('successfully creates an onboarding account link', async () => {
      const mockAccountLinks = vi.fn().mockResolvedValue({
        url: 'https://connect.stripe.com/setup/s/mock_session_url',
      });
      (adapter as any).stripeClient = {
        accountLinks: {
          create: mockAccountLinks,
        },
      };

      const res = await adapter.createAccountLink({
        accountId: 'acct_mock_caribbean_456',
        refreshUrl: 'https://tukubi.com/financial-center/merchant',
        returnUrl: 'https://tukubi.com/financial-center/merchant?payout_setup=success',
      });

      expect(res.success).toBe(true);
      expect(res.url).toBe('https://connect.stripe.com/setup/s/mock_session_url');
      expect(mockAccountLinks).toHaveBeenCalledWith(
        expect.objectContaining({
          account: 'acct_mock_caribbean_456',
          type: 'account_onboarding',
        })
      );
    });

    it('creates a destination charge with application fee and idempotency key', async () => {
      const mockPaymentIntents = vi.fn().mockResolvedValue({
        id: 'pi_mock_destination_123',
        status: 'succeeded',
      });
      (adapter as any).stripeClient = {
        paymentIntents: {
          create: mockPaymentIntents,
        },
      };

      const res = await adapter.createDestinationCharge({
        amountMinor: 10000,
        currency: 'USD',
        destinationAccountId: 'acct_seller_789',
        applicationFeeMinor: 1000, // 10% platform fee
        idempotencyKey: 'idemp_order_12345',
      });

      expect(res.success).toBe(true);
      expect(res.providerTransactionId).toBe('pi_mock_destination_123');
      expect(mockPaymentIntents).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000,
          currency: 'usd',
          application_fee_amount: 1000,
          transfer_data: { destination: 'acct_seller_789' },
        }),
        expect.objectContaining({
          idempotencyKey: 'idemp_order_12345',
        })
      );
    });

    it('creates a direct transfer payout with idempotency key', async () => {
      const mockTransfers = vi.fn().mockResolvedValue({
        id: 'tr_mock_payout_789',
      });
      (adapter as any).stripeClient = {
        transfers: {
          create: mockTransfers,
        },
      };

      const res = await adapter.createTransfer({
        destinationAccountId: 'acct_creator_101',
        amountMinor: 8500,
        currency: 'USD',
        idempotencyKey: 'idemp_payout_999',
        description: 'Creator Tip Payout',
      });

      expect(res.success).toBe(true);
      expect(res.transferId).toBe('tr_mock_payout_789');
      expect(mockTransfers).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 8500,
          destination: 'acct_creator_101',
          currency: 'usd',
        }),
        expect.objectContaining({
          idempotencyKey: 'idemp_payout_999',
        })
      );
    });

    it('retrieves live account status', async () => {
      const mockRetrieve = vi.fn().mockResolvedValue({
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      });
      (adapter as any).stripeClient = {
        accounts: {
          retrieve: mockRetrieve,
        },
      };

      const res = await adapter.getAccountStatus('acct_creator_101');
      expect(res.success).toBe(true);
      expect(res.chargesEnabled).toBe(true);
      expect(res.payoutsEnabled).toBe(true);
      expect(res.detailsSubmitted).toBe(true);
    });
  });
});
