import React from 'react';
import { loadFeedPageData } from '../../../lib/feed/load-feed';
import FeedsView from '../../../components/feed/feeds-view';
import PublicFrontDoor from '../../../components/public-front-door';

export const dynamic = 'force-dynamic';

interface FeedsTabRouteProps {
  params: Promise<{ tab: string }>;
  searchParams?: Promise<{ cursor?: string }>;
}

export default async function FeedsTabRoute(props: FeedsTabRouteProps) {
  const params = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
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
  } = await loadFeedPageData(params.tab, cursor);

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
    />
  );
}
