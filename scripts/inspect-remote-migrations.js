const { execSync } = require('child_process');

function getToken() {
  const token = execSync('powershell -NoProfile -ExecutionPolicy Bypass -File scripts/get-token.ps1').toString().trim();
  return token;
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
  try {
    const rows = await runQuery("SELECT version, statements FROM supabase_migrations.schema_migrations WHERE version IN ('00071', '20260902033937');");
    console.log('Query result:', JSON.stringify(rows, null, 2));

    const allApplied = await runQuery("SELECT version FROM supabase_migrations.schema_migrations ORDER BY version ASC;");
    console.log('Total versions in schema_migrations:', allApplied.length);
    console.log('Versions:', allApplied.map(r => r.version));
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
