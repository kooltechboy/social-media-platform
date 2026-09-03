const fs = require('fs');
const path = require('path');

function getRoutes(dir, baseRoute = '') {
  let routes = [];
  if (!fs.existsSync(dir)) return routes;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const segment = entry.name;
      const nextBase = `${baseRoute}/${segment}`;
      routes.push(...getRoutes(path.join(dir, segment), nextBase));
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts' || entry.name === 'route.ts' || entry.name === 'route.js') {
      const type = entry.name.startsWith('page') ? 'page' : 'api';
      routes.push({
        route: baseRoute || '/',
        type,
        file: path.join(dir, entry.name),
      });
    }
  }
  return routes;
}

const webRoutes = getRoutes(path.resolve('apps/web/src/app'));
const adminRoutes = getRoutes(path.resolve('apps/admin/src/app'));
const moderationRoutes = getRoutes(path.resolve('apps/moderation/src/app'));

console.log('=== TUKUBI ROUTE INVENTORY ===');
console.log('Web Routes Count:', webRoutes.length);
console.log('Admin Routes Count:', adminRoutes.length);
console.log('Moderation Routes Count:', moderationRoutes.length);
console.log('\n--- Web Routes Sample ---');
webRoutes.slice(0, 20).forEach(r => console.log(`[${r.type.toUpperCase()}] ${r.route}`));
console.log('\n--- Admin Routes ---');
adminRoutes.forEach(r => console.log(`[${r.type.toUpperCase()}] ${r.route}`));
console.log('\n--- Moderation Routes ---');
moderationRoutes.forEach(r => console.log(`[${r.type.toUpperCase()}] ${r.route}`));
