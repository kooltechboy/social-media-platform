import React from 'react';
import { loadFeedPageData } from '../../lib/feed/load-feed';
import FeedsView from '../../components/feed/feeds-view';
import PublicFrontDoor from '../../components/public-front-door';

export const dynamic = 'force-dynamic';

interface FeedsPageProps {
  searchParams?: Promise<{ mode?: string; filter?: string; tab?: string; cursor?: string }>;
}

export default async function FeedsPage(props: FeedsPageProps) {
  const searchParams = await props.searchParams;
  const rawMode = searchParams?.tab || searchParams?.filter || searchParams?.mode || 'for_you';
  const cursor = typeof searchParams?.cursor === 'string' ? searchParams.cursor : undefined;

  const {
    user,
    mode,
    posts,
    nextCursor,
    friendsCount,
    followingCount,
    favoritesCount,
    suggestedCreators,
    trendingTopics,
  } = await loadFeedPageData(rawMode, cursor);

  if (!user) {
    return <PublicFrontDoor />;
  }

  return (
    <FeedsView
      mode={mode}
      initialPosts={posts}
      currentUserId={user.id}
      nextCursor={nextCursor}
      friendsCount={friendsCount}
      followingCount={followingCount}
      favoritesCount={favoritesCount}
      suggestedCreators={suggestedCreators}
      trendingTopics={trendingTopics}
    />
  );
}
