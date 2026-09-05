// Typed API Client Contracts & Services for TUKUBI

export interface PostInput {
  authorId: string;
  content: string;
  visibility: 'public' | 'followers' | 'friends' | 'private';
  countryIso: string;
  culturalTags: string[];
  mediaUrls: string[];
}

/**
 * @deprecated This package is not used. Real data operations are performed via
 * Next.js Server Actions in apps/web/src/lib/ which call Supabase directly.
 * This package is scheduled for removal in Phase 2 cleanup.
 */
export const APIClient = {
  fetchFeed: async () => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[APIClient] fetchFeed() is a stub. Use server actions instead.');
    }
    return [];
  },
  createPost: async () => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[APIClient] createPost() is a stub. Use createPostAction() instead.');
    }
    return null;
  },
};
