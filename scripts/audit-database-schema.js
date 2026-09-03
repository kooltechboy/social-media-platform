const fs = require('fs');
const path = require('path');

const migrationsDir = path.resolve('supabase/migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

const tables = new Set();
const functions = new Set();
const policies = new Map(); // policy -> table
const triggers = new Set();
const indexes = new Set();

for (const file of files) {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  
  for (const m of content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi)) {
    tables.add(m[1].toLowerCase());
  }
  for (const m of content.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)/gi)) {
    functions.add(m[1].toLowerCase());
  }
  for (const m of content.matchAll(/CREATE\s+POLICY\s+(?:"([^"]+)"|([a-zA-Z0-9_]+))\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)/gi)) {
    const polName = m[1] || m[2];
    const tableName = m[3].toLowerCase();
    policies.set(`${tableName}:${polName}`, { table: tableName, policy: polName });
  }
  for (const m of content.matchAll(/CREATE\s+TRIGGER\s+["']?([^"'\s]+)["']?\s+(?:BEFORE|AFTER|INSTEAD)/gi)) {
    triggers.add(m[1].toLowerCase());
  }
  for (const m of content.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi)) {
    indexes.add(m[1].toLowerCase());
  }
}

console.log('=== TUKUBI DATABASE SCHEMA AUDIT ===');
console.log('Total Migrations:', files.length);
console.log('Total Unique Tables:', tables.size);
console.log('Total Unique Functions:', functions.size);
console.log('Total Unique RLS Policies:', policies.size);
console.log('Total Unique Triggers:', triggers.size);
console.log('Total Unique Indexes:', indexes.size);
