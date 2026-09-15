// PayPal Payment Service Provider Adapter

import type {
  PSPAdapter,
  PSPChargeParams,
  PSPChargeResult,
  PSPRefundParams,
  PSPRefundResult,
  PSPSubscriptionParams,
  PSPSubscriptionResult,
  PSPBillingPlanParams,
  PSPBillingPlanResult,
  PSPPayoutParams,
  PSPPayoutResult,
  WebhookVerifier,
} from './types';

export const CANONICAL_PAYPAL_PLANS: Record<string, string> = {
  user_premium: 'P-24422210GR093024NNKUOD7I',
  creator_plus: 'P-5V708726CT8509016NKUOD7Q',
  creator_pro: 'P-66G91342833329842NKUOD7Q',
  seller_pro: 'P-8HW87778RJ695940XNKUOD7Y',
  business_plus: 'P-21X48782YF5114038NKUOD7Y',
};

export interface PayPalAdapterConfig {
  clientId?: string;
  clientSecret?: string;
  environment?: 'sandbox' | 'live';
  webhookVerifier?: WebhookVerifier;
  webhookId?: string;
}

export class PayPalAdapter implements PSPAdapter {
  readonly providerName = 'paypal' as const;
  private clientId: string;
  private clientSecret: string;
  private environment: 'sandbox' | 'live';
  private webhookVerifier?: WebhookVerifier;

  private webhookId: string;

  constructor(config: PayPalAdapterConfig = {}) {
    this.clientId = config.clientId || (typeof process !== 'undefined' ? process.env?.PAYPAL_CLIENT_ID : '') || '';
    this.clientSecret = config.clientSecret || (typeof process !== 'undefined' ? process.env?.PAYPAL_CLIENT_SECRET : '') || '';
    this.environment = config.environment || (process.env?.NODE_ENV === 'production' ? 'live' : 'sandbox');
    this.webhookVerifier = config.webhookVerifier;
    this.webhookId = config.webhookId || (typeof process !== 'undefined' ? process.env?.PAYPAL_WEBHOOK_ID : '') || '';
  }

  get isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  async charge(params: PSPChargeParams): Promise<PSPChargeResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        providerTransactionId: '',
        providerName: this.providerName,
        status: 'error',
        errorMessage: 'PayPal credentials are unavailable',
      };
    }

    try {
      const baseUrl = this.environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

      // 1. Get access token
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!tokenRes.ok) {
        throw new Error(`PayPal auth failed with status ${tokenRes.status}`);
      }

      const tokenData = (await tokenRes.json()) as any;
      const accessToken = tokenData.access_token;

      // 2. Create Order
      const amountValue = (params.amountMinor / 100).toFixed(2);
      const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': params.idempotencyKey,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: params.idempotencyKey,
              amount: {
                currency_code: params.currency.toUpperCase(),
                value: amountValue,
              },
            },
          ],
          application_context: {
            return_url: params.returnUrl || 'https://tukubi.com/financial-center/transactions',
            cancel_url: params.cancelUrl || 'https://tukubi.com/financial-center',
          },
        }),
      });

      const orderData = (await orderRes.json()) as any;

      if (!orderRes.ok) {
        throw new Error(orderData.message || 'PayPal order creation failed');
      }

      const approveLink = orderData.links?.find((l: { rel: string }) => l.rel === 'approve')?.href;

      return {
        success: true,
        providerTransactionId: orderData.id,
        providerName: this.providerName,
        status: orderData.status === 'COMPLETED' ? 'succeeded' : 'pending',
        redirectUrl: approveLink,
        rawResponse: orderData,
      };
    } catch (err) {
      return {
        success: false,
        providerTransactionId: '',
        providerName: this.providerName,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'PayPal request error',
      };
    }
  }

  async refund(params: PSPRefundParams): Promise<PSPRefundResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        providerRefundId: '',
        providerName: this.providerName,
        status: 'failed',
        errorMessage: 'PayPal credentials are unavailable',
      };
    }

    try {
      const baseUrl = this.environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      const tokenData = (await tokenRes.json()) as any;
      const accessToken = tokenData.access_token;

      const refundRes = await fetch(`${baseUrl}/v2/payments/captures/${params.providerTransactionId}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': params.idempotencyKey,
        },
        body: JSON.stringify({
          amount: {
            value: (params.amountMinor / 100).toFixed(2),
            currency_code: params.currency.toUpperCase(),
          },
          note_to_payer: params.reason || 'TUKUBI Order Refund',
        }),
      });

      const refundData = (await refundRes.json()) as any;

      return {
        success: refundRes.ok,
        providerRefundId: refundData.id || `PAYPAL_REFUND_${params.idempotencyKey}`,
        providerName: this.providerName,
        status: refundData.status === 'COMPLETED' ? 'succeeded' : 'pending',
      };
    } catch (err) {
      return {
        success: false,
        providerRefundId: '',
        providerName: this.providerName,
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'PayPal refund error',
      };
    }
  }

  private async getAccessToken(): Promise<string> {
    const baseUrl = this.environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      throw new Error(`PayPal auth failed with status ${tokenRes.status}`);
    }

    const tokenData = (await tokenRes.json()) as any;
    return tokenData.access_token;
  }

  async captureOrder(orderId: string): Promise<any> {
    if (!this.isConfigured) throw new Error('PayPal credentials are unavailable');
    const baseUrl = this.environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const accessToken = await this.getAccessToken();

    const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as any;
      throw new Error(data.message || `PayPal capture failed with status ${res.status}`);
    }
    
    return res.json();
  }

  async createSubscription(params: PSPSubscriptionParams): Promise<PSPSubscriptionResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        providerSubscriptionId: '',
        providerName: this.providerName,
        status: 'error',
        errorMessage: 'PayPal credentials are unavailable',
      };
    }

    try {
      const baseUrl = this.environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
      const accessToken = await this.getAccessToken();
      const resolvedPlanId = CANONICAL_PAYPAL_PLANS[params.planId] || params.planId;

      const subRes = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: resolvedPlanId,
          custom_id: params.customId || params.subscriberId,
          subscriber: params.subscriberEmail ? { email_address: params.subscriberEmail } : undefined,
          application_context: {
            return_url: params.returnUrl || 'https://tukubi.com/financial-center/subscriptions',
            cancel_url: params.cancelUrl || 'https://tukubi.com/financial-center',
            brand_name: 'TUKUBI',
            user_action: 'SUBSCRIBE_NOW',
          },
        }),
      });

      const subData = (await subRes.json()) as any;
      if (!subRes.ok) {
        throw new Error(subData.message || subData.details?.[0]?.description || 'PayPal subscription creation failed');
      }

      const approveLink = subData.links?.find((l: { rel: string }) => l.rel === 'approve')?.href;

      return {
        success: true,
        providerSubscriptionId: subData.id,
        providerName: this.providerName,
        status: subData.status === 'ACTIVE' ? 'active' : 'pending',
        approvalUrl: approveLink,
        rawResponse: subData,
      };
    } catch (err) {
      return {
        success: false,
        providerSubscriptionId: '',
        providerName: this.providerName,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'PayPal subscription request failed',
      };
    }
  }

  async createBillingPlan(params: PSPBillingPlanParams): Promise<PSPBillingPlanResult> {
    if (!this.isConfigured) {
      return { success: false, providerPlanId: '', errorMessage: 'PayPal credentials are unavailable' };
    }

    try {
      const baseUrl = this.environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
      const accessToken = await this.getAccessToken();

      // 1. Create product in PayPal catalog
      const prodRes = await fetch(`${baseUrl}/v1/catalogs/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: params.name,
          description: params.description || 'Creator tier on TUKUBI',
          type: 'DIGITAL',
          category: 'ONLINE_SERVICES',
        }),
      });

      const prodData = (await prodRes.json()) as any;
      if (!prodRes.ok) {
        throw new Error(prodData.message || 'Failed to create PayPal catalog product');
      }

      const productId = prodData.id;

      // 2. Create the billing plan
      const planRes = await fetch(`${baseUrl}/v1/billing/plans`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          name: params.name,
          description: params.description || 'Recurring subscription on TUKUBI',
          status: 'ACTIVE',
          billing_cycles: [
            {
              frequency: {
                interval_unit: params.billingInterval === 'annual' ? 'YEAR' : 'MONTH',
                interval_count: 1,
              },
              tenure_type: 'REGULAR',
              sequence: 1,
              total_cycles: 0,
              pricing_scheme: {
                fixed_price: {
                  value: (params.priceMinor / 100).toFixed(2),
                  currency_code: (params.currency || 'USD').toUpperCase(),
                },
              },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee_failure_action: 'CONTINUE',
            payment_failure_threshold: 3,
          },
        }),
      });

      const planData = (await planRes.json()) as any;
      if (!planRes.ok) {
        throw new Error(planData.message || 'Failed to create PayPal billing plan');
      }

      return {
        success: true,
        providerPlanId: planData.id,
        providerProductId: productId,
      };
    } catch (err) {
      return {
        success: false,
        providerPlanId: '',
        errorMessage: err instanceof Error ? err.message : 'PayPal billing plan creation failed',
      };
    }
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<{ success: boolean; errorMessage?: string }> {
    if (!this.isConfigured) {
      return { success: false, errorMessage: 'PayPal credentials are unavailable' };
    }

    try {
      const baseUrl = this.environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
      const accessToken = await this.getAccessToken();

      const res = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason || 'Customer requested cancellation on TUKUBI',
        }),
      });

      if (res.status === 204 || res.ok) {
        return { success: true };
      }

      const data = (await res.json().catch(() => ({}))) as any;
      return { success: false, errorMessage: data.message || `Cancel failed with status ${res.status}` };
    } catch (err) {
      return { success: false, errorMessage: err instanceof Error ? err.message : 'Subscription cancel error' };
    }
  }

  async getSubscription(subscriptionId: string): Promise<{ status: string; currentPeriodEnd?: string; raw?: unknown }> {
    if (!this.isConfigured) throw new Error('PayPal credentials are unavailable');
    const baseUrl = this.environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const accessToken = await this.getAccessToken();

    const res = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch subscription status: ${res.status}`);
    }

    const data = (await res.json()) as any;
    return {
      status: data.status,
      currentPeriodEnd: data.billing_info?.next_billing_time,
      raw: data,
    };
  }

  async createPayout(params: PSPPayoutParams): Promise<PSPPayoutResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        providerPayoutId: '',
        providerName: this.providerName,
        status: 'failed',
        errorMessage: 'PayPal credentials are unavailable',
      };
    }

    try {
      const baseUrl = this.environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
      const accessToken = await this.getAccessToken();

      const res = await fetch(`${baseUrl}/v1/payments/payouts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': params.idempotencyKey,
        },
        body: JSON.stringify({
          sender_batch_header: {
            sender_batch_id: `batch_${params.idempotencyKey}`,
            email_subject: 'You have a disbursement from TUKUBI',
            email_message: params.note || 'TUKUBI verified creator earnings disbursement',
          },
          items: [
            {
              recipient_type: 'EMAIL',
              amount: {
                value: (params.amountMinor / 100).toFixed(2),
                currency: params.currency.toUpperCase(),
              },
              receiver: params.recipientEmail || params.recipientId,
              note: params.note || 'TUKUBI earnings payout',
              sender_item_id: params.idempotencyKey,
            },
          ],
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.message || data.details?.[0]?.issue || 'PayPal payout request failed');
      }

      return {
        success: true,
        providerPayoutId: data.batch_header?.payout_batch_id || `PAYPAL_PAYOUT_${params.idempotencyKey}`,
        providerName: this.providerName,
        status: data.batch_header?.batch_status === 'SUCCESS' ? 'succeeded' : 'pending',
        rawResponse: data,
      };
    } catch (err) {
      return {
        success: false,
        providerPayoutId: '',
        providerName: this.providerName,
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'Payout request error',
      };
    }
  }

  async verifyWebhook(payload: string, headers: any): Promise<boolean> {
    if (this.webhookVerifier) {
      return this.webhookVerifier(payload, headers);
    }
    if (!this.isConfigured || !this.webhookId) {
      // In development or test where PayPal webhook isn't configured, safely reject unauthenticated calls
      return false;
    }

    try {
      const token = await this.getAccessToken();
      const baseUrl = this.environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

      const getHeader = (name: string): string => {
        if (!headers) return '';
        if (typeof headers.get === 'function') return headers.get(name) || '';
        return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()] || '';
      };

      const authAlgo = getHeader('paypal-auth-algo');
      const certUrl = getHeader('paypal-cert-url');
      const transmissionId = getHeader('paypal-transmission-id');
      const transmissionSig = getHeader('paypal-transmission-sig');
      const transmissionTime = getHeader('paypal-transmission-time');

      if (!authAlgo || !certUrl || !transmissionId || !transmissionSig) {
        return false;
      }
      
      const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: this.webhookId,
          webhook_event: typeof payload === 'string' ? JSON.parse(payload) : payload,
        }),
      });
      
      if (!response.ok) return false;
      const data = (await response.json()) as { verification_status: string };
      return data.verification_status === 'SUCCESS';
    } catch {
      return false;
    }
  }
}

