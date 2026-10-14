import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as serverAuth from '../../apps/web/src/lib/supabase/server';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { updatePostAction, deletePostAction } from '../../apps/web/src/lib/social/actions';

describe('TUKUBI Post Editing & Deletion Authorization Suite', () => {
  const currentUserId = 'user-owner-1111';
  let mockPosts: Map<string, any>;
  let mockPageRoles: Map<string, any>;
  let mockBusinesses: Map<string, any>;
  let mockOfficialOperators: Map<string, any>;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockPosts = new Map();
    mockPageRoles = new Map();
    mockBusinesses = new Map();
    mockOfficialOperators = new Map();

    vi.spyOn(serverAuth, 'getCurrentUser').mockResolvedValue({
      id: currentUserId,
      email: 'owner@tukubi.caribbean',
      displayName: 'Captain Island',
      username: 'captain_island',
      avatarUrl: null,
    } as any);

    const mockSupabase = {
      from: (table: string) => {
        let selectedFields = '*';
        let filterEq: Record<string, any> = {};
        let updateData: any = null;
        let isDelete = false;

        const chain = {
          select: vi.fn((fields = '*') => {
            selectedFields = fields;
            return chain;
          }),
          eq: vi.fn((col: string, val: any) => {
            filterEq[col] = val;
            return chain;
          }),
          update: vi.fn((data: any) => {
            updateData = data;
            return chain;
          }),
          delete: vi.fn(() => {
            isDelete = true;
            return chain;
          }),
          maybeSingle: vi.fn(async () => {
            if (table === 'posts') {
              const post = mockPosts.get(filterEq.id);
              return { data: post || null, error: null };
            }
            if (table === 'page_roles') {
              const key = `${filterEq.page_id}:${filterEq.user_id}`;
              const role = mockPageRoles.get(key);
              return { data: role || null, error: null };
            }
            if (table === 'businesses') {
              const biz = mockBusinesses.get(filterEq.id);
              return { data: biz || null, error: null };
            }
            if (table === 'official_account_operators') {
              const op = mockOfficialOperators.get(filterEq.operator_profile_id);
              return { data: op || null, error: null };
            }
            return { data: null, error: null };
          }),
          single: vi.fn(async () => {
            if (table === 'posts') {
              if (updateData) {
                const existing = mockPosts.get(filterEq.id);
                if (!existing) return { data: null, error: { message: 'Not found' } };
                const updated = { ...existing, ...updateData };
                mockPosts.set(filterEq.id, updated);
                return { data: updated, error: null };
              }
              const post = mockPosts.get(filterEq.id);
              return { data: post || null, error: null };
            }
            return { data: null, error: null };
          }),
        };

        // For delete resolution
        (chain as any).then = (resolve: any) => {
          if (isDelete && table === 'posts') {
            mockPosts.delete(filterEq.id);
            resolve({ error: null });
            return;
          }
          resolve({ error: null });
        };

        return chain;
      },
    };

    vi.spyOn(serverAuth, 'createSupabaseServerClient').mockResolvedValue(mockSupabase as any);
  });

  it('allows direct author to update post content', async () => {
    mockPosts.set('post-1', {
      id: 'post-1',
      author_id: currentUserId,
      content: 'Original Caribbean post',
      visibility: 'public',
    });

    const res = await updatePostAction('post-1', {
      content: 'Updated Caribbean celebration update!',
    });

    expect(res.success).toBe(true);
    expect(res.error).toBeNull();
    expect(res.post.content).toBe('Updated Caribbean celebration update!');
  });

  it('rejects editing if post does not exist', async () => {
    const res = await updatePostAction('non-existent', {
      content: 'Will fail',
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('Post not found.');
  });

  it('rejects an unauthorized user attempting to edit another member\'s post', async () => {
    mockPosts.set('post-other', {
      id: 'post-other',
      author_id: 'stranger-999',
      content: 'Private thoughts',
    });

    const res = await updatePostAction('post-other', {
      content: 'Trying to tamper',
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('You do not have permission to edit this post.');
  });

  it('allows a Page owner to edit a post published on their Page by an editor', async () => {
    const pageId = 'page-caribbean-vibes';
    mockBusinesses.set(pageId, {
      id: pageId,
      owner_id: currentUserId,
      name: 'Caribbean Vibes Page',
    });

    mockPosts.set('page-post-1', {
      id: 'page-post-1',
      author_id: 'editor-subordinate-444',
      page_id: pageId,
      content: 'Draft announcement on Page',
    });

    const res = await updatePostAction('page-post-1', {
      content: 'Approved and refined Page announcement!',
    });

    expect(res.success).toBe(true);
    expect(res.error).toBeNull();
    expect(res.post.content).toBe('Approved and refined Page announcement!');
  });

  it('allows a Page administrator with assigned role to delete a Page post', async () => {
    const pageId = 'page-tech-co';
    mockPageRoles.set(`${pageId}:${currentUserId}`, {
      page_id: pageId,
      user_id: currentUserId,
      role: 'admin',
    });

    mockPosts.set('page-post-2', {
      id: 'page-post-2',
      author_id: 'former-employee-555',
      page_id: pageId,
      content: 'Outdated post',
    });

    const res = await deletePostAction('page-post-2');
    expect(res.success).toBe(true);
    expect(res.error).toBeNull();
    expect(mockPosts.has('page-post-2')).toBe(false);
  });

  it('rejects content exceeding character length limit', async () => {
    mockPosts.set('post-len', {
      id: 'post-len',
      author_id: currentUserId,
      content: 'Short content',
    });

    const oversized = 'a'.repeat(3001);
    const res = await updatePostAction('post-len', {
      content: oversized,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('cannot exceed 3000 characters');
  });
});
