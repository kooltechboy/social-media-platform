#!/usr/bin/env node
/**
 * TUKUBI Codebase Knowledge Graph Generator (Graphify-Compatible Deterministic AST Graph)
 * Parses workspaces (apps/*, packages/*), TypeScript/React AST imports & exports,
 * Next.js App Router pages & API routes, Server Actions, and Supabase SQL migrations.
 * Outputs:
 *   - TUKUBI Engineering Intelligence/03 Codebase Intelligence/graph.json
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'TUKUBI Engineering Intelligence', '03 Codebase Intelligence');
const OUT_FILE = path.join(OUT_DIR, 'graph.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function walkFiles(dir, extFilter, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === 'node_modules' ||
      entry.name === '.next' ||
      entry.name === '.turbo' ||
      entry.name === 'dist' ||
      entry.name === '.git'
    ) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, extFilter, results);
    } else if (extFilter(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function collectWorkspaces() {
  const nodes = [];
  const edges = [];
  const groups = ['apps', 'packages'];

  for (const group of groups) {
    const groupDir = path.join(ROOT, group);
    if (!fs.existsSync(groupDir)) continue;
    for (const entry of fs.readdirSync(groupDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pkgJsonPath = path.join(groupDir, entry.name, 'package.json');
      if (!fs.existsSync(pkgJsonPath)) continue;
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      const nodeId = pkg.name || `${group}/${entry.name}`;
      nodes.push({
        id: nodeId,
        type: group === 'apps' ? 'application' : 'package',
        path: `${group}/${entry.name}`,
        version: pkg.version || '1.0.0',
        scripts: Object.keys(pkg.scripts || {}),
      });

      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };
      for (const depName of Object.keys(allDeps)) {
        if (depName.startsWith('@caribbean/')) {
          edges.push({
            from: nodeId,
            to: depName,
            type: 'workspace_depends_on',
          });
        }
      }
    }
  }
  return { nodes, edges };
}

function parseTypeScriptFiles() {
  const routes = [];
  const apiRoutes = [];
  const serverActionModules = [];
  const tableTouches = new Map();

  const webAppDir = path.join(ROOT, 'apps', 'web', 'src');
  const tsFiles = walkFiles(webAppDir, (name) => /\.(ts|tsx)$/.test(name));

  for (const file of tsFiles) {
    const relPath = path.relative(ROOT, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');

    // Classify Next.js routes
    if (relPath.startsWith('apps/web/src/app/') && relPath.endsWith('/page.tsx')) {
      const routePath =
        '/' +
        relPath
          .slice('apps/web/src/app/'.length, -'/page.tsx'.length)
          .replace(/^\(([^)]+)\)\/?/, '');
      routes.push({
        route: routePath === '/' ? '/' : routePath.replace(/\/$/, ''),
        file: relPath,
      });
    } else if (relPath.startsWith('apps/web/src/app/') && relPath.endsWith('/route.ts')) {
      const routePath =
        '/' + relPath.slice('apps/web/src/app/'.length, -'/route.ts'.length);
      apiRoutes.push({
        route: routePath,
        file: relPath,
      });
    }

    // Parse AST for 'use server' and exported functions
    const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    let isUseServer = false;
    const exportedFunctions = [];
    const imports = [];

    sf.forEachChild((node) => {
      if (
        ts.isExpressionStatement(node) &&
        ts.isStringLiteral(node.expression) &&
        node.expression.text === 'use server'
      ) {
        isUseServer = true;
      }
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push(node.moduleSpecifier.text);
      }
      if (
        ts.isFunctionDeclaration(node) &&
        node.name &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        exportedFunctions.push(node.name.text);
      }
    });

    // Extract Supabase .from('table') and .rpc('fn') references
    const fromMatches = [...content.matchAll(/\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g)].map(
      (m) => m[1]
    );
    const rpcMatches = [...content.matchAll(/\.rpc\(\s*['"]([a-zA-Z0-9_]+)['"]/g)].map(
      (m) => m[1]
    );
    const uniqueTables = [...new Set(fromMatches)];
    const uniqueRpcs = [...new Set(rpcMatches)];

    for (const tbl of uniqueTables) {
      tableTouches.set(tbl, (tableTouches.get(tbl) || 0) + 1);
    }

    if (isUseServer || relPath.startsWith('apps/web/src/lib/')) {
      if (exportedFunctions.length > 0 || uniqueTables.length > 0 || uniqueRpcs.length > 0) {
        serverActionModules.push({
          file: relPath,
          isUseServer,
          exportedFunctions,
          tablesQueried: uniqueTables,
          rpcsCalled: uniqueRpcs,
          internalImports: imports.filter(
            (i) => i.startsWith('@caribbean/') || i.startsWith('@/') || i.startsWith('.')
          ),
        });
      }
    }
  }

  return {
    routes,
    apiRoutes,
    serverActionModules,
    topTablesByUsage: [...tableTouches.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([table, referenceCount]) => ({ table, referenceCount })),
  };
}

function parseMigrations() {
  const migDir = path.join(ROOT, 'supabase', 'migrations');
  const sqlFiles = walkFiles(migDir, (name) => name.endsWith('.sql')).sort();
  const tablesCreated = new Set();
  const functionsCreated = new Set();
  const prefixCounts = new Map();

  for (const file of sqlFiles) {
    const base = path.basename(file);
    const prefixMatch = base.match(/^(\d+)_/);
    if (prefixMatch) {
      const prefix = prefixMatch[1];
      prefixCounts.set(prefix, [...(prefixCounts.get(prefix) || []), base]);
    }
    const content = fs.readFileSync(file, 'utf8');
    for (const m of content.matchAll(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi
    )) {
      tablesCreated.add(m[1].toLowerCase());
    }
    for (const m of content.matchAll(
      /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)/gi
    )) {
      functionsCreated.add(m[1].toLowerCase());
    }
  }

  const duplicatePrefixes = [...prefixCounts.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([prefix, files]) => ({ prefix, files }));

  return {
    migrationCount: sqlFiles.length,
    tablesDefinedCount: tablesCreated.size,
    functionsDefinedCount: functionsCreated.size,
    duplicatePrefixes,
    latestMigrations: sqlFiles.slice(-10).map((f) => path.basename(f)),
  };
}

function main() {
  ensureDir(OUT_DIR);
  const workspaces = collectWorkspaces();
  const webAst = parseTypeScriptFiles();
  const dbSummary = parseMigrations();

  const graph = {
    generatedAt: new Date().toISOString(),
    generator: 'tukubi-ast-graph-v1 (TypeScript Compiler AST)',
    summary: {
      totalWorkspaces: workspaces.nodes.length,
      applicationsCount: workspaces.nodes.filter((n) => n.type === 'application').length,
      packagesCount: workspaces.nodes.filter((n) => n.type === 'package').length,
      workspaceEdgesCount: workspaces.edges.length,
      webPageRoutesCount: webAst.routes.length,
      webApiRoutesCount: webAst.apiRoutes.length,
      serverModulesCount: webAst.serverActionModules.length,
      sqlMigrationsCount: dbSummary.migrationCount,
      sqlTablesCount: dbSummary.tablesDefinedCount,
      sqlFunctionsCount: dbSummary.functionsDefinedCount,
    },
    workspaces,
    database: dbSummary,
    webRoutes: webAst.routes,
    apiRoutes: webAst.apiRoutes,
    topTablesByUsage: webAst.topTablesByUsage.slice(0, 40),
    serverActionModules: webAst.serverActionModules,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(graph, null, 2), 'utf8');
  console.log(`✅ Generated codebase graph at ${ path.relative(ROOT, OUT_FILE) }`);
  console.log(JSON.stringify(graph.summary, null, 2));
}

main();
