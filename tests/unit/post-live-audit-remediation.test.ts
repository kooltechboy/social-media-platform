import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CARIBBEAN_TERRITORIES } from '../../apps/web/src/lib/constants/caribbean-territories';
import { DIASPORA_COUNTRIES } from '../../apps/web/src/lib/constants/diaspora-hubs';

describe('TUKUBI — Post-Live Deep Production Audit & Remediation Suite', () => {
  it('1. verifies that CARIBBEAN_TERRITORIES contains full 30+ island nations and territories', () => {
    expect(CARIBBEAN_TERRITORIES.length).toBeGreaterThanOrEqual(30);
    const isos = CARIBBEAN_TERRITORIES.map((t) => t.iso);
    expect(isos).toContain('JAM');
    expect(isos).toContain('TTO');
    expect(isos).toContain('BRB');
    expect(isos).toContain('DOM');
    expect(isos).toContain('HTI');
    expect(isos).toContain('BHS');
    expect(isos).toContain('PRI');
    expect(isos).toContain('GUY');
    expect(isos).toContain('SUR');
    expect(isos).toContain('LCA');
  });

  it('2. verifies that DIASPORA_COUNTRIES contains key diaspora hubs', () => {
    expect(DIASPORA_COUNTRIES.length).toBeGreaterThanOrEqual(5);
    const diasporaIsos = DIASPORA_COUNTRIES.map((c) => c.iso);
    expect(diasporaIsos).toContain('USA');
    expect(diasporaIsos).toContain('CAN');
    expect(diasporaIsos).toContain('GBR');
  });

  it('3. enforces zero hardcoded Jamaica defaults in page creation and moderator signup', () => {
    const pageCreatePath = path.resolve(__dirname, '../../apps/web/src/app/pages/create/page.tsx');
    const pageCreateContent = fs.readFileSync(pageCreatePath, 'utf8');
    expect(pageCreateContent).not.toContain("useState('Jamaica 🇯🇲')");
    expect(pageCreateContent).not.toContain("useState('Jamaica')");
    expect(pageCreateContent).toContain("useState('')");
    expect(pageCreateContent).toContain('Select Country / Territory...');

    const modSignupPath = path.resolve(__dirname, '../../apps/web/src/app/moderator/signup/page.tsx');
    const modSignupContent = fs.readFileSync(modSignupPath, 'utf8');
    expect(modSignupContent).not.toContain("country: 'Jamaica'");
    expect(modSignupContent).toContain("country: ''");
    expect(modSignupContent).toContain('Select Country / Island...');
  });

  it('4. enforces clean initial state for checkout modal and live host studio', () => {
    const checkoutPath = path.resolve(__dirname, '../../apps/web/src/components/unified-checkout-modal.tsx');
    const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
    expect(checkoutContent).not.toContain("country: 'Jamaica 🇯🇲'");

    const liveStudioPath = path.resolve(__dirname, '../../apps/web/src/components/live/live-host-studio.tsx');
    const liveStudioContent = fs.readFileSync(liveStudioPath, 'utf8');
    expect(liveStudioContent).not.toContain("useState('Kingston, Jamaica 🇯🇲')");
  });

  it('5. enforces presence of signout buttons across session widget, mobile nav, and settings', () => {
    const sessionWidgetPath = path.resolve(__dirname, '../../apps/web/src/components/session-widget.tsx');
    const sessionWidgetContent = fs.readFileSync(sessionWidgetPath, 'utf8');
    expect(sessionWidgetContent).toContain('signOut');
    expect(sessionWidgetContent).toContain('Sign out');

    const mobileNavPath = path.resolve(__dirname, '../../apps/web/src/components/mobile-nav.tsx');
    const mobileNavContent = fs.readFileSync(mobileNavPath, 'utf8');
    expect(mobileNavContent).toContain('handleSignOut');

    const settingsPath = path.resolve(__dirname, '../../apps/web/src/components/settings-view.tsx');
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    expect(settingsContent).toContain('signOut');
  });

  it('6. verifies definitive brand and tagline across the platform', () => {
    const logoPath = path.resolve(__dirname, '../../apps/web/src/components/brand/tukubi-logo.tsx');
    const logoContent = fs.readFileSync(logoPath, 'utf8');
    expect(logoContent).toContain('TUKUBI');
    expect(logoContent).toContain('The Caribbean Connected.');
    expect(logoContent).not.toContain('TUKUBI Ecosystem');
  });
});
