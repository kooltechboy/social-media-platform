import { NextRequest, NextResponse } from 'next/server';
import { StripeAdapter, WebhookProcessor } from '@caribbean/spotpay';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const adapter = new StripeAdapter();
  const processor = new WebhookProcessor((p, s) => adapter.verifyWebhook(p, s));

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const outcome = processor.process({
    id: event.id,
    type: event.type,
    payload,
    signature,
  });

  if (!outcome.accepted) {
    return NextResponse.json({ error: outcome.reason }, { status: 400 });
  }

  if (outcome.duplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Handle specific Stripe events
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Here you would use PaymentIntentService to transition ledger state to 'succeeded'
      break;
    case 'payment_intent.payment_failed':
      console.log('Payment failed!');
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
