import React from 'react';
import { MessageSquare, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import MessageThread, { type ThreadMessage } from '../../components/message-thread';

export const dynamic = 'force-dynamic';

interface ConversationSummary {
  id: string;
  kind: 'direct' | 'group';
  title: string | null;
  last_message_at: string | null;
  displayName: string;
  preview: string;
}

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ c?: string; u?: string }> }) {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  if (!user || !supabase) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6">
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-8 text-center max-w-sm">
          <MessageSquare className="w-8 h-8 text-brand-caribbeanSea mx-auto mb-3" />
          <h1 className="text-lg font-bold text-brand-sandstone mb-2">Messages</h1>
          <p className="text-sm text-brand-sandstone/60 mb-4">Sign in to chat with your communities, friends and the diaspora.</p>
          <Link href="/login?next=/messages" className="inline-block bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 font-bold px-5 py-2 rounded-full text-xs transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  let targetConversationId: string | null = null;
  if (params.u) {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .ilike('username', params.u)
      .maybeSingle();

    if (targetProfile && targetProfile.id !== user.id) {
      const { data: sharedConversations } = await supabase
        .from('conversation_members')
        .select('conversation_id, conversations(id, kind)')
        .eq('profile_id', user.id);

      const candidateIds = (sharedConversations ?? [])
        .map((r: any) => r.conversations)
        .filter((c: any) => c && c.kind === 'direct')
        .map((c: any) => c.id);

      if (candidateIds.length > 0) {
        const { data: partnerMatch } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('profile_id', targetProfile.id)
          .in('conversation_id', candidateIds)
          .maybeSingle();

        if (partnerMatch) {
          targetConversationId = partnerMatch.conversation_id;
        }
      }

      if (!targetConversationId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ kind: 'direct', created_by: user.id })
          .select('id')
          .single();

        if (newConv) {
          await supabase.from('conversation_members').insert([
            { conversation_id: newConv.id, profile_id: user.id, role: 'member' },
            { conversation_id: newConv.id, profile_id: targetProfile.id, role: 'member' },
          ]);
          targetConversationId = newConv.id;
        }
      }
    }
  }

  const membershipsResult = await supabase
    .from('conversation_members')
    .select('conversation_id, conversations(id, kind, title, last_message_at)')
    .eq('profile_id', user.id)
    .is('left_at', null)
    .order('last_message_at', { ascending: false, foreignTable: 'conversations' });

  const rows = (membershipsResult.data ?? []) as unknown as Array<{
    conversation_id: string;
    conversations: { id: string; kind: 'direct' | 'group'; title: string | null; last_message_at: string | null } | null;
  }>;
  const conversations = rows
    .map((row) => row.conversations)
    .filter((conversation): conversation is NonNullable<typeof conversation> => conversation !== null);
  const conversationIds = conversations.map((conversation) => conversation.id);

  let membersByConversation = new Map<string, Array<{ profile_id: string; display_name: string }>>();
  let latestByConversation = new Map<string, string>();

  if (conversationIds.length > 0) {
    const [membersResult, messagesResult] = await Promise.all([
      supabase
        .from('conversation_members')
        .select('conversation_id, profile_id, profiles(display_name)')
        .in('conversation_id', conversationIds),
      supabase
        .from('messages')
        .select('conversation_id, body, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    membersByConversation = new Map();
    for (const member of (membersResult.data ?? []) as unknown as Array<{
      conversation_id: string;
      profile_id: string;
      profiles: { display_name: string } | null;
    }>) {
      const bucket = membersByConversation.get(member.conversation_id) ?? [];
      bucket.push({ profile_id: member.profile_id, display_name: member.profiles?.display_name ?? 'Member' });
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
    return {
      id: conversation.id,
      kind: conversation.kind,
      title: conversation.title,
      last_message_at: conversation.last_message_at,
      displayName,
      preview: latestByConversation.get(conversation.id) ?? 'No messages yet',
    };
  });

  const selectedId = targetConversationId || (params.c && conversationIds.includes(params.c) ? params.c : conversationIds[0] ?? null);

  let threadMessages: ThreadMessage[] = [];
  if (selectedId) {
    const threadResult = await supabase
      .from('messages')
      .select('id, sender_id, body, created_at, profiles(display_name)')
      .eq('conversation_id', selectedId)
      .order('created_at', { ascending: true })
      .limit(100);
    threadMessages = (threadResult.data ?? []) as unknown as ThreadMessage[];
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone">
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-brand-sandstone text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-lg font-extrabold text-brand-sandstone flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-caribbeanSea" /> Messages
        </h1>
      </header>

      <div className="max-w-5xl mx-auto p-4 grid md:grid-cols-3 gap-4">
        <aside className="md:col-span-1 space-y-2">
          {summaries.length === 0 && (
            <div className="bg-brand-dusk/40 border border-dashed border-slate-800 rounded-2xl p-6 text-center">
              <p className="text-xs text-brand-sandstone/40">No conversations yet. New members receive a welcome message from Tukubi.</p>
            </div>
          )}
          {summaries.map((summary) => (
            <Link
              key={summary.id}
              href={`/messages?c=${summary.id}`}
              className={`block w-full text-left bg-brand-dusk/70 border rounded-2xl p-4 hover:border-brand-caribbeanSea/40 transition-colors ${
                summary.id === selectedId ? 'border-sky-600/60' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
                  {summary.kind === 'group' && <Users className="w-3.5 h-3.5 text-brand-sandstone/60" />}
                  {summary.displayName}
                </span>
              </div>
              <p className="text-xs text-brand-sandstone/60 mt-1 truncate">{summary.preview}</p>
            </Link>
          ))}
        </aside>

        {selectedId ? (
          <MessageThread
            conversationId={selectedId}
            initialMessages={threadMessages}
            currentUserId={user.id}
            peerName={summaries.find((s) => s.id === selectedId)?.displayName || 'Caribbean Member'}
          />
        ) : (
          <section className="md:col-span-2 bg-brand-dusk/60 border border-slate-800 rounded-2xl flex items-center justify-center min-h-[70vh]">
            <p className="text-sm text-brand-sandstone/40">Select a conversation to start chatting.</p>
          </section>
        )}
      </div>
    </div>
  );
}
