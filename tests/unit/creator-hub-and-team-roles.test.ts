import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  canTeamRolePerform,
  ROLE_PERMISSIONS,
  type CreatorTeamRole,
} from '../../packages/creator/src/index';

describe('TUKUBI Creator Hub & Team Roles — Verification Suite', () => {
  describe('1. CREATOR TEAM ROLES & RBAC MATRIX', () => {
    it('verifies admin role has full studio permissions', () => {
      expect(canTeamRolePerform('admin', 'manage_content')).toBe(true);
      expect(canTeamRolePerform('admin', 'publish_content')).toBe(true);
      expect(canTeamRolePerform('admin', 'view_analytics')).toBe(true);
      expect(canTeamRolePerform('admin', 'manage_team')).toBe(true);
      expect(canTeamRolePerform('admin', 'manage_monetization')).toBe(true);
      expect(canTeamRolePerform('admin', 'moderate_chat')).toBe(true);
    });

    it('verifies editor cannot publish or manage monetization', () => {
      expect(canTeamRolePerform('editor', 'manage_content')).toBe(true);
      expect(canTeamRolePerform('editor', 'view_analytics')).toBe(true);
      expect(canTeamRolePerform('editor', 'publish_content')).toBe(false);
      expect(canTeamRolePerform('editor', 'manage_monetization')).toBe(false);
      expect(canTeamRolePerform('editor', 'manage_team')).toBe(false);
    });

    it('verifies publisher can manage and publish content but cannot manage team or finance', () => {
      expect(canTeamRolePerform('publisher', 'manage_content')).toBe(true);
      expect(canTeamRolePerform('publisher', 'publish_content')).toBe(true);
      expect(canTeamRolePerform('publisher', 'view_analytics')).toBe(true);
      expect(canTeamRolePerform('publisher', 'manage_team')).toBe(false);
      expect(canTeamRolePerform('publisher', 'manage_monetization')).toBe(false);
    });

    it('verifies analyst only has view_analytics capability', () => {
      expect(canTeamRolePerform('analyst', 'view_analytics')).toBe(true);
      expect(canTeamRolePerform('analyst', 'manage_content')).toBe(false);
      expect(canTeamRolePerform('analyst', 'publish_content')).toBe(false);
      expect(canTeamRolePerform('analyst', 'moderate_chat')).toBe(false);
    });

    it('verifies moderator can moderate chat and view analytics only', () => {
      expect(canTeamRolePerform('moderator', 'moderate_chat')).toBe(true);
      expect(canTeamRolePerform('moderator', 'view_analytics')).toBe(true);
      expect(canTeamRolePerform('moderator', 'manage_content')).toBe(false);
      expect(canTeamRolePerform('moderator', 'manage_team')).toBe(false);
    });
  });

  describe('2. CREATOR HUB ROUTE & NAVIGATION ARCHITECTURE', () => {
    it('verifies dedicated creator-hub route exists on web', () => {
      const hubPath = resolve(__dirname, '../../apps/web/src/app/creator-hub/page.tsx');
      expect(existsSync(hubPath)).toBe(true);

      const hubContent = readFileSync(hubPath, 'utf-8');
      expect(hubContent).toContain('CreatorHubPage');
      expect(hubContent).toContain('/creator-studio');
      expect(hubContent).toContain('Caribbean Creator Hub');
      expect(hubContent).toContain('brand_campaign_briefs');
      expect(hubContent).toContain('Creator Academy');
    });

    it('verifies app-sidebar distinguishes Creator Hub and Creator Studio with explanatory labels', () => {
      const sidebarPath = resolve(__dirname, '../../apps/web/src/components/app-sidebar.tsx');
      const sidebarContent = readFileSync(sidebarPath, 'utf-8');

      expect(sidebarContent).toContain("href: '/creator-hub'");
      expect(sidebarContent).toContain("href: '/creator-studio'");
      expect(sidebarContent).toContain('Creator Hub');
      expect(sidebarContent).toContain('Creator Studio');
      expect(sidebarContent).toContain('Your home base, audience &amp; business');
      expect(sidebarContent).toContain('Create, manage, analyze &amp; monetize content');
    });
  });

  describe('3. ZERO PLACEHOLDER / ANALYTICS INTEGRITY', () => {
    it('verifies analytics-actions queries videos and does not hardcode views: 0', () => {
      const actionsPath = resolve(__dirname, '../../apps/web/src/lib/creator/analytics-actions.ts');
      const actionsContent = readFileSync(actionsPath, 'utf-8');

      expect(actionsContent).toContain('.from("videos")');
      expect(actionsContent).toContain('views: v.view_count || 0');
      expect(actionsContent).not.toMatch(/recentContent\s*=\s*posts\.slice.*views:\s*0/s);
    });

    it('verifies Creator Studio page dynamically computes recentEngagement instead of static 5.4 placeholder', () => {
      const studioPagePath = resolve(__dirname, '../../apps/web/src/app/creator-studio/page.tsx');
      const studioContent = readFileSync(studioPagePath, 'utf-8');

      expect(studioContent).not.toContain('recentEngagement: 5.4');
      expect(studioContent).toContain('profileCounts');
    });
  });

  describe('4. DATABASE MIGRATION 00072 INTEGRITY', () => {
    it('verifies migration 00072 defines creator_team_members and RLS policies', () => {
      const migrationPath = resolve(
        __dirname,
        '../../supabase/migrations/00072_creator_team_collaboration_and_roles.sql'
      );
      expect(existsSync(migrationPath)).toBe(true);

      const sqlContent = readFileSync(migrationPath, 'utf-8');
      expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.creator_team_members');
      expect(sqlContent).toContain('ALTER TABLE public.creator_team_members ENABLE ROW LEVEL SECURITY');
      expect(sqlContent).toContain('has_creator_team_role');
      expect(sqlContent).toContain('admin');
      expect(sqlContent).toContain('editor');
      expect(sqlContent).toContain('publisher');
      expect(sqlContent).toContain('analyst');
      expect(sqlContent).toContain('moderator');
    });
  });
});
