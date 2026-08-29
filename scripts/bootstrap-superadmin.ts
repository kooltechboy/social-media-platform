/**
 * TUKUBI — Secure Super Admin Bootstrap Script
 * 
 * Usage:
 *   SUPERADMIN_EMAIL="admin@tukubi.io" \
 *   SUPERADMIN_USERNAME="superadmin" \
 *   SUPERADMIN_NAME="Chief Administrator" \
 *   SUPERADMIN_PASSWORD="SecureMasterPassword123!" \
 *   npx tsx scripts/bootstrap-superadmin.ts
 *
 * Security:
 * - Checks that zero Super Admins exist in PostgreSQL before creating.
 * - Idempotent and fails permanently once any Super Admin is active.
 * - Records action directly in immutable public.audit_logs.
 */

import { createClient } from '@supabase/supabase-js';

async function bootstrap() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
    process.exit(1);
  }

  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const username = process.env.SUPERADMIN_USERNAME?.trim().toLowerCase();
  const displayName = process.env.SUPERADMIN_NAME?.trim() || 'Chief Administrator';
  const password = process.env.SUPERADMIN_PASSWORD?.trim();

  if (!email || !username || !password) {
    console.error('❌ Error: SUPERADMIN_EMAIL, SUPERADMIN_USERNAME, and SUPERADMIN_PASSWORD are required.');
    console.log('Example:');
    console.log('  SUPERADMIN_EMAIL="admin@domain.com" SUPERADMIN_USERNAME="rootadmin" SUPERADMIN_PASSWORD="MySecretPassword123" npx tsx scripts/bootstrap-superadmin.ts');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`🔍 Checking for existing Super Admins on ${url}...`);

  const { count: existingCount, error: countErr } = await supabase
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .in('role', ['super_admin', 'superadmin', 'management']);

  if (countErr) {
    console.error(`❌ Database check failed: ${countErr.message}`);
    process.exit(1);
  }

  if ((existingCount ?? 0) > 0) {
    console.error('🛑 ABORTED: A Super Admin already exists in the database.');
    console.error('For security, additional administrators must be created by an active Super Admin in /admin/administrators.');
    process.exit(1);
  }

  console.log(`⚙️ Creating Supabase Auth user for ${email}...`);

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: displayName },
  });

  let userId: string;
  if (authErr) {
    if (authErr.message.toLowerCase().includes('already registered')) {
      const { data: userProfile } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
      if (userProfile) {
        userId = userProfile.id;
      } else {
        console.error(`❌ User with email ${email} already exists in auth.users.`);
        process.exit(1);
      }
    } else {
      console.error(`❌ Failed to create auth user: ${authErr.message}`);
      process.exit(1);
    }
  } else {
    userId = authData.user.id;
  }

  console.log(`🛡️ Invoking database bootstrap procedure public.bootstrap_super_admin()...`);

  const { data: rpcResult, error: rpcErr } = await supabase.rpc('bootstrap_super_admin', {
    p_user_id: userId,
    p_username: username,
    p_display_name: displayName,
    p_notes: 'Bootstrapped via CLI script',
  });

  if (rpcErr) {
    console.error(`❌ Database RPC bootstrap failed: ${rpcErr.message}`);
    process.exit(1);
  }

  console.log('✅ Super Admin bootstrap completed successfully!');
  console.log(`👤 Username: @${username}`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Role: super_admin`);
  console.log(`🏛️ Access the Admin Console at /login → /admin`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
