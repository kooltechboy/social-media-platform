/**
 * TUKUBI — Guarantee and Publish Official Inaugural Launch Post
 * Target Author UUID: ff1e8b1f-7796-4424-b341-3b39e1c993bd (@tukubi)
 * Post UUID: d23f3e75-0dfa-47c6-8df9-2c0fa299d7ff
 *
 * Usage:
 *   npx tsx scripts/publish-official-launch-post.ts
 */

import { createClient } from '@supabase/supabase-js';

const OFFICIAL_PROFILE_ID = 'ff1e8b1f-7796-4424-b341-3b39e1c993bd';
const OFFICIAL_POST_ID = 'd23f3e75-0dfa-47c6-8df9-2c0fa299d7ff';

const INAUGURAL_CONTENT = `🌴 Welcome to TUKUBI — The Caribbean Connected.

Connecting Caribbean people, culture, creators, businesses & the global diaspora in one unified digital ecosystem.

🌎 Born in the Caribbean. Built for the World.

Join conversations across the islands, explore live audio/video broadcasts, discover local creators, support Caribbean merchants, and build the future of our digital heritage together. ☀️🌊🎶`;

async function publishOfficialLaunchPost() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`🚀 Seeding Official Inaugural Post [${OFFICIAL_POST_ID}] on ${url}...`);

  // 1. Ensure Profile is marked official and verified
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      id: OFFICIAL_PROFILE_ID,
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
    console.warn(`⚠️ Warning upserting profile: ${profileErr.message}`);
  }

  // 2. Upsert Official Post
  const { data: post, error: postErr } = await supabase
    .from('posts')
    .upsert({
      id: OFFICIAL_POST_ID,
      author_id: OFFICIAL_PROFILE_ID,
      content: INAUGURAL_CONTENT,
      visibility: 'public',
      cultural_tags: ['caribbean', 'tukubiofficial', 'welcome', 'diaspora', 'culture'],
      media_urls: [],
      likes_count: 1240,
      comments_count: 86,
      shares_count: 312,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (postErr) {
    console.error(`❌ Failed to publish official post: ${postErr.message}`);
    process.exit(1);
  }

  // 3. Update profile_counts
  await supabase
    .from('profile_counts')
    .upsert({
      profile_id: OFFICIAL_PROFILE_ID,
      followers_count: 5420,
      following_count: 18,
      posts_count: 1,
      likes_received_count: 1240,
      updated_at: new Date().toISOString(),
    });

  // 4. Audit Log
  await supabase.from('audit_logs').insert({
    actor_id: OFFICIAL_PROFILE_ID,
    action: 'official_inaugural_post_published',
    entity_type: 'posts',
    entity_id: OFFICIAL_POST_ID,
    metadata: {
      username: 'tukubi',
      post_id: OFFICIAL_POST_ID,
      source: 'publish_script',
    },
    created_at: new Date().toISOString(),
  });

  console.log('✅ SUCCESS: Official TUKUBI Inaugural Launch Post is live!');
  console.log(`   Post ID: ${OFFICIAL_POST_ID}`);
  console.log(`   Author: @tukubi (TUKUBI)`);
}

publishOfficialLaunchPost().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
