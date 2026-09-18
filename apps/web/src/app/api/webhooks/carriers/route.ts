import { NextRequest, NextResponse } from 'next/server';
import { normalizeCarrierWebhookStatus } from '@caribbean/marketplace';
import { createServiceSupabaseClient } from '../../../../lib/supabase/server';

interface CarrierWebhookPayload {
  carrierCode?: string;
  carrier_code?: string;
  carrier?: string;
  trackingNumber?: string;
  tracking_number?: string;
  tracking_id?: string;
  status?: string;
  rawStatus?: string;
  event_type?: string;
  location?: string;
  description?: string;
  notes?: string;
  message?: string;
  timestamp?: string;
}

export async function POST(req: NextRequest) {
  const secretHeader =
    req.headers.get('x-carrier-webhook-secret') ||
    req.headers.get('authorization')?.replace('Bearer ', '');

  const expectedSecret = process.env.CARRIER_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'Carrier webhook endpoint is not configured (missing secret)' },
      { status: 503 }
    );
  }

  if (secretHeader !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid carrier webhook secret' },
      { status: 401 }
    );
  }

  let body: CarrierWebhookPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const carrierCode = (
    body.carrierCode ||
    body.carrier_code ||
    body.carrier ||
    ''
  ).toLowerCase().trim();

  const trackingNumber = (
    body.trackingNumber ||
    body.tracking_number ||
    body.tracking_id ||
    ''
  ).trim();

  const rawStatus = (
    body.status ||
    body.rawStatus ||
    body.event_type ||
    ''
  ).trim();

  if (!carrierCode || !trackingNumber || !rawStatus) {
    return NextResponse.json(
      {
        error: 'Missing required carrier tracking fields: carrierCode, trackingNumber, status',
      },
      { status: 422 }
    );
  }

  const milestoneStatus = normalizeCarrierWebhookStatus(carrierCode, rawStatus);
  
  // Map domain milestone to database shipment status constraint
  let dbStatus: 'label_created' | 'in_transit' | 'customs_hold' | 'out_for_delivery' | 'delivered' | 'exception' = 'in_transit';
  if (milestoneStatus === 'delivered') {
    dbStatus = 'delivered';
  } else if (milestoneStatus === 'out_for_delivery') {
    dbStatus = 'out_for_delivery';
  } else if (milestoneStatus === 'exception') {
    dbStatus = 'exception';
  } else if (milestoneStatus === 'order_placed') {
    dbStatus = 'label_created';
  } else if (rawStatus.toLowerCase().includes('hold') || rawStatus.toLowerCase().includes('detained')) {
    dbStatus = 'customs_hold';
  } else {
    dbStatus = 'in_transit';
  }

  const location = body.location?.trim() || 'Regional Logistics Hub';
  const description =
    body.description?.trim() ||
    body.notes?.trim() ||
    body.message?.trim() ||
    `Status updated to ${dbStatus} (${milestoneStatus}) by ${carrierCode.toUpperCase()}`;
  const timestamp = body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString();

  const supabase = await createServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Internal carrier ingestion service unavailable' },
      { status: 503 }
    );
  }

  const { data, error } = await supabase.rpc('ingest_carrier_tracking_event', {
    p_carrier_code: carrierCode,
    p_tracking_number: trackingNumber,
    p_status: dbStatus,
    p_location: location,
    p_description: description,
    p_timestamp: timestamp,
  });

  if (error) {
    console.error('[CarrierWebhook] Ingestion RPC error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as {
    success: boolean;
    error?: string;
    shipment_id?: string;
    order_id?: string;
    new_status?: string;
  };

  if (!result.success) {
    return NextResponse.json(
      {
        received: false,
        error: result.error || 'Shipment not found or could not be updated.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    received: true,
    carrier: carrierCode,
    trackingNumber,
    status: dbStatus,
    milestone: milestoneStatus,
    shipmentId: result.shipment_id,
    orderId: result.order_id,
  });
}
