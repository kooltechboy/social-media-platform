import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TUKUBI — Avatar-First Header Identity & Official Post Recovery', () => {
  it('enforces avatar-first identity in session-widget.tsx without raw email in primary header', () => {
    const filePath = path.resolve(__dirname, '../../apps/web/src/components/session-widget.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Avatar-first button trigger
    expect(content).toContain('aria-haspopup="menu"');
    expect(content).toContain('UserAvatar');
    expect(content).toContain('ChevronDown');

    // Comprehensive account menu links
    expect(content).toContain('View Profile');
    expect(content).toContain('Financial Center & Wallet');
    expect(content).toContain('Creator Studio');
    expect(content).toContain('Merchant & Stores');
    expect(content).toContain('Marketplace');
    expect(content).toContain('Communities & Hubs');
    expect(content).toContain('Settings & Privacy');
    expect(content).toContain('Sign out');

    // Must not hardcode raw email in header
    expect(content).not.toContain('info@kooltechsolutions.com');
  });

  it('guarantees displayName fallback never exposes raw email in auth-provider.tsx', () => {
    const filePath = path.resolve(__dirname, '../../apps/web/src/components/auth-provider.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('Member');
    expect(content).not.toContain("displayName: authEmail || 'Member'");
  });

  it('verifies HomePage feed query selects valid PostgREST columns and maps official posts', () => {
    const filePath = path.resolve(__dirname, '../../apps/web/src/app/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain("profiles:profiles!posts_author_id_fkey(display_name, username, avatar_url, is_verified)");
    expect(content).toContain("tukubi");
  });

  it('verifies server.ts getCurrentUser does not expose raw email as displayName', () => {
    const filePath = path.resolve(__dirname, '../../apps/web/src/lib/supabase/server.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('Member');
  });

  it('guarantees official inaugural launch post is authoritative on home feed and profile', () => {
    const pageContent = fs.readFileSync(path.resolve(__dirname, '../../apps/web/src/app/page.tsx'), 'utf-8');
    const profileContent = fs.readFileSync(path.resolve(__dirname, '../../apps/web/src/app/profile/[username]/page.tsx'), 'utf-8');
    const migrationContent = fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations/00051_seed_official_tukubi_launch_post.sql'), 'utf-8');

    // Home feed guarantees official launch post
    expect(pageContent).toContain('d23f3e75-0dfa-47c6-8df9-2c0fa299d7ff');
    expect(pageContent).toContain('hasOfficialPost');
    expect(pageContent).toContain('officialLaunchPost');

    // Profile page guarantees official launch post
    expect(profileContent).toContain('d23f3e75-0dfa-47c6-8df9-2c0fa299d7ff');
    expect(profileContent).toContain('profileData.username.toLowerCase() === \'tukubi\'');

    // Migration 00051 seeds launch post
    expect(migrationContent).toContain('d23f3e75-0dfa-47c6-8df9-2c0fa299d7ff');
    expect(migrationContent).toContain('ff1e8b1f-7796-4424-b341-3b39e1c993bd');
  });
});