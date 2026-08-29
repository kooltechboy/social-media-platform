import React from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import ConnectedAccountsList from '../../../components/financial-center/connected-accounts-list';
import { REGISTERED_PROVIDERS, type ConnectionState } from '@caribbean/payments';

export const dynamic = 'force-dynamic';

export default async function ConnectedAccountsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: dbConnections } = await supabase
    .from('payment_connections')
    .select('provider_id, connection_state, masked_account_identifier, connected_at, last_verified_at')
    .eq('user_id', user.id);

  const connectionMap = new Map((dbConnections ?? []).map((c: any) => [c.provider_id, c]));

  const connections = Object.values(REGISTERED_PROVIDERS).map((p) => {
    const userConn = connectionMap.get(p.id);

    return {
      providerId: p.id,
      name: p.name,
      connectionState: (userConn?.connection_state ?? (p.status === 'disabled' ? 'NOT_CONNECTED' : 'NOT_CONNECTED')) as ConnectionState,
      maskedIdentifier: userConn?.masked_account_identifier ?? null,
      connectedAt: userConn?.connected_at ?? null,
      lastVerifiedAt: userConn?.last_verified_at ?? null,
      capabilities: p.capabilities,
      isConfigured: p.status !== 'disabled',
      notes: p.notes,
    };
  });

  return <ConnectedAccountsList connections={connections} />;
}
