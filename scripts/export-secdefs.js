const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getToken() {
  return execSync('powershell -NoProfile -ExecutionPolicy Bypass -File scripts/get-token.ps1').toString().trim();
}

async function run() {
  const token = getToken();
  const res = await fetch('https://api.supabase.com/v1/projects/qixlaqwohhrynownvqwp/database/query', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `
      SELECT 
        p.proname,
        pg_get_function_identity_arguments(p.oid) as args,
        p.prosecdef,
        p.provolatile,
        p.proconfig,
        pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND has_function_privilege('anon', p.oid, 'EXECUTE') = true
      ORDER BY p.proname;
    ` })
  });
  const data = await res.json();
  const outDir = path.resolve(__dirname, '../scratch');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'secdefs.json'), JSON.stringify(data, null, 2));
  console.log(`Successfully exported ${data.length} functions to scratch/secdefs.json`);
}

run().catch(console.error);
