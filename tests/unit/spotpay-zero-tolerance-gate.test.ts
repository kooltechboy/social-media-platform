import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("SpotPay Zero-Tolerance Inviolable Architecture Gate", () => {
  it("enforces absolute zero occurrences of SpotPay across all repository source code, migrations, and configs", () => {
    const root = path.resolve(__dirname, "../..");
    const prohibited = [/spotpay/i, /spot_pay/i, /spot-pay/i, /spot\s+pay/i];
    const ignoredDirs = new Set(["node_modules", ".git", ".turbo", ".vercel", "dist", ".next", "test-results", ".temp", "scratch", ".superpowers"]);

    const violations: string[] = [];

    function scan(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (ignoredDirs.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scan(full);
        } else if (entry.isFile()) {
          if (entry.name.endsWith(".tsbuildinfo") || entry.name.endsWith(".log") || entry.name.endsWith(".lock")) continue;
          if (full.includes("spotpay-zero-tolerance-gate.test.ts") || full.includes("check-prohibited-references.js")) continue;

          try {
            const content = fs.readFileSync(full, "utf-8");
            for (const p of prohibited) {
              if (p.test(content)) {
                violations.push(path.relative(root, full));
                break;
              }
            }
          } catch {
            // ignore binary
          }
        }
      }
    }

    scan(root);
    expect(violations).toEqual([]);
  });
});
