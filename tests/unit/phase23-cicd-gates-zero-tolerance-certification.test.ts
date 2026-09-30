import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 23 — CI/CD Gates & Zero-Tolerance Compliance Certification', () => {
  const root = path.resolve(__dirname, '../..');

  // ===========================================================================
  // 1. CI/CD Workflow Pipeline Verification
  // ===========================================================================
  describe('1. GitHub Actions CI/CD Pipeline Integrity', () => {
    it('verifies .github/workflows/ci.yml enforces mandatory launch gates', () => {
      const ciPath = path.join(root, '.github/workflows/ci.yml');
      expect(fs.existsSync(ciPath)).toBe(true);

      const ciYaml = fs.readFileSync(ciPath, 'utf-8');

      // Verify core gates
      expect(ciYaml).toContain('pnpm run lint');
      expect(ciYaml).toContain('pnpm run typecheck');
      expect(ciYaml).toContain('pnpm run check:prohibited');
      expect(ciYaml).toContain('pnpm run test:unit');
      expect(ciYaml).toContain('pnpm run build');
    });
  });

  // ===========================================================================
  // 2. Inviolable Zero-Tolerance SpotPay Gate
  // ===========================================================================
  describe('2. SpotPay Zero-Tolerance Inviolable Architecture Gate', () => {
    it('scans all active codebase files to ensure absolute zero occurrences of SpotPay', () => {
      const prohibited = [/spotpay/i, /spot_pay/i, /spot-pay/i, /spot\s+pay/i];
      const ignoredDirs = new Set([
        'node_modules', '.git', '.turbo', '.vercel', 'dist',
        '.next', 'test-results', '.temp', 'scratch', '.superpowers',
      ]);

      const violations: string[] = [];

      function scan(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (ignoredDirs.has(entry.name)) continue;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scan(full);
          } else if (entry.isFile()) {
            if (
              entry.name.endsWith('.tsbuildinfo') ||
              entry.name.endsWith('.log') ||
              entry.name.endsWith('.lock')
            ) {
              continue;
            }
            if (
              full.includes('spotpay-zero-tolerance-gate.test.ts') ||
              full.includes('phase23-cicd-gates-zero-tolerance-certification.test.ts') ||
              full.includes('check-prohibited-references.js')
            ) {
              continue;
            }

            try {
              const content = fs.readFileSync(full, 'utf-8');
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

  // ===========================================================================
  // 3. Double-Entry Inviolable Ledger Mutation Check (Rule 3)
  // ===========================================================================
  describe('3. Double-Entry Financial Safety Invariant (Rule 3)', () => {
    it('verifies that no source code files perform mutable column increments on wallet balances', () => {
      // Inviolable Rule 3: Never alter wallet balances with mutable column increments (balance = balance + X)
      const prohibitedPatterns = [
        /balance\s*=\s*balance\s*\+/i,
        /balance\s*=\s*balance\s*-/i,
        /wallet_balance\s*=\s*wallet_balance\s*\+/i,
      ];

      const scanDirs = [
        path.join(root, 'apps/web/src'),
        path.join(root, 'packages/payments/src'),
        path.join(root, 'packages/database/src'),
      ];

      const violations: string[] = [];

      function scan(dir: string) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scan(full);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            const content = fs.readFileSync(full, 'utf-8');
            for (const pat of prohibitedPatterns) {
              if (pat.test(content)) {
                violations.push(path.relative(root, full));
                break;
              }
            }
          }
        }
      }

      scanDirs.forEach((d) => scan(d));
      expect(violations).toEqual([]);
    });
  });

  // ===========================================================================
  // 4. Secrets & Hardcoded Tokens Shielding (Rule 4)
  // ===========================================================================
  describe('4. Hardcoded Secrets & Production Safety Shield (Rule 4)', () => {
    it('verifies that no raw live payment API keys or production secrets are committed in source code', () => {
      const liveKeyPatterns = [
        /sk_live_[0-9a-zA-Z]{24,}/,
        /ghp_[0-9a-zA-Z]{36}/,
        /sq0csp-[0-9a-zA-Z\-_]{43}/,
      ];

      const scanDirs = [
        path.join(root, 'apps/web/src'),
        path.join(root, 'packages'),
      ];

      const violations: string[] = [];

      function scan(dir: string) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.turbo') continue;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scan(full);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
            try {
              const content = fs.readFileSync(full, 'utf-8');
              for (const pat of liveKeyPatterns) {
                if (pat.test(content)) {
                  violations.push(path.relative(root, full));
                  break;
                }
              }
            } catch {
              // ignore
            }
          }
        }
      }

      scanDirs.forEach((d) => scan(d));
      expect(violations).toEqual([]);
    });
  });
});
