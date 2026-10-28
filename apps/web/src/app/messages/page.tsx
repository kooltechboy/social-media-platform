import React from 'react';
import { MessageSquare, ArrowLeft, Users, Plus } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import MessagesCenterClient, { type ConversationSummary } from '../../components/messages/messages-center-client';
import { type ThreadMessage } from '../../components/message-thread';
import { type NewMessageMember } from '../../components/messages/new-message-modal';

export const dynamic = 'force-dynamic';

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; u?: string; user?: string; compose?: string; tab?: string }>;
}) {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  if (!user || !supabase) {
    return (
      <div className="min-h-screen bg-transparent text-white flex items-center justify-center p-6">
        <div className="bg-[#140C22]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 text-center max-w-sm shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center mx-auto shadow-md">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-black text-white">Caribbean Messages</h1>
            <p className="text-xs text-slate-300">
              Sign in to chat with friends, creators, businesses, and the diaspora.
            </p>
          </div>
          <Link
            href="/login?next=/messages"
            className="inline-block w-full bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:opacity-90 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition-opacity shadow-md"
          >
            Sign In to Chat
          </Link>
        </div>
      </div>
    );
  }

  let targetConversationId: string | null = null;
  let targetResolvedProfile: { id: string; displayName: string; username: string; avatarUrl: string | null } | null = null;
  let conversationError: string | null = null;

  // Authoritative Canonical Direct Conversation Resolution
  const targetUserParam = params.u || params.user;
  if (targetUserParam) {
    const { getOrCreateDirectConversation } = await import('../../lib/messaging/direct-conversations');
    const convResult = await getOrCreateDirectConversation(targetUserParam, user.id);
    if (convResult.error) {
      conversationError = convResult.error;
    } else if (convResult.conversationId) {
      targetConversationId = convResult.conversationId;
      targetResolvedProfile = convResult.targetProfile || null;
    }
  }

  // Load User's Active Memberships, Real Accepted Friends & Message Requests
  const [membershipsResult, friendsResult, requestsResult] = await Promise.all([
    supabase
      .from('conversation_members')
      .select('conversation_id, last_read_sequence, status, conversations(id, kind, category, title, last_message_at, last_sequence_number)')
      .eq('profile_id', user.id)
      .is('left_at', null)
      .order('last_message_at', { ascending: false, foreignTable: 'conversations' }),
    // Retrieve actual accepted, unblocked friends
    (async () => {
      try {
        const rpcRes = await supabase.rpc('get_user_messaging_friends', { viewer_id: user.id });
        if (!rpcRes.error && Array.isArray(rpcRes.data) && rpcRes.data.length > 0) {
          return { data: rpcRes.data };
        }
      } catch {}

      try {
        const { data: frRows } = await supabase
          .from('friendships')
          .select('id, requester_id, addressee_id, status, created_at, updated_at')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

        if (!frRows || frRows.length === 0) return { data: [] };

        const friendIds = frRows.map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id));

        // Filter out blocked users
        const { data: blocks } = await supabase
          .from('blocks')
          .select('blocker_id, blocked_id')
          .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

        const blockedSet = new Set<string>();
        (blocks || []).forEach((b) => {
          blockedSet.add(b.blocker_id === user.id ? b.blocked_id : b.blocker_id);
        });

        const allowedFriendIds = friendIds.filter((id) => !blockedSet.has(id));
        if (allowedFriendIds.length === 0) return { data: [] };

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, is_verified, bio, updated_at')
          .in('id', allowedFriendIds);

        return { data: profiles || [] };
      } catch {
        return { data: [] };
      }
    })(),
    (async () => {
      try {
        const res = await supabase
          .from('message_requests')
          .select('id, conversation_id, sender_id, status, created_at, sender:profiles!message_requests_sender_id_fkey(display_name, username, avatar_url)')
          .eq('receiver_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        return res;
      } catch {
        return { data: [] };
      }
    })(),
  ]);

  const rows = (membershipsResult.data ?? []) as unknown as Array<{
    conversation_id: string;
    last_read_sequence?: number;
    status?: string;
    conversations: {
      id: string;
      kind: 'direct' | 'group';
      category?: 'personal' | 'business' | 'marketplace' | 'creator' | 'event' | 'community' | 'support';
      title: string | null;
      last_message_at: string | null;
      last_sequence_number?: number;
    } | null;
  }>;

  const conversations = rows
    .map((row) => ({
      ...row.conversations,
      category: row.conversations?.category || 'personal',
      last_read_sequence: row.last_read_sequence || 0,
      member_status: row.status || 'active',
    }))
    .filter((c): c is NonNullable<typeof c> & { id: string } => c !== null && !!c.id);

  const conversationIds = conversations.map((c) => c.id);

  let membersByConversation = new Map<string, Array<{ profile_id: string; display_name: string; username?: string; avatar_url?: string | null }>>();
  let latestByConversation = new Map<string, { body: string; sender_id: string | null }>();

  if (conversationIds.length > 0) {
    const [membersResult, messagesResult] = await Promise.all([
      supabase
        .from('conversation_members')
        .select('conversation_id, profile_id, profiles(display_name, username, avatar_url)')
        .in('conversation_id', conversationIds),
      supabase
        .from('messages')
        .select('conversation_id, sender_id, body, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    membersByConversation = new Map();
    for (const member of (membersResult.data ?? []) as unknown as Array<{
      conversation_id: string;
      profile_id: string;
      profiles: { display_name: string; username?: string; avatar_url?: string | null } | null;
    }>) {
      const bucket = membersByConversation.get(member.conversation_id) ?? [];
      bucket.push({
        profile_id: member.profile_id,
        display_name: member.profiles?.display_name ?? 'Member',
        username: member.profiles?.username,
        avatar_url: member.profiles?.avatar_url,
      });
      membersByConversation.set(member.conversation_id, bucket);
    }

    for (const message of (messagesResult.data ?? []) as Array<{ conversation_id: string; sender_id: string | null; body: string | null }>) {
      if (!latestByConversation.has(message.conversation_id) && message.body) {
        latestByConversation.set(message.conversation_id, {
          body: message.body,
          sender_id: message.sender_id,
        });
      }
    }
  }

  // Determine active conversation ID
  const selectedId = targetConversationId
    || (params.c && (conversationIds.includes(params.c) || targetConversationId === params.c) ? params.c : null)
    || null;

  const summaries: ConversationSummary[] = conversations.map((conversation) => {
    const members = membersByConversation.get(conversation.id) ?? [];
    const others = members.filter((member) => member.profile_id !== user.id);
    const partner = others[0];
    const displayName =
      conversation.kind === 'group'
        ? conversation.title ?? 'Group conversation'
        : partner?.display_name ?? 'Conversation';

    const latestInfo = latestByConversation.get(conversation.id);
    let preview = 'No messages yet';
    if (latestInfo) {
      if (latestInfo.sender_id === user.id) {
        preview = `You: ${latestInfo.body}`;
      } else {
        preview = latestInfo.body;
      }
    }

    const latestSeq = conversation.last_sequence_number || 0;
    const readSeq = conversation.last_read_sequence || 0;
    let unreadCount = Math.max(0, latestSeq - readSeq);

    // Invariant: An actively selected conversation has 0 unread.
    // If the latest message was sent by the viewer, viewer has 0 unread from it.
    if (selectedId === conversation.id || latestInfo?.sender_id === user.id) {
      unreadCount = 0;
    }

    return {
      id: conversation.id,
      kind: (conversation.kind || 'direct') as 'direct' | 'group',
      category: conversation.category,
      title: conversation.title ?? null,
      last_message_at: conversation.last_message_at ?? null,
      displayName,
      partnerId: partner?.profile_id ?? null,
      partnerUsername: partner?.username ?? null,
      avatarUrl: partner?.avatar_url ?? null,
      preview,
      unreadCount,
      status: conversation.member_status as any,
    };
  });

  // If a direct chat was resolved via ?u= and is not yet in the loaded memberships, prepend it
  if (targetConversationId && !summaries.some((s) => s.id === targetConversationId)) {
    summaries.unshift({
      id: targetConversationId,
      kind: 'direct',
      category: 'personal',
      title: null,
      last_message_at: null,
      displayName: targetResolvedProfile?.displayName || 'Direct Conversation',
      partnerId: targetResolvedProfile?.id ?? null,
      partnerUsername: targetResolvedProfile?.username ?? null,
      avatarUrl: targetResolvedProfile?.avatarUrl || null,
      preview: 'Say wah gwaan to start the conversation!',
      unreadCount: 0,
      status: 'active',
    });
  }

  let threadMessages: ThreadMessage[] = [];
  if (selectedId) {
    const threadResult = await supabase
      .from('messages')
      .select('id, sender_id, body, created_at, edited_at, deleted_at, deleted_for, message_kind, client_message_id, sequence_number, reply_to_id, metadata, profiles:profiles!messages_sender_id_fkey(display_name)')
      .eq('conversation_id', selectedId)
      .order('created_at', { ascending: true })
      .limit(100);

    const visibleRows = (threadResult.data ?? []).filter((row: any) => {
      if (Array.isArray(row.deleted_for) && user?.id && row.deleted_for.includes(user.id)) {
        return false;
      }
      return true;
    });

    const msgIds = visibleRows.map((r: any) => r.id).filter(Boolean);
    const reactionsByMsg = new Map<string, { emoji: string; user_id: string }[]>();
    if (msgIds.length > 0) {
      const { data: reactionRows } = await supabase
        .from('message_reactions')
        .select('message_id, emoji, user_id')
        .in('message_id', msgIds);
      for (const rx of reactionRows ?? []) {
        const list = reactionsByMsg.get(rx.message_id) ?? [];
        list.push({ emoji: rx.emoji, user_id: rx.user_id });
        reactionsByMsg.set(rx.message_id, list);
      }
    }

    threadMessages = visibleRows.map((row: any) => ({
      ...row,
      audio_url: row.audio_url || row.metadata?.audio_url || undefined,
      reactions: reactionsByMsg.get(row.id) ?? [],
    })) as unknown as ThreadMessage[];

    // Mark as read in background
    try {
      void supabase.rpc('mark_conversation_read', { conv_id: selectedId });
    } catch {}
  }

  // Map real accepted friends
  const realFriends: NewMessageMember[] = (friendsResult.data ?? []).map((p: any) => ({
    id: p.id,
    name: p.display_name || p.username || 'Friend',
    username: p.username || p.id.slice(0, 8),
    avatarUrl: p.avatar_url,
    isVerified: !!p.is_verified,
    isOnline: false,
    bio: p.bio,
    isFriend: true,
  }));

  const pendingRequests = (requestsResult.data ?? []).map((r: any) => ({
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    senderName: r.sender?.display_name || r.sender?.username || 'Member',
    senderUsername: r.sender?.username || 'member',
    senderAvatar: r.sender?.avatar_url,
    createdAt: r.created_at,
  }));

  return (
    <div className="h-screen max-h-screen flex flex-col bg-[#0A0612] text-white overflow-hidden">
      {/* Header Bar */}
      <header className="h-14 flex-shrink-0 bg-[#0E0818]/95 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-300 hover:text-white text-xs md:text-sm font-bold px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-caribbeanSea" /> Messages Hub
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/friends"
            className="text-xs md:text-sm font-bold px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-caribbeanSea" />
            <span className="hidden sm:inline">Friends</span>
          </Link>
        </div>
      </header>

      {/* Main Container — Fluid desktop messaging workspace */}
      <main className="flex-1 min-h-0 overflow-hidden relative">
        <MessagesCenterClient
          conversations={summaries}
          selectedId={selectedId}
          threadMessages={threadMessages}
          currentUserId={user.id}
          friends={realFriends}
          onlineMembers={realFriends}
          pendingRequests={pendingRequests}
          initialCompose={params.compose === 'true'}
          conversationError={conversationError}
          initialPeerProfile={targetResolvedProfile}
        />
      </main>
    </div>
  );
}
