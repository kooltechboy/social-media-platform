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
  searchParams: Promise<{ c?: string; u?: string; compose?: string; tab?: string }>;
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
  let conversationError: string | null = null;

  // Canonical Direct Conversation Routing
  if (params.u) {
    const cleanUsername = params.u.replace('@', '').trim();
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (targetProfile && targetProfile.id !== user.id) {
      // Supabase JS v2 returns { data, error } — it does NOT throw on RPC errors.
      // We must explicitly check error to surface Postgres-level exceptions (blocks, auth, race conditions).
      const { data: convId, error: rpcError } = await supabase.rpc('get_or_create_direct_conversation', {
        target_user_id: targetProfile.id,
      });
      if (rpcError) {
        console.error('[MessagesPage] Direct conversation creation failed:', rpcError.message, rpcError.details);
        conversationError = rpcError.message?.includes('block')
          ? 'This user is not available for messaging.'
          : 'Could not start conversation. Please try again.';
      } else if (convId) {
        targetConversationId = convId;
      }
    } else if (!targetProfile) {
      conversationError = 'User not found.';
    }
  }

  // Load User's Active Memberships & Conversations
  const [membershipsResult, onlineMembersResult, requestsResult] = await Promise.all([
    supabase
      .from('conversation_members')
      .select('conversation_id, last_read_sequence, status, conversations(id, kind, category, title, last_message_at, last_sequence_number)')
      .eq('profile_id', user.id)
      .is('left_at', null)
      .order('last_message_at', { ascending: false, foreignTable: 'conversations' }),
    supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, is_verified, bio')
      .eq('is_private', false)
      .neq('id', user.id)
      .order('updated_at', { ascending: false })
      .limit(16),
    supabase
      .from('message_requests')
      .select('id, conversation_id, sender_id, status, created_at, sender:profiles!message_requests_sender_id_fkey(display_name, username, avatar_url)')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ]);

  const rows = (membershipsResult.data ?? []) as unknown as Array<{
    conversation_id: string;
    last_read_sequence: number;
    status: string;
    conversations: {
      id: string;
      kind: 'direct' | 'group';
      category?: 'personal' | 'business' | 'marketplace' | 'creator' | 'event' | 'community' | 'support';
      title: string | null;
      last_message_at: string | null;
      last_sequence_number: number;
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
  let latestByConversation = new Map<string, string>();

  if (conversationIds.length > 0) {
    const [membersResult, messagesResult] = await Promise.all([
      supabase
        .from('conversation_members')
        .select('conversation_id, profile_id, profiles(display_name, username, avatar_url)')
        .in('conversation_id', conversationIds),
      supabase
        .from('messages')
        .select('conversation_id, body, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(150),
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

    for (const message of (messagesResult.data ?? []) as Array<{ conversation_id: string; body: string | null }>) {
      if (!latestByConversation.has(message.conversation_id) && message.body) {
        latestByConversation.set(message.conversation_id, message.body);
      }
    }
  }

  const summaries: ConversationSummary[] = conversations.map((conversation) => {
    const members = membersByConversation.get(conversation.id) ?? [];
    const others = members.filter((member) => member.profile_id !== user.id);
    const displayName =
      conversation.kind === 'group'
        ? conversation.title ?? 'Group conversation'
        : others[0]?.display_name ?? 'Conversation';

    const latestSeq = conversation.last_sequence_number || 0;
    const readSeq = conversation.last_read_sequence || 0;
    const unreadCount = Math.max(0, latestSeq - readSeq);

    return {
      id: conversation.id,
      kind: (conversation.kind || 'direct') as 'direct' | 'group',
      category: conversation.category,
      title: conversation.title ?? null,
      last_message_at: conversation.last_message_at ?? null,
      displayName,
      avatarUrl: others[0]?.avatar_url ?? null,
      preview: latestByConversation.get(conversation.id) ?? 'No messages yet',
      unreadCount,
      status: conversation.member_status as any,
    };
  });

  // Resolve which conversation to display:
  // Priority: targetConversationId (from ?u=) > ?c= param > first conversation
  const selectedId = targetConversationId
    || (params.c && conversationIds.includes(params.c) ? params.c : null)
    || summaries[0]?.id
    || null;

  let threadMessages: ThreadMessage[] = [];
  if (selectedId) {
    const threadResult = await supabase
      .from('messages')
      .select('id, sender_id, body, created_at, message_kind, client_message_id, sequence_number, reply_to_id, metadata, profiles:profiles!messages_sender_id_fkey(display_name)')
      .eq('conversation_id', selectedId)
      .order('created_at', { ascending: true })
      .limit(100);

    threadMessages = (threadResult.data ?? []) as unknown as ThreadMessage[];

    // Mark as read in background
    void supabase.rpc('mark_conversation_read', { conv_id: selectedId });
  }

  const onlineMembers: NewMessageMember[] = (onlineMembersResult.data ?? []).map((p) => ({
    id: p.id,
    name: p.display_name || p.username || 'Caribbean Member',
    username: p.username || p.id.slice(0, 8),
    avatarUrl: p.avatar_url,
    isVerified: !!p.is_verified,
    isOnline: true,
    bio: p.bio,
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
    <div className="min-h-screen bg-transparent text-white pb-12">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0E0818]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
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
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-brand-caribbeanSea" />
            <span className="hidden sm:inline">Friends</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-3 sm:p-6">
        <MessagesCenterClient
          conversations={summaries}
          selectedId={selectedId}
          threadMessages={threadMessages}
          currentUserId={user.id}
          onlineMembers={onlineMembers}
          pendingRequests={pendingRequests}
          initialCompose={params.compose === 'true'}
          conversationError={conversationError}
        />
      </main>
    </div>
  );
}
