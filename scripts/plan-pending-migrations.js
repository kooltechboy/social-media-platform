const fs = require('fs');
const path = require('fs');
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
  const appliedRows = await runQuery("SELECT version FROM supabase_migrations.schema_migrations;");
  const appliedSet = new Set(appliedRows.map(r => r.version));

  const migrationsDir = 'supabase/migrations';
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`Found ${files.length} total local migration files.`);
  console.log(`Found ${appliedSet.size} applied versions in remote database.\n`);

  const pending = [];
  const alreadyApplied = [];

  for (const file of files) {
    // Migration files are named e.g. 00001_xxx.sql or 20260902033937_xxx.sql
    const match = file.match(/^([0-9]+)_/);
    if (!match) {
      console.warn(`File does not match version prefix: ${file}`);
      continue;
    }
    const version = match[1];
    if (appliedSet.has(version)) {
      alreadyApplied.push({ file, version });
    } else {
      pending.push({ file, version });
    }
  }

  console.log(`Already applied (${alreadyApplied.length}):`);
  alreadyApplied.forEach(m => console.log(`  [x] ${m.version} - ${m.file}`));

  console.log(`\nPending (${pending.length}):`);
  pending.forEach(m => console.log(`  [ ] ${m.version} - ${m.file}`));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
