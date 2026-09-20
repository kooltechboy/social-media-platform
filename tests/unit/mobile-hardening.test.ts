import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { mobileAuthStorage } from '../../apps/mobile/src/lib/storage';
import { resolveReelMediaUrl } from '../../apps/mobile/src/lib/mediaUpload';

describe('TUKUBI Mobile Hardening & Remediation Verification Suite', () => {
  const mobileRoot = path.resolve(process.cwd(), 'apps/mobile');
  const screensDir = path.join(mobileRoot, 'src/screens');
  const appPath = path.join(mobileRoot, 'App.tsx');
  const supabasePath = path.join(mobileRoot, 'src/lib/supabase.ts');
  const packageJsonPath = path.join(mobileRoot, 'package.json');

  describe('1. Mobile Auth Storage & Session Persistence', () => {
    it('verifies @react-native-async-storage/async-storage is declared in package.json', () => {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(pkg.dependencies['@react-native-async-storage/async-storage']).toBeDefined();
    });

    it('verifies mobile supabase client initializes with mobileAuthStorage adapter', () => {
      const content = fs.readFileSync(supabasePath, 'utf-8');
      expect(content).toContain("import { mobileAuthStorage } from './storage'");
      expect(content).toContain('storage: mobileAuthStorage');
      expect(content).toContain('persistSession: true');
      expect(content).toContain('autoRefreshToken: true');
      expect(content).toContain('detectSessionInUrl: false');
    });

    it('validates mobileAuthStorage getItem, setItem, and removeItem operations', async () => {
      const testKey = 'tukubi_test_token';
      const testValue = JSON.stringify({ access_token: 'jwt_mock_123', expires_at: 1800000000 });

      await mobileAuthStorage.setItem(testKey, testValue);
      const retrieved = await mobileAuthStorage.getItem(testKey);
      expect(retrieved).toBe(testValue);

      await mobileAuthStorage.removeItem(testKey);
      const deleted = await mobileAuthStorage.getItem(testKey);
      expect(deleted).toBeNull();
    });

    it('handles non-existent keys gracefully without throwing', async () => {
      const missing = await mobileAuthStorage.getItem('non_existent_key_999');
      expect(missing).toBeNull();
    });
  });

  describe('2. Reels Storage Path & Media URL Resolution', () => {
    it('returns null when input path is empty, undefined, or null', () => {
      expect(resolveReelMediaUrl(null)).toBeNull();
      expect(resolveReelMediaUrl(undefined)).toBeNull();
      expect(resolveReelMediaUrl('')).toBeNull();
      expect(resolveReelMediaUrl('   ')).toBeNull();
    });

    it('preserves absolute HTTP and HTTPS URLs without mutation', () => {
      const httpsUrl = 'https://videodelivery.net/abc123xyz/manifest/video.m3u8';
      const httpUrl = 'http://localhost:54321/storage/v1/object/public/videos/reel.mp4';
      expect(resolveReelMediaUrl(httpsUrl)).toBe(httpsUrl);
      expect(resolveReelMediaUrl(httpUrl)).toBe(httpUrl);
    });

    it('resolves relative storage paths to Supabase Storage public URLs', () => {
      const relativePath = 'creator_456/reels/carnival_clip.mp4';
      const resolved = resolveReelMediaUrl(relativePath, 'videos');
      expect(resolved).toContain('/storage/v1/object/public/videos/creator_456/reels/carnival_clip.mp4');
    });

    it('verifies ReelsScreen renders using resolved videoUri', () => {
      const reelsContent = fs.readFileSync(path.join(screensDir, 'ReelsScreen.tsx'), 'utf-8');
      expect(reelsContent).toContain('resolveReelMediaUrl');
      expect(reelsContent).toContain('resolvedVideoUrl: resolveReelMediaUrl');
      expect(reelsContent).toContain('videoUri = item.resolvedVideoUrl || resolveReelMediaUrl');
      expect(reelsContent).toContain('source={{ uri: videoUri }}');
    });
  });

  describe('3. Live Streaming Schema Alignment (Migration 00065)', () => {
    const liveContent = fs.readFileSync(path.join(screensDir, 'LiveScreen.tsx'), 'utf-8');

    it('queries playback_hls_url and rtmps_url from livestreams', () => {
      expect(liveContent).toContain('playback_hls_url');
      expect(liveContent).toContain('playback_dash_url');
      expect(liveContent).toContain('webrtc_url');
      expect(liveContent).toContain('rtmps_url');
    });

    it('does not depend on legacy non-existent stream_url column', () => {
      expect(liveContent).not.toContain('d.stream_url');
    });

    it('maps live playback URL prioritizing HLS/WebRTC manifests', () => {
      expect(liveContent).toContain('d.playback_hls_url || d.webrtc_url || d.playback_dash_url');
      expect(liveContent).toContain('playbackHlsUrl: d.playback_hls_url');
      expect(liveContent).toContain('rtmpsUrl: d.rtmps_url');
    });
  });

  describe('4. Store Policy Compliance (§3.1.1) in Financial Center', () => {
    const financeContent = fs.readFileSync(path.join(screensDir, 'FinancialCenterScreen.tsx'), 'utf-8');

    it('displays prominent App Store Compliance Notice (§3.1.1)', () => {
      expect(financeContent).toContain('Mobile Store Policy &amp; Rails Compliance (§3.1.1)');
      expect(financeContent).toContain('Digital Goods &amp; Creator Tips:');
      expect(financeContent).toContain('Apple In-App Purchase / Google Play Billing');
    });

    it('explicitly scopes merchant rails to physical marketplace orders and payouts', () => {
      expect(financeContent).toContain('Marketplace &amp; Seller Payouts:');
      expect(financeContent).toContain('Connected Caribbean &amp; Global Rails (Marketplace / Payouts)');
    });
  });

  describe('5. Media Ingestion & Camera Roll in CreateScreen', () => {
    it('verifies expo-image-picker is declared in mobile package.json', () => {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(pkg.dependencies['expo-image-picker']).toBeDefined();
    });

    it('verifies CreateScreen imports expo-image-picker and uploadMedia', () => {
      const createContent = fs.readFileSync(path.join(screensDir, 'CreateScreen.tsx'), 'utf-8');
      expect(createContent).toContain("import * as ImagePicker from 'expo-image-picker'");
      expect(createContent).toContain("import { uploadMedia } from '../lib/mediaUpload'");
      expect(createContent).toContain('handlePickImage');
      expect(createContent).toContain('launchImageLibraryAsync');
    });

    it('verifies camera roll button and loading indicator exist in CreateScreen', () => {
      const createContent = fs.readFileSync(path.join(screensDir, 'CreateScreen.tsx'), 'utf-8');
      expect(createContent).toContain('Choose from Camera Roll');
      expect(createContent).toContain('pickImageBtn');
      expect(createContent).toContain('uploadingMedia');
    });
  });

  describe('6. Navigation & Screen Presentation Hardening', () => {
    const appContent = fs.readFileSync(appPath, 'utf-8');

    it('hides top header and tab bar for immersive ReelsScreen', () => {
      expect(appContent).toMatch(/name=["']Reels["'][\s\S]*?headerShown:\s*false/);
      expect(appContent).toMatch(/name=["']Reels["'][\s\S]*?tabBarStyle:\s*\{\s*display:\s*['"]none['"]\s*\}/);
    });

    it('hides top header and tab bar for immersive LiveScreen', () => {
      expect(appContent).toMatch(/name=["']Live["'][\s\S]*?headerShown:\s*false/);
      expect(appContent).toMatch(/name=["']Live["'][\s\S]*?tabBarStyle:\s*\{\s*display:\s*['"]none['"]\s*\}/);
    });

    it('hides global header and tab bar for modal creation screens to prevent double headers', () => {
      expect(appContent).toMatch(/name=["']Create["'][\s\S]*?headerShown:\s*false/);
      expect(appContent).toMatch(/name=["']SellProduct["'][\s\S]*?headerShown:\s*false/);
    });
  });
});
