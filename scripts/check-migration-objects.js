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

async function checkObjects() {
  const checks = [
    // 00085
    { mig: '00085', desc: 'sounds table', sql: "SELECT EXISTS(SELECT 1 FROM pg_class WHERE relname = 'sounds') as val" },
    { mig: '00085', desc: 'videos.audio_track col', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'audio_track') as val" },
    // 00086
    { mig: '00086', desc: 'user_relationships check constraint', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_relationships_users_distinct') as val" },
    // 00087
    { mig: '00087', desc: 'help_categories table', sql: "SELECT EXISTS(SELECT 1 FROM pg_class WHERE relname = 'help_categories') as val" },
    { mig: '00087', desc: 'help_articles table', sql: "SELECT EXISTS(SELECT 1 FROM pg_class WHERE relname = 'help_articles') as val" },
    // 00088
    { mig: '00088', desc: 'post_media.aspect_ratio col', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'post_media' AND column_name = 'aspect_ratio') as val" },
    // 00089
    { mig: '00089', desc: 'user_favorites table', sql: "SELECT EXISTS(SELECT 1 FROM pg_class WHERE relname = 'user_favorites') as val" },
    { mig: '00089', desc: 'user_active_identity table', sql: "SELECT EXISTS(SELECT 1 FROM pg_class WHERE relname = 'user_active_identity') as val" },
    // 00090
    { mig: '00090', desc: 'storage caribbean-sounds owner update policy', sql: "SELECT EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users update own sounds') as val" },
    // 00091
    { mig: '00091', desc: 'parental_consent_requests table', sql: "SELECT EXISTS(SELECT 1 FROM pg_class WHERE relname = 'parental_consent_requests') as val" },
    // 00092
    { mig: '00092', desc: 'pages.archived_at col', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'archived_at') as val" },
    { mig: '00092', desc: 'communities.archived_at col', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'archived_at') as val" }
  ];

  for (const c of checks) {
    const res = await runQuery(c.sql);
    console.log(`[${c.mig}] ${c.desc}: ${res[0].val ? 'EXISTS' : 'MISSING'}`);
  }
}

checkObjects().catch(console.error);
