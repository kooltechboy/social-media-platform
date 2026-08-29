import { NextResponse } from 'next/server';
import { ProviderRegistry } from '@caribbean/payments';

export const dynamic = 'force-dynamic';

export async function GET() {
  const registry = new ProviderRegistry();
  const providers = registry.listAllDefinitions();

  return NextResponse.json({
    success: true,
    providers,
  });
}
