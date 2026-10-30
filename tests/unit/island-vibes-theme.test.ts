import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  DEFAULT_THEME,
  OFFICIAL_BRAND_PALETTE,
  colors as designSystemColors,
} from '../../packages/design-system/src/index';
import { CARIBBEAN_THEMES, DEFAULT_THEME_ID } from '../../apps/web/src/components/caribbean-sunset-background';
import { TOKENS as mobileTokens } from '../../apps/mobile/src/theme/tokens';

describe('TUKUBI — Global Theme & Midnight Reef Desktop Architecture Verification', () => {
  describe('1. Foundational Design System (@caribbean/design-system)', () => {
    it('sets Island Vibes as the canonical cross-platform theme identifier', () => {
      expect(DEFAULT_THEME).toBe('island-vibes');
    });

    it('exports canonical Island Vibes semantic color tokens for mobile parity', () => {
      expect(designSystemColors.islandVibes).toBeDefined();
      expect(designSystemColors.islandVibes.canvas).toBe('#110D17');
      expect(designSystemColors.islandVibes.surface).toBe('#1D1429');
      expect(designSystemColors.islandVibes.primary).toBe('#FF7A59');
      expect(designSystemColors.islandVibes.accent).toBe('#FFB347');
      expect(designSystemColors.islandVibes.sea).toBe('#00B4D8');
      expect(designSystemColors.islandVibes.textPrimary).toBe('#FDF2E9');
    });

    it('exports official Midnight Reef desktop tokens aligned to OFFICIAL_BRAND_PALETTE', () => {
      expect(designSystemColors.midnightReef).toBeDefined();
      expect(designSystemColors.midnightReef.canvas).toBe('#070D1A');
      expect(designSystemColors.midnightReef.surface).toBe('#0D1628');
      expect(designSystemColors.midnightReef.surfaceTrust).toBe(OFFICIAL_BRAND_PALETTE.deepNavy);
      expect(designSystemColors.midnightReef.primary).toBe(OFFICIAL_BRAND_PALETTE.oceanBlue);
      expect(designSystemColors.midnightReef.secondary).toBe(OFFICIAL_BRAND_PALETTE.caribbeanTeal);
      expect(designSystemColors.midnightReef.textPrimary).toBe('#E8EDF5');
    });

    it('exports legacy brand tokens and official brand tokens together', () => {
      expect(designSystemColors.brand.twilight).toBe('#110D17');
      expect(designSystemColors.brand.dusk).toBe('#1D1429');
      expect(designSystemColors.brand.caribbeanTeal).toBe('#00C2A8');
      expect(designSystemColors.brand.oceanBlue).toBe('#0EA5E9');
      expect(designSystemColors.brand.deepNavy).toBe('#0B1B3B');
    });
  });

  describe('2. Web Application Background & Theme System (Midnight Reef)', () => {
    it('declares Midnight Reef as the first (index 0) and default web desktop theme', () => {
      expect(DEFAULT_THEME_ID).toBe('island-vibes');
      expect(CARIBBEAN_THEMES[0].id).toBe('island-vibes');
      expect(CARIBBEAN_THEMES[0].name).toContain('Midnight Reef');
      expect(CARIBBEAN_THEMES[0].url).toBe('/backgrounds/caribbean-blue-hour.jpg');
    });

    it('configures deep-navy blue-hour atmospheric overlay gradients', () => {
      const activeTheme = CARIBBEAN_THEMES.find((t) => t.id === 'island-vibes');
      expect(activeTheme).toBeDefined();
      expect(activeTheme?.overlayGradient).toContain('rgba(6, 11, 22,');
    });
  });

  describe('3. React Native Mobile Theme System (Midnight Reef Parity)', () => {
    it('sets mobile tokens to match official Midnight Reef brand palette', () => {
      expect(mobileTokens.canvas).toBe('#070D1A');
      expect(mobileTokens.surface).toBe('#0D1628');
      expect(mobileTokens.raised).toBe('#15213A');
      expect(mobileTokens.oceanDepth).toBe('#0B1B3B');
      expect(mobileTokens.textPrimary).toBe('#E8EDF5');
      expect(mobileTokens.action).toBe('#0EA5E9');
      expect(mobileTokens.teal).toBe('#00C2A8');
      expect(mobileTokens.accent).toBe('#F59E0B');
      expect(mobileTokens.sea).toBe('#0EA5E9');
    });

    it('configures app.json splash and adaptive icon to Midnight Reef #070D1A', () => {
      const appJsonPath = path.resolve(__dirname, '../../apps/mobile/app.json');
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      expect(appJson.expo.splash.backgroundColor).toBe('#070D1A');
      expect(appJson.expo.android.adaptiveIcon.backgroundColor).toBe('#070D1A');
    });
  });

  describe('4. Global CSS & Tailwind Variables', () => {
    it('defines Midnight Reef official variables in web globals.css', () => {
      const cssPath = path.resolve(__dirname, '../../apps/web/src/app/globals.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');
      expect(cssContent).toContain('--brand-twilight:     #070D1A;');
      expect(cssContent).toContain('--brand-dusk:         #0D1628;');
      expect(cssContent).toContain('--brand-ocean-depth:  #0B1B3B;');
      expect(cssContent).toContain('--brand-sandstone:    #E8EDF5;');
      expect(cssContent).toContain('--brand-sea:          #0EA5E9;');
      expect(cssContent).toContain('--brand-teal:         #00C2A8;');
    });

    it('enforces presence of glass and tk-panel utilities in web globals.css', () => {
      const cssPath = path.resolve(__dirname, '../../apps/web/src/app/globals.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');
      expect(cssContent).toContain('.glass {');
      expect(cssContent).toContain('var(--surface-panel)');
      expect(cssContent).toContain('.tk-panel {');
    });
  });

  describe('5. Brand Consistency & Tagline', () => {
    it('enforces official brand tagline "The Caribbean Connected."', () => {
      const logoPath = path.resolve(__dirname, '../../apps/web/src/components/brand/tukubi-logo.tsx');
      const logoContent = fs.readFileSync(logoPath, 'utf-8');
      expect(logoContent).toContain('The Caribbean Connected.');
      expect(logoContent).toContain('TUKUBI');
    });
  });
});
