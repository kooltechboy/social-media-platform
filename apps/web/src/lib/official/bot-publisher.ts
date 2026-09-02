import { SupabaseClient } from '@supabase/supabase-js';
import { OfficialService } from './official-service';
import {
  OfficialContentType,
  OfficialPostDraft,
  SENSITIVE_CONTENT_TYPES,
  AUTO_PUBLISHABLE_BOT_TYPES,
} from './types';

export interface BotPostSubmission {
  officialAccountUsername?: string;
  officialAccountId?: string;
  content: string;
  mediaUrls?: string[];
  culturalTags?: string[];
  contentType: OfficialContentType;
  allowAutoPublish?: boolean;
}

export interface BotSubmissionResult {
  status: 'published' | 'pending_approval' | 'draft';
  draftId: string;
  postId?: string;
  message: string;
}

export class TukubiBotPublisher {
  private readonly officialService: OfficialService;

  constructor(private readonly supabase: SupabaseClient) {
    this.officialService = new OfficialService(supabase);
  }

  /**
   * Submit content as the TUKUBI Bot (actor_type: system_bot).
   * Enforces least-privilege security boundaries and human approval gates.
   */
  async submitBotContent(params: BotPostSubmission): Promise<BotSubmissionResult> {
    // 1. Resolve official account
    let officialAccount = null;
    if (params.officialAccountId) {
      officialAccount = await this.officialService.getOfficialAccountById(params.officialAccountId);
    } else {
      const handle = params.officialAccountUsername || 'tukubi';
      officialAccount = await this.officialService.getOfficialAccountByUsername(handle);
    }

    if (!officialAccount) {
      throw new Error('Official account target not found for TUKUBI Bot publishing.');
    }

    const isSensitive = SENSITIVE_CONTENT_TYPES.has(params.contentType);
    const isAutoPublishCategory = AUTO_PUBLISHABLE_BOT_TYPES.has(params.contentType);

    // If sensitive, ALWAYS require human operator approval regardless of allowAutoPublish flag
    const requiresApproval = isSensitive || !params.allowAutoPublish || !isAutoPublishCategory;

    // 2. Create the draft in the database
    const draft = await this.officialService.createDraft({
      officialAccountId: officialAccount.id,
      authorOperatorId: null,
      actorType: 'system_bot',
      content: params.content,
      mediaUrls: params.mediaUrls || [],
      culturalTags: params.culturalTags || [],
      contentType: params.contentType,
      requiresApproval: requiresApproval,
    });

    // 3. Auto-publish only if strictly permissible
    if (!requiresApproval && params.allowAutoPublish && isAutoPublishCategory) {
      // Approve and publish via service
      const { data: post, error } = await this.supabase
        .from('posts')
        .insert({
          author_id: officialAccount.profile_id,
          content: params.content,
          visibility: 'public',
          media_urls: params.mediaUrls || [],
          cultural_tags: params.culturalTags || [],
          is_official: true,
          official_content_type: params.contentType,
        })
        .select('id')
        .single();

      if (!error && post) {
        await this.supabase
          .from('official_post_drafts')
          .update({
            status: 'published',
            published_post_id: post.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draft.id);

        return {
          status: 'published',
          draftId: draft.id,
          postId: post.id,
          message: 'TUKUBI Bot published non-sensitive community content directly.',
        };
      }
    }

    return {
      status: 'pending_approval',
      draftId: draft.id,
      message: isSensitive
        ? 'Content is classified as sensitive and routed to authorized human operator queue for review.'
        : 'Content draft created and awaiting operator approval before release.',
    };
  }
}
