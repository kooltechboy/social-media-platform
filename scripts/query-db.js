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

const sql = process.argv[2] || "SELECT relname, relkind FROM pg_class WHERE relname IN ('analytics_events', 'feed_activity_timeline', 'chat_messages_partitioned');";
runQuery(sql).then(res => {
  console.log(JSON.stringify(res, null, 2));
}).catch(err => {
  console.error(err.message);
  process.exit(1);
});
