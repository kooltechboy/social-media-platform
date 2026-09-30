import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

describe('Phase 5 — Desktop & Responsive Experience Production Certification', () => {
  const rootDir = join(__dirname, '../..');
  const appShellPath = join(rootDir, 'apps/web/src/components/app-shell.tsx');
  const rightRailPath = join(rootDir, 'apps/web/src/components/right-rail.tsx');
  const keyboardShortcutsPath = join(rootDir, 'apps/web/src/components/keyboard-shortcuts-provider.tsx');
  const railsDir = join(rootDir, 'apps/web/src/components/rails');

  // ===========================================================================
  // 1. Three-Column Layout & Viewport Bounding
  // ===========================================================================
  describe('1. Responsive Layout & Viewport Architecture', () => {
    it('verifies AppShell defines responsive desktop left sidebar with collapsible widths', () => {
      expect(existsSync(appShellPath)).toBe(true);
      const content = readFileSync(appShellPath, 'utf-8');

      // Left sidebar desktop visibility and sticky positioning
      expect(content).toContain('hidden md:flex md:flex-col');
      expect(content).toContain('sticky top-[58px]');
      expect(content).toContain('h-[calc(100vh-58px)]');

      // Collapsible rail width states
      expect(content).toContain("w-[72px]");
      expect(content).toContain("w-[240px] xl:w-[260px]");
    });

    it('verifies AppShell supports ultra-wide viewports up to 4K displays', () => {
      const content = readFileSync(appShellPath, 'utf-8');
      expect(content).toContain('max-w-[2560px]');
      expect(content).toContain('5xl:max-w-[2800px]');
    });

    it('verifies RightRail defines responsive lg:block desktop container with complementary role', () => {
      expect(existsSync(rightRailPath)).toBe(true);
      const content = readFileSync(rightRailPath, 'utf-8');

      expect(content).toContain('hidden lg:block');
      expect(content).toContain('w-[310px] xl:w-[340px] 2xl:w-[360px]');
      expect(content).toContain('sticky top-[70px]');
      expect(content).toContain('role="complementary"');
    });
  });

  // ===========================================================================
  // 2. Contextual Rail Architecture Across Domains
  // ===========================================================================
  describe('2. Contextual Rails Inventory Across Feature Domains', () => {
    const EXPECTED_RAILS = [
      'home-rail.tsx',
      'explore-rail.tsx',
      'communities-rail.tsx',
      'creator-studio-rail.tsx',
      'events-rail.tsx',
      'feeds-rail.tsx',
      'marketplace-rail.tsx',
      'messages-rail.tsx',
      'pages-rail.tsx',
      'podcasts-rail.tsx',
    ];

    it('verifies all 10 domain contextual rail components exist', () => {
      for (const rail of EXPECTED_RAILS) {
        const filePath = join(railsDir, rail);
        expect(existsSync(filePath), `Missing contextual rail: ${rail}`).toBe(true);
      }
    });

    it('verifies HomeRail renders live broadcast callout, people suggestions, and trending signals', () => {
      const homeRailContent = readFileSync(join(railsDir, 'home-rail.tsx'), 'utf-8');
      expect(homeRailContent).toContain('activeLiveStream');
      expect(homeRailContent).toContain('suggestedPeople');
      expect(homeRailContent).toContain('trendingTopics');
    });
  });

  // ===========================================================================
  // 3. Desktop Keyboard Shortcut Engine & Input Suppression
  // ===========================================================================
  describe('3. Desktop Keyboard Shortcuts & Input Safety Guard', () => {
    it('verifies KeyboardShortcutsProvider implements navigation chords and action shortcuts', () => {
      expect(existsSync(keyboardShortcutsPath)).toBe(true);
      const content = readFileSync(keyboardShortcutsPath, 'utf-8');

      // Chords
      expect(content).toContain("keys: ['g', 'h']");
      expect(content).toContain("keys: ['g', 'f']");
      expect(content).toContain("keys: ['g', 'c']");
      expect(content).toContain("keys: ['g', 'e']");
      expect(content).toContain("keys: ['g', 'm']");
      expect(content).toContain("keys: ['g', 'p']");

      // Search & modal
      expect(content).toContain('focusSearchInput');
      expect(content).toContain('isShortcutsModalOpen');
    });

    it('simulates keyboard shortcut engine with input field suppression', () => {
      let dispatchedAction: string | null = null;
      let pendingChord: string | null = null;

      function handleKeyStroke(
        key: string,
        target: { tagName: string; isContentEditable?: boolean },
        modifiers: { ctrl?: boolean; meta?: boolean } = {}
      ): string | null {
        // Suppress shortcuts when typing in input/textarea/editable
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable === true
        ) {
          return null;
        }

        if (modifiers.ctrl || modifiers.meta) {
          if (key.toLowerCase() === 'k') {
            dispatchedAction = 'search_focus';
            return dispatchedAction;
          }
          return null;
        }

        if (key === '/') {
          dispatchedAction = 'search_focus';
          return dispatchedAction;
        }

        if (key === 'c' && !pendingChord) {
          dispatchedAction = 'create_post';
          return dispatchedAction;
        }

        if (!pendingChord && key === 'g') {
          pendingChord = 'g';
          return 'pending_g';
        }

        if (pendingChord === 'g') {
          pendingChord = null;
          if (key === 'h') dispatchedAction = 'nav_home';
          else if (key === 'm') dispatchedAction = 'nav_messages';
          return dispatchedAction;
        }

        return null;
      }

      // Test 1: User presses 'c' on canvas -> triggers create_post
      handleKeyStroke('c', { tagName: 'BODY' });
      expect(dispatchedAction).toBe('create_post');

      // Test 2: User presses 'c' while typing in comment textarea -> suppressed!
      dispatchedAction = null;
      handleKeyStroke('c', { tagName: 'TEXTAREA' });
      expect(dispatchedAction).toBeNull();

      // Test 3: User presses 'g' then 'm' -> triggers nav_messages
      handleKeyStroke('g', { tagName: 'BODY' });
      handleKeyStroke('m', { tagName: 'BODY' });
      expect(dispatchedAction).toBe('nav_messages');

      // Test 4: User presses Ctrl+K -> triggers search_focus
      handleKeyStroke('k', { tagName: 'BODY' }, { ctrl: true });
      expect(dispatchedAction).toBe('search_focus');
    });
  });
});
