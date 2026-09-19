const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  console.log('=== 1. AUDITING 53 SECURITY DEFINER FUNCTIONS EXECUTABLE BY ANON ===');
  const secDefQuery = `
    SELECT 
      p.proname,
      pg_get_function_identity_arguments(p.oid) as args,
      p.prosecdef,
      p.provolatile,
      p.proconfig,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_can_execute,
      pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND has_function_privilege('anon', p.oid, 'EXECUTE') = true
    ORDER BY p.proname;
  `;
  const secDefs = await runQuery(secDefQuery);
  console.log(`Total SECURITY DEFINER functions executable by anon: ${secDefs.length}`);
  secDefs.forEach((f, idx) => {
    console.log(`${idx + 1}. ${f.proname}(${f.args}) - search_path: ${f.proconfig ? f.proconfig.join(',') : 'MUTABLE/NONE'}`);
  });

  console.log('\n=== 2. AUDITING RLS ON PARTITIONS AND NO-POLICY TABLES ===');
  const rlsQuery = `
    SELECT c.relname, c.relkind,
           (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) as policy_count,
           (SELECT string_agg(p.polname || ' (' || p.polcmd::text || ')', '; ') FROM pg_policy p WHERE p.polrelid = c.oid) as policies
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relrowsecurity = true
    ORDER BY policy_count ASC, c.relname;
  `;
  const rlsTables = await runQuery(rlsQuery);
  const noPolicy = rlsTables.filter(t => parseInt(t.policy_count) === 0);
  console.log(`Total RLS enabled tables: ${rlsTables.length}`);
  console.log(`Tables with RLS enabled but 0 policies: ${noPolicy.length}`);
  noPolicy.forEach(t => console.log(`  - ${t.relname} (kind: ${t.relkind})`));

  console.log('\n=== 3. AUDITING EXTENSIONS IN PUBLIC ===');
  const extQuery = `
    SELECT e.extname, n.nspname, e.extversion
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    ORDER BY e.extname;
  `;
  const exts = await runQuery(extQuery);
  console.log('Installed extensions:');
  exts.forEach(e => console.log(`  - ${e.extname} (schema: ${e.nspname}, version: ${e.extversion})`));

  console.log('\n=== 4. AUDITING MIGRATION DRIFT ===');
  const appliedMigrations = await runQuery('SELECT version FROM supabase_migrations.schema_migrations ORDER BY version ASC;');
  const appliedSet = new Set(appliedMigrations.map(r => r.version));
  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
  const localFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log(`Remote applied count: ${appliedSet.size}`);
  console.log(`Local migration files count: ${localFiles.length}`);
  const unapplied = localFiles.filter(f => {
    const m = f.match(/^([0-9]+)_/);
    return m && !appliedSet.has(m[1]);
  });
  console.log(`Pending local migrations not yet applied on remote (${unapplied.length}):`);
  unapplied.forEach(f => console.log(`  - ${f}`));
}

main().catch(err => {
  console.error('Error running audit script:', err);
  process.exit(1);
});
