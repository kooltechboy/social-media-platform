const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getToken() {
  return execSync('powershell -NoProfile -ExecutionPolicy Bypass -File scripts/get-token.ps1').toString().trim();
}

async function runQuery(sql) {
  const token = getToken();
  const projectRef = 'qixlaqwohhrynownvqwp';
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Query failed [${res.status}]: ${text}`);
  }

  return await res.json();
}

async function main() {
  console.log('===============================================================');
  console.log('  TUKUBI Enterprise Database Migration Engine');
  console.log('  Target: Supabase Project qixlaqwohhrynownvqwp (us-east-1)');
  console.log('===============================================================\n');

  // 1. Fetch remote migration tracking table
  console.log('Fetching remote applied migrations from supabase_migrations.schema_migrations...');
  const appliedRows = await runQuery('SELECT version FROM supabase_migrations.schema_migrations;');
  const appliedSet = new Set(appliedRows.map(r => r.version));
  console.log(`Found ${appliedSet.size} applied versions in remote database.\n`);

  // 2. Discover local migrations
  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
  const allFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log(`Found ${allFiles.length} total migration files in ${migrationsDir}.\n`);

  // 3. Build execution sequence
  // Note: If 00071 was applied before 00070, we also re-apply 00071 after 00070 to ensure its latest definition
  const sequence = [];
  for (const file of allFiles) {
    const match = file.match(/^([0-9]+)_/);
    if (!match) continue;
    const version = match[1];
    if (!appliedSet.has(version)) {
      sequence.push({ version, file, path: path.join(migrationsDir, file) });
    }
  }

  // Also verify if 00071 should be refreshed
  const has00071 = allFiles.find(f => f.startsWith('00071_'));
  const needs00071Reapply = sequence.some(m => m.version === '00070') && has00071;

  console.log(`Discovered ${sequence.length} pending migrations to apply:`);
  sequence.forEach(m => console.log(`  - [${m.version}] ${m.file}`));
  if (needs00071Reapply) {
    console.log(`  - [00071] (Re-apply after 00070 to guarantee latest RLS & RPC state)`);
  }
  console.log('\nStarting sequential migration execution...\n');

  let appliedCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < sequence.length; i++) {
    const item = sequence[i];
    const fileSql = fs.readFileSync(item.path, 'utf8');

    console.log(`[${i + 1}/${sequence.length}] Applying ${item.version}: ${item.file}...`);
    const fileStartTime = Date.now();

    try {
      await runQuery(fileSql);
      const elapsed = Date.now() - fileStartTime;
      console.log(`  ✓ SQL executed successfully (${elapsed} ms)`);

      // Record in schema_migrations
      const trackSql = `INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('${item.version}') ON CONFLICT (version) DO NOTHING;`;
      await runQuery(trackSql);
      console.log(`  ✓ Registered version ${item.version} in schema_migrations`);
      appliedCount++;

      // If this was 00070 and 00071 needs re-applying
      if (item.version === '00070' && needs00071Reapply) {
        console.log(`\nRe-applying 00071 to ensure latest messaging RLS & RPC definitions...`);
        const sql00071 = fs.readFileSync(path.join(migrationsDir, has00071), 'utf8');
        await runQuery(sql00071);
        console.log(`  ✓ 00071 re-applied successfully\n`);
      }
    } catch (err) {
      console.error(`\n❌ ERROR in migration ${item.version} (${item.file}):`);
      console.error(err.message);
      console.error('\nStopping migration runner. Fix the issue and resume.');
      process.exit(1);
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n===============================================================`);
  console.log(`  All ${appliedCount} migrations applied successfully in ${totalElapsed}s!`);
  console.log(`===============================================================\n`);

  // 4. Verification of database state
  console.log('Running post-migration verification checks...');
  
  const finalVersions = await runQuery('SELECT COUNT(*) as total FROM supabase_migrations.schema_migrations;');
  console.log(`  ✓ Total registered versions: ${finalVersions[0].total}`);

  // Check critical tables
  const criticalTables = [
    'official_accounts',
    'official_post_drafts',
    'reserved_usernames',
    'content_repurpose_cache',
    'scheduled_posts',
    'creator_team_members',
    'interactive_polls',
    'poll_votes',
    'age_verifications',
    'audio_spaces',
    'user_relationships',
    'caribbean_territories',
    'marketplace_categories',
    'marketplace_offers',
    'marketplace_disputes',
    'marketplace_affiliate_links',
    'livestream_products',
    'marketplace_shipments',
    'analytics_events',
    'feed_activity_timeline',
    'chat_messages_partitioned'
  ];

  const tableCheckSql = `SELECT relname FROM pg_class WHERE relname IN (${criticalTables.map(t => `'${t}'`).join(', ')});`;
  const existingTables = await runQuery(tableCheckSql);
  const existingSet = new Set(existingTables.map(r => r.relname));
  
  console.log('\nChecking critical tables:');
  for (const table of criticalTables) {
    if (existingSet.has(table)) {
      console.log(`  ✓ Table public.${table} exists`);
    } else {
      console.warn(`  ⚠️ Missing table public.${table}`);
    }
  }

  // Check critical RPC functions
  const criticalFuncs = [
    'pin_livestream_product',
    'unpin_livestream_product',
    'ingest_carrier_tracking_event',
    'get_or_create_direct_conversation',
    'is_conversation_member',
    'create_monthly_partition'
  ];

  const funcCheckSql = `SELECT proname FROM pg_proc WHERE proname IN (${criticalFuncs.map(f => `'${f}'`).join(', ')});`;
  const existingFuncs = await runQuery(funcCheckSql);
  const existingFuncSet = new Set(existingFuncs.map(r => r.proname));

  console.log('\nChecking critical functions:');
  for (const fn of criticalFuncs) {
    if (existingFuncSet.has(fn)) {
      console.log(`  ✓ Function public.${fn} exists`);
    } else {
      console.warn(`  ⚠️ Missing function public.${fn}`);
    }
  }

  console.log('\nDatabase migration sync 100% COMPLETE.');
}

main().catch(err => {
  console.error('Fatal execution failure:', err);
  process.exit(1);
});
