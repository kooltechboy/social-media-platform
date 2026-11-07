const fs = require('fs');
const path = require('path');

const FORBIDDEN_TOKENS = [
  'MOCK_FEED_POSTS',
  'SAMPLE_FEED_DATA',
];

const SCAN_DIRS = [
  path.join(__dirname, '../apps/web/src/components/commerce'),
  path.join(__dirname, '../apps/web/src/components/feed'),
  path.join(__dirname, '../apps/web/src/components/home'),
  path.join(__dirname, '../apps/web/src/lib/feed'),
  path.join(__dirname, '../apps/web/src/lib/social'),
  path.join(__dirname, '../apps/web/src/lib/marketplace'),
];

let violations = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDir(fullPath);
      }
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const token of FORBIDDEN_TOKENS) {
        if (content.includes(token)) {
          console.error(`❌ Mock token found in ${fullPath}: "${token}"`);
          violations++;
        }
      }
    }
  }
}

for (const dir of SCAN_DIRS) {
  scanDir(dir);
}

if (violations > 0) {
  console.error(`Audit failed: ${violations} forbidden mock occurrences found.`);
  process.exit(1);
} else {
  console.log('✅ Zero-mock audit passed! All target social and feed paths use live data.');
}
