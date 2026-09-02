/**
 * TUKUBI — Connect Supabase Auth Identity to Official @tukubi Profile
 * Target Auth UUID: ff1e8b1f-7796-4424-b341-3b39e1c993bd
 *
 * Usage:
 *   npx tsx scripts/connect-official-account.ts
 */

import { createClient } from '@supabase/supabase-js';

const TARGET_AUTH_UUID = 'ff1e8b1f-7796-4424-b341-3b39e1c993bd';

async function connectOfficialAccount() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`🔗 Connecting Auth User [${TARGET_AUTH_UUID}] to official @tukubi profile on ${url}...`);

  // 1. Authorize reserved username 'tukubi' for this UUID
  const { error: reserveErr } = await supabase
    .from('reserved_usernames')
    .upsert({
      username: 'tukubi',
      reason: 'Primary Official Platform Account',
      allow_profile_id: TARGET_AUTH_UUID,
    });

  if (reserveErr) {
    console.warn(`⚠️ Warning updating reserved_usernames: ${reserveErr.message}`);
  }

  // 2. Upsert profile record
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      id: TARGET_AUTH_UUID,
      username: 'tukubi',
      display_name: 'TUKUBI',
      bio: '🌴 The Caribbean Connected.\nConnecting Caribbean people, culture, creators, businesses & the global diaspora.\n🌎 Born in the Caribbean. Built for the World.',
      account_type: 'organization',
      is_official: true,
      is_verified: true,
      is_system_account: true,
      is_private: false,
      status: 'active',
      updated_at: new Date().toISOString(),
    });

  if (profileErr) {
    console.error(`❌ Failed to upsert profile: ${profileErr.message}`);
    process.exit(1);
  }

  // 3. Upsert profile_counts
  await supabase
    .from('profile_counts')
    .upsert({
      profile_id: TARGET_AUTH_UUID,
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      likes_received_count: 0,
      updated_at: new Date().toISOString(),
    });

  // 4. Upsert notification preferences
  await supabase
    .from('notification_preferences')
    .upsert({
      profile_id: TARGET_AUTH_UUID,
    });

  // 5. Register in official_accounts
  const { data: officialAcc, error: offErr } = await supabase
    .from('official_accounts')
    .upsert({
      profile_id: TARGET_AUTH_UUID,
      classification: 'official_platform',
      department: 'Executive & Platform Communications',
      status: 'active',
      is_system_account: true,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (offErr) {
    console.error(`❌ Failed to upsert official_accounts record: ${offErr.message}`);
    process.exit(1);
  }

  // 6. Audit log
  await supabase.from('audit_logs').insert({
    actor_id: TARGET_AUTH_UUID,
    action: 'official_account_connected',
    entity_type: 'profiles',
    entity_id: TARGET_AUTH_UUID,
    metadata: {
      username: 'tukubi',
      display_name: 'TUKUBI',
      classification: 'official_platform',
      official_account_id: officialAcc?.id,
      source: 'connect_script',
    },
    created_at: new Date().toISOString(),
  });

  console.log('✅ SUCCESS: Auth user successfully connected to official @tukubi profile!');
  console.log(`   Username: @tukubi`);
  console.log(`   Display Name: TUKUBI`);
  console.log(`   Classification: official_platform`);
  console.log(`   Official Account ID: ${officialAcc?.id}`);
}

connectOfficialAccount().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
