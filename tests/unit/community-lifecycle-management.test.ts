import { describe, it, expect } from 'vitest';

describe('Community Hub Lifecycle Management', () => {
  interface CommunityEntity {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    rules: string | null;
    join_policy: 'public' | 'private' | 'invite_only';
    avatar_url: string | null;
    member_count: number;
    is_archived: boolean;
    archived_at: string | null;
    created_by: string;
  }

  const mockCommunity: CommunityEntity = {
    id: 'comm-202',
    name: 'Barbados Tech & Diaspora Hub',
    slug: 'barbados-tech',
    description: 'Connecting Bajans in technology, engineering, and remote work worldwide.',
    rules: '1. Support each other. 2. Authentic discussions only.',
    join_policy: 'public',
    avatar_url: 'https://images.tukubi.com/comm-bajan.png',
    member_count: 342,
    is_archived: false,
    archived_at: null,
    created_by: 'user-bridgetown-1',
  };

  describe('Update Settings & Rules', () => {
    it('allows creator or admin to update name, rules, and join policy', () => {
      const updateCommunity = (
        comm: CommunityEntity,
        requester: { id: string; role: 'creator' | 'admin' | 'member' },
        updates: Partial<CommunityEntity>
      ) => {
        if (requester.id !== comm.created_by && requester.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        if (updates.name && updates.name.trim().length < 3) {
          throw new Error('Name too short');
        }
        return { ...comm, ...updates };
      };

      const updated = updateCommunity(
        mockCommunity,
        { id: 'user-bridgetown-1', role: 'creator' },
        {
          rules: '1. Uplift Caribbean youth. 2. Share verified opportunities.',
          join_policy: 'private',
        }
      );

      expect(updated.rules).toContain('Uplift Caribbean youth');
      expect(updated.join_policy).toBe('private');
    });

    it('rejects regular members from updating community settings', () => {
      const updateCommunity = (
        comm: CommunityEntity,
        requester: { id: string; role: 'creator' | 'admin' | 'member' },
        updates: Partial<CommunityEntity>
      ) => {
        if (requester.id !== comm.created_by && requester.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return { ...comm, ...updates };
      };

      expect(() =>
        updateCommunity(
          mockCommunity,
          { id: 'user-regular-member', role: 'member' },
          { name: 'Hijacked Community' }
        )
      ).toThrow('Unauthorized');
    });
  });

  describe('Archival Lifecycle', () => {
    it('allows only the creator to archive the community hub', () => {
      const toggleArchive = (comm: CommunityEntity, requesterId: string) => {
        if (requesterId !== comm.created_by) {
          return { error: 'Only creator can archive' };
        }
        const next = !comm.is_archived;
        return {
          community: {
            ...comm,
            is_archived: next,
            archived_at: next ? new Date().toISOString() : null,
          },
        };
      };

      const unauthorized = toggleArchive(mockCommunity, 'user-someone-else');
      expect(unauthorized.error).toBe('Only creator can archive');

      const authorized = toggleArchive(mockCommunity, 'user-bridgetown-1');
      expect(authorized.community?.is_archived).toBe(true);
      expect(authorized.community?.archived_at).toBeTruthy();
    });
  });

  describe('Community Deletion Protection', () => {
    it('requires exact community name confirmation to delete', () => {
      const deleteCommunity = (
        comm: CommunityEntity,
        requesterId: string,
        confirmationName: string
      ) => {
        if (requesterId !== comm.created_by) {
          return { error: 'Only creator can delete' };
        }
        if (confirmationName.trim().toLowerCase() !== comm.name.trim().toLowerCase()) {
          return { error: 'Name confirmation does not match' };
        }
        return { success: true };
      };

      const wrong = deleteCommunity(mockCommunity, 'user-bridgetown-1', 'Bajan Tech');
      expect(wrong.error).toBe('Name confirmation does not match');

      const correct = deleteCommunity(
        mockCommunity,
        'user-bridgetown-1',
        'Barbados Tech & Diaspora Hub'
      );
      expect(correct.success).toBe(true);
    });
  });
});
