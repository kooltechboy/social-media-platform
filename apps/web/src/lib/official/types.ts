export type OfficialAccountClassification =
  | 'official_platform'
  | 'official_support'
  | 'official_creator'
  | 'official_business'
  | 'official_culture'
  | 'official_diaspora'
  | 'official_news';

export type OfficialAccountOperatorRole =
  | 'owner'
  | 'administrator'
  | 'editor'
  | 'publisher'
  | 'moderator';

export type OfficialContentType =
  | 'announcement'
  | 'platform_update'
  | 'community'
  | 'creator_spotlight'
  | 'business_spotlight'
  | 'culture'
  | 'diaspora'
  | 'event'
  | 'education'
  | 'feature'
  | 'safety'
  | 'news'
  | 'welcome';

export type OfficialPostDraftStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'published'
  | 'rejected';

export type OfficialActorType = 'human_operator' | 'system_bot' | 'service_role';

export interface OfficialAccount {
  id: string;
  profile_id: string;
  classification: OfficialAccountClassification;
  department: string | null;
  status: 'active' | 'inactive' | 'archived';
  is_system_account: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    is_official: boolean;
    is_verified: boolean;
  } | null;
}

export interface OfficialAccountOperator {
  id: string;
  official_account_id: string;
  operator_profile_id: string;
  role: OfficialAccountOperatorRole;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
  operator_profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export interface OfficialPostDraft {
  id: string;
  official_account_id: string;
  author_operator_id: string | null;
  actor_type: OfficialActorType;
  content: string;
  media_urls: string[];
  cultural_tags: string[];
  content_type: OfficialContentType;
  status: OfficialPostDraftStatus;
  requires_approval: boolean;
  approved_by: string | null;
  approved_at: string | null;
  scheduled_for: string | null;
  published_post_id: string | null;
  created_at: string;
  updated_at: string;
  official_account?: OfficialAccount;
  author_profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export const SENSITIVE_CONTENT_TYPES: ReadonlySet<OfficialContentType> = new Set([
  'announcement',
  'platform_update',
  'safety',
  'news',
]);

export const AUTO_PUBLISHABLE_BOT_TYPES: ReadonlySet<OfficialContentType> = new Set([
  'community',
  'creator_spotlight',
  'business_spotlight',
  'culture',
  'diaspora',
  'event',
  'education',
  'welcome',
]);
