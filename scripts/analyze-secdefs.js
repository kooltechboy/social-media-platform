const fs = require('fs');
const path = require('path');

const secdefs = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scratch/secdefs.json'), 'utf8'));

console.log(`Total functions: ${secdefs.length}\n`);

const triggers = [];
const rpcs = [];

secdefs.forEach(f => {
  const isTrigger = f.def.includes('RETURNS trigger') || f.args === '';
  const hasAuthUid = f.def.includes('auth.uid()');
  const hasIsAdmin = f.def.includes('is_admin') || f.def.includes('is_staff');
  
  const obj = {
    name: f.proname,
    args: f.args,
    isTrigger,
    hasAuthUid,
    hasIsAdmin,
    searchPath: f.proconfig ? f.proconfig.join(';') : 'NONE'
  };

  if (isTrigger) {
    triggers.push(obj);
  } else {
    rpcs.push(obj);
  }
});

console.log(`=== TRIGGER FUNCTIONS (${triggers.length}) ===`);
console.log('Recommendation: REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC, anon, authenticated (triggers still fire!):');
triggers.forEach((t, i) => {
  console.log(`${i + 1}. ${t.name}() [search_path: ${t.searchPath}]`);
});

console.log(`\n=== RPC FUNCTIONS (${rpcs.length}) ===`);
rpcs.forEach((r, i) => {
  console.log(`${i + 1}. ${r.name}(${r.args})`);
  console.log(`   - auth.uid check: ${r.hasAuthUid}, admin check: ${r.hasIsAdmin}, search_path: ${r.searchPath}`);
});
