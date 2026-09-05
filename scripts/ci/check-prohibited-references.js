#!/usr/bin/env node
/**
 * TUKUBI Prohibited References CI Gate
 * Inviolable Rule: Zero occurrences of SpotPay in any casing/format across the entire repository.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const PROHIBITED_PATTERNS = [
  /spotpay/i,
  /spot_pay/i,
  /spot-pay/i,
  /spot\s+pay/i,
];

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".turbo",
  ".vercel",
  "dist",
  ".next",
  "test-results",
  ".temp",
  "scratch",
  ".superpowers",
]);

let violations = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".tsbuildinfo") || entry.name.endsWith(".log") || entry.name.endsWith(".lock")) {
        continue;
      }
      // Avoid scanning this scanner script itself
      if (fullPath.includes("check-prohibited-references.js") || fullPath.includes("spotpay-zero-tolerance-gate.test.ts")) {
        continue;
      }
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        for (const pattern of PROHIBITED_PATTERNS) {
          if (pattern.test(content)) {
            const relPath = path.relative(ROOT, fullPath);
            violations.push({ file: relPath, pattern: pattern.toString() });
          }
        }
      } catch (err) {
        // binary or unreadable file
      }
    }
  }
}

console.log("🔍 Scanning TUKUBI repository for prohibited terms (SpotPay zero-tolerance)...");
scanDirectory(ROOT);

if (violations.length > 0) {
  console.error("❌ CI GATE FAILED: Prohibited reference(s) detected:");
  for (const v of violations) {
    console.error(`   - ${v.file} (matched ${v.pattern})`);
  }
  process.exit(1);
} else {
  console.log("✅ CI GATE PASSED: Zero prohibited references found across repository.");
  process.exit(0);
}
