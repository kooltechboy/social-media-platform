// PayPal Payment Service Provider Adapter

import type { PSPAdapter, PSPChargeParams, PSPChargeResult, PSPRefundParams, PSPRefundResult, WebhookVerifier } from './types';

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

  async verifyWebhook(payload: string, headers: any): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const baseUrl = this.environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
      
      const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'] ?? headers['PAYPAL-AUTH-ALGO'],
          cert_url: headers['paypal-cert-url'] ?? headers['PAYPAL-CERT-URL'],
          transmission_id: headers['paypal-transmission-id'] ?? headers['PAYPAL-TRANSMISSION-ID'],
          transmission_sig: headers['paypal-transmission-sig'] ?? headers['PAYPAL-TRANSMISSION-SIG'],
          transmission_time: headers['paypal-transmission-time'] ?? headers['PAYPAL-TRANSMISSION-TIME'],
          webhook_id: this.webhookId,
          webhook_event: JSON.parse(payload),
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
