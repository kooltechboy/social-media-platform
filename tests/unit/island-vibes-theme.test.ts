import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_THEME, colors as designSystemColors } from '../../packages/design-system/src/index';
import { CARIBBEAN_THEMES, DEFAULT_THEME_ID } from '../../apps/web/src/components/caribbean-sunset-background';
import { TOKENS as mobileTokens } from '../../apps/mobile/src/theme/tokens';

describe('TUKUBI — Island Vibes Global Default Theme Verification', () => {
  describe('1. Foundational Design System (@caribbean/design-system)', () => {
    it('sets Island Vibes as the official default theme constant', () => {
      expect(DEFAULT_THEME).toBe('island-vibes');
    });

    it('exports canonical Island Vibes semantic color tokens', () => {
      expect(designSystemColors.islandVibes).toBeDefined();
      expect(designSystemColors.islandVibes.canvas).toBe('#110D17');
      expect(designSystemColors.islandVibes.surface).toBe('#1D1429');
      expect(designSystemColors.islandVibes.primary).toBe('#FF7A59');
      expect(designSystemColors.islandVibes.accent).toBe('#FFB347');
      expect(designSystemColors.islandVibes.sea).toBe('#00B4D8');
      expect(designSystemColors.islandVibes.textPrimary).toBe('#FDF2E9');
    });

    it('exports brand twilight and sunrise coral tokens', () => {
      expect(designSystemColors.brand.twilight).toBe('#110D17');
      expect(designSystemColors.brand.dusk).toBe('#1D1429');
      expect(designSystemColors.brand.sunriseCoral).toBe('#FF7A59');
      expect(designSystemColors.brand.goldenHour).toBe('#FFB347');
      expect(designSystemColors.brand.caribbeanSea).toBe('#00B4D8');
      expect(designSystemColors.brand.sandstone).toBe('#FDF2E9');
    });
  });

  describe('2. Web Application Background & Theme System', () => {
    it('declares Island Vibes as the first (index 0) and default theme', () => {
      expect(DEFAULT_THEME_ID).toBe('island-vibes');
      expect(CARIBBEAN_THEMES[0].id).toBe('island-vibes');
      expect(CARIBBEAN_THEMES[0].name).toContain('Island Vibes');
      expect(CARIBBEAN_THEMES[0].url).toBe('/backgrounds/island-vibes.jpg');
    });

    it('configures atmospheric overlay gradients for Island Vibes', () => {
      const islandVibes = CARIBBEAN_THEMES.find((t) => t.id === 'island-vibes');
      expect(islandVibes).toBeDefined();
      expect(islandVibes?.overlayGradient).toContain('rgba(17, 13, 23, 0.75)');
    });
  });

  describe('3. React Native Mobile Theme System', () => {
    it('sets mobile tokens to match Island Vibes palette', () => {
      expect(mobileTokens.canvas).toBe('#110D17');
      expect(mobileTokens.surface).toBe('#1D1429');
      expect(mobileTokens.raised).toBe('#2A1B38');
      expect(mobileTokens.textPrimary).toBe('#FDF2E9');
      expect(mobileTokens.action).toBe('#FF7A59');
      expect(mobileTokens.accent).toBe('#FFB347');
      expect(mobileTokens.sea).toBe('#00B4D8');
    });

    it('configures app.json splash to Island Vibes twilight #110D17', () => {
      const appJsonPath = path.resolve(__dirname, '../../apps/mobile/app.json');
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      expect(appJson.expo.splash.backgroundColor).toBe('#110D17');
    });
  });

  describe('4. Global CSS & Tailwind Variables', () => {
    it('defines Island Vibes variables in web globals.css', () => {
      const cssPath = path.resolve(__dirname, '../../apps/web/src/app/globals.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');
      expect(cssContent).toContain('--brand-twilight:     #110D17;');
      expect(cssContent).toContain('--brand-dusk:         #1D1429;');
      expect(cssContent).toContain('--brand-sandstone:    #FDF2E9;');
      expect(cssContent).toContain('--brand-sunrise:      #FF7A59;');
      expect(cssContent).toContain('--brand-gold:         #FFB347;');
      expect(cssContent).toContain('--brand-sea:          #00B4D8;');
    });

    it('enforces presence of glass utility in web globals.css', () => {
      const cssPath = path.resolve(__dirname, '../../apps/web/src/app/globals.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');
      expect(cssContent).toContain('.glass {');
      expect(cssContent).toContain('rgba(17, 13, 23, 0.70)');
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
