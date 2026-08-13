// Typed API Client Contracts & Services for CARIBBEAN ONE

export interface PostInput {
  authorId: string;
  content: string;
  visibility: 'public' | 'followers' | 'friends' | 'private';
  countryIso: string;
  culturalTags: string[];
  mediaUrls: string[];
}

export class APIClient {
  public static async createPost(input: PostInput) {
    if (!input.content && input.mediaUrls.length === 0) {
      throw new Error("Post must contain text content or media.");
    }

    return {
      id: `post_${Date.now()}`,
      ...input,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };
  }

  public static async fetchFeed(mode: 'for_you' | 'following' | 'friends' | 'caribbean' | 'local', countryIso?: string) {
    return [
      {
        id: 'post_01',
        author: { name: 'Jamaica Cultural Hub', flag: '🇯🇲', handle: '@jam_culture' },
        content: 'Big news for the Caribbean Diaspora in Toronto & NYC! We just dropped episode 14 of our podcast discussing the evolution of Reggae & Dancehall globally.',
        likes: 1240,
        comments: 84,
        createdAt: '2 hours ago',
        countryIso: countryIso || 'JAM',
        mode,
      }
    ];
  }
}
