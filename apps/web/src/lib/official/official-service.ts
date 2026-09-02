import { SupabaseClient } from '@supabase/supabase-js';
import {
  OfficialAccount,
  OfficialAccountOperator,
  OfficialPostDraft,
  OfficialContentType,
  OfficialPostDraftStatus,
  OfficialActorType,
  SENSITIVE_CONTENT_TYPES,
  AUTO_PUBLISHABLE_BOT_TYPES,
} from './types';

export interface CreateDraftParams {
  officialAccountId: string;
  authorOperatorId?: string | null;
  actorType?: OfficialActorType;
  content: string;
  mediaUrls?: string[];
  culturalTags?: string[];
  contentType?: OfficialContentType;
  requiresApproval?: boolean;
  scheduledFor?: string | null;
}

export interface PublishDirectParams {
  officialAccountId: string;
  operatorUserId: string;
  content: string;
  mediaUrls?: string[];
  culturalTags?: string[];
  contentType?: OfficialContentType;
  isPinned?: boolean;
}

export class OfficialService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Look up an official account by username (e.g. 'tukubi').
   */
  async getOfficialAccountByUsername(username: string): Promise<OfficialAccount | null> {
    const cleanHandle = username.replace(/^@/, '').toLowerCase().trim();

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, is_official, is_verified')
      .ilike('username', cleanHandle)
      .maybeSingle();

    if (!profile) return null;

    const { data: officialAcc } = await this.supabase
      .from('official_accounts')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!officialAcc) return null;

    return {
      ...officialAcc,
      profile,
    };
  }

  /**
   * Look up an official account by ID.
   */
  async getOfficialAccountById(id: string): Promise<OfficialAccount | null> {
    const { data: officialAcc } = await this.supabase
      .from('official_accounts')
      .select('*, profile:profile_id(username, display_name, avatar_url, bio, is_official, is_verified)')
      .eq('id', id)
      .maybeSingle();

    return (officialAcc as OfficialAccount) || null;
  }

  /**
   * Verify if a user is an authorized operator for the official account.
   */
  async verifyOperatorPermission(
    officialAccountId: string,
    userId: string,
    minRole: 'owner' | 'administrator' | 'editor' | 'publisher' | 'moderator' = 'publisher'
  ): Promise<boolean> {
    // 1. Check platform super_admin / admin roles
    const { data: adminAccount } = await this.supabase
      .from('accounts')
      .select('role, status')
      .or(`profile_id.eq.${userId},id.eq.${userId}`)
      .eq('status', 'active')
      .maybeSingle();

    if (
      adminAccount &&
      ['super_admin', 'superadmin', 'management', 'admin'].includes(adminAccount.role)
    ) {
      return true;
    }

    // 2. Check direct operator table
    const { data: operator } = await this.supabase
      .from('official_account_operators')
      .select('role')
      .eq('official_account_id', officialAccountId)
      .eq('operator_profile_id', userId)
      .maybeSingle();

    if (!operator) return false;

    const roleHierarchy: Record<string, number> = {
      moderator: 1,
      publisher: 2,
      editor: 3,
      administrator: 4,
      owner: 5,
    };

    const userLevel = roleHierarchy[operator.role] || 0;
    const requiredLevel = roleHierarchy[minRole] || 2;

    return userLevel >= requiredLevel;
  }

  /**
   * Create an official post draft (by human operator or bot).
   */
  async createDraft(params: CreateDraftParams): Promise<OfficialPostDraft> {
    const contentType = params.contentType || 'announcement';
    const actorType = params.actorType || 'human_operator';

    // Sensitive categories always require approval
    const isSensitive = SENSITIVE_CONTENT_TYPES.has(contentType);
    const requiresApproval =
      params.requiresApproval ?? (actorType === 'system_bot' || isSensitive);

    const initialStatus: OfficialPostDraftStatus = requiresApproval
      ? 'pending_approval'
      : 'draft';

    const { data, error } = await this.supabase
      .from('official_post_drafts')
      .insert({
        official_account_id: params.officialAccountId,
        author_operator_id: params.authorOperatorId || null,
        actor_type: actorType,
        content: params.content,
        media_urls: params.mediaUrls || [],
        cultural_tags: params.culturalTags || [],
        content_type: contentType,
        status: initialStatus,
        requires_approval: requiresApproval,
        scheduled_for: params.scheduledFor || null,
      })
      .select('*, official_account:official_accounts(*), author_profile:profiles!official_post_drafts_author_operator_id_fkey(username, display_name, avatar_url)')
      .single();

    if (error) {
      throw new Error(`Failed to create official draft: ${error.message}`);
    }

    // Immutable audit trail
    await this.logAudit({
      actorId: params.authorOperatorId || null,
      action: 'official_draft_created',
      entityType: 'official_post_draft',
      entityId: data.id,
      metadata: {
        official_account_id: params.officialAccountId,
        actor_type: actorType,
        content_type: contentType,
        requires_approval: requiresApproval,
        status: initialStatus,
      },
    });

    return data as OfficialPostDraft;
  }

  /**
   * Approve a pending official post draft.
   */
  async approveDraft(draftId: string, approverUserId: string): Promise<OfficialPostDraft> {
    const { data: draft, error: fetchErr } = await this.supabase
      .from('official_post_drafts')
      .select('*')
      .eq('id', draftId)
      .single();

    if (fetchErr || !draft) {
      throw new Error('Draft not found.');
    }

    const isAuthorized = await this.verifyOperatorPermission(
      draft.official_account_id,
      approverUserId,
      'editor'
    );

    if (!isAuthorized) {
      throw new Error('Unauthorized to approve drafts for this official account.');
    }

    const { data, error } = await this.supabase
      .from('official_post_drafts')
      .update({
        status: 'approved',
        approved_by: approverUserId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to approve draft: ${error.message}`);
    }

    await this.logAudit({
      actorId: approverUserId,
      action: 'official_draft_approved',
      entityType: 'official_post_draft',
      entityId: draftId,
      metadata: {
        official_account_id: draft.official_account_id,
        content_type: draft.content_type,
        actor_type: draft.actor_type,
      },
    });

    return data as OfficialPostDraft;
  }

  /**
   * Publish an approved official draft directly into the production posts feed.
   */
  async publishDraft(draftId: string, publisherUserId: string): Promise<{ postId: string }> {
    const { data: draft, error: fetchErr } = await this.supabase
      .from('official_post_drafts')
      .select('*, official_account:official_accounts(profile_id)')
      .eq('id', draftId)
      .single();

    if (fetchErr || !draft) {
      throw new Error('Draft not found.');
    }

    if (draft.requires_approval && draft.status !== 'approved') {
      throw new Error('Draft requires approval before it can be published.');
    }

    const isAuthorized = await this.verifyOperatorPermission(
      draft.official_account_id,
      publisherUserId,
      'publisher'
    );

    if (!isAuthorized) {
      throw new Error('Unauthorized to publish for this official account.');
    }

    const profileId = draft.official_account?.profile_id;
    if (!profileId) {
      throw new Error('Official account profile link missing.');
    }

    // Insert into production posts table
    const { data: post, error: postErr } = await this.supabase
      .from('posts')
      .insert({
        author_id: profileId,
        content: draft.content,
        visibility: 'public',
        media_urls: draft.media_urls || [],
        cultural_tags: draft.cultural_tags || [],
        is_official: true,
        official_content_type: draft.content_type,
      })
      .select('id')
      .single();

    if (postErr) {
      throw new Error(`Failed to insert post: ${postErr.message}`);
    }

    // Update draft record with published status and post ID
    await this.supabase
      .from('official_post_drafts')
      .update({
        status: 'published',
        published_post_id: post.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId);

    await this.logAudit({
      actorId: publisherUserId,
      action: 'official_post_published',
      entityType: 'posts',
      entityId: post.id,
      metadata: {
        draft_id: draftId,
        official_account_id: draft.official_account_id,
        profile_id: profileId,
        content_type: draft.content_type,
      },
    });

    return { postId: post.id };
  }

  /**
   * Direct publishing for authorized human operators (Owner / Admin / Publisher).
   */
  async directPublish(params: PublishDirectParams): Promise<{ postId: string }> {
    const isAuthorized = await this.verifyOperatorPermission(
      params.officialAccountId,
      params.operatorUserId,
      'publisher'
    );

    if (!isAuthorized) {
      throw new Error('Unauthorized: Operator permissions required to publish as official account.');
    }

    const officialAccount = await this.getOfficialAccountById(params.officialAccountId);
    if (!officialAccount) {
      throw new Error('Official account not found.');
    }

    const contentType = params.contentType || 'announcement';

    const { data: post, error } = await this.supabase
      .from('posts')
      .insert({
        author_id: officialAccount.profile_id,
        content: params.content,
        visibility: 'public',
        media_urls: params.mediaUrls || [],
        cultural_tags: params.culturalTags || [],
        is_official: true,
        official_content_type: contentType,
        is_pinned: params.isPinned ?? false,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to publish official post: ${error.message}`);
    }

    await this.logAudit({
      actorId: params.operatorUserId,
      action: 'official_post_published_direct',
      entityType: 'posts',
      entityId: post.id,
      metadata: {
        official_account_id: params.officialAccountId,
        profile_id: officialAccount.profile_id,
        content_type: contentType,
        is_pinned: params.isPinned ?? false,
      },
    });

    return { postId: post.id };
  }

  /**
   * Toggle pinned status on an official post.
   */
  async togglePin(postId: string, operatorUserId: string, isPinned: boolean): Promise<boolean> {
    const { data: post, error: fetchErr } = await this.supabase
      .from('posts')
      .select('id, author_id, is_official')
      .eq('id', postId)
      .single();

    if (fetchErr || !post) {
      throw new Error('Post not found.');
    }

    const { data: officialAcc } = await this.supabase
      .from('official_accounts')
      .select('id')
      .eq('profile_id', post.author_id)
      .maybeSingle();

    if (!officialAcc) {
      throw new Error('Post does not belong to an official account.');
    }

    const isAuthorized = await this.verifyOperatorPermission(
      officialAcc.id,
      operatorUserId,
      'publisher'
    );

    if (!isAuthorized) {
      throw new Error('Unauthorized to pin posts for this official account.');
    }

    const { error: updateErr } = await this.supabase
      .from('posts')
      .update({ is_pinned: isPinned })
      .eq('id', postId);

    if (updateErr) {
      throw new Error(`Failed to update pinned state: ${updateErr.message}`);
    }

    await this.logAudit({
      actorId: operatorUserId,
      action: isPinned ? 'official_post_pinned' : 'official_post_unpinned',
      entityType: 'posts',
      entityId: postId,
      metadata: {
        official_account_id: officialAcc.id,
        is_pinned: isPinned,
      },
    });

    return true;
  }

  /**
   * Internal audit log helper.
   */
  private async logAudit(params: {
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.supabase.from('audit_logs').insert({
        actor_id: params.actorId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        metadata: params.metadata,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Non-blocking audit failure
    }
  }
}
