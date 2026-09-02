// Typed API Client Contracts & Services for TUKUBI

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

  public static async fetchFeed(
    mode: 'for_you' | 'following' | 'friends' | 'caribbean' | 'local',
    countryIso?: string
  ) {
    // Production typed signature: returns empty feed if no backend query is bound
    return [];
  }
}
