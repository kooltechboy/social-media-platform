'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { sendLiveMessageAction, type LiveActionState } from '../lib/live/actions';

interface ChatMessage {
  id: string;
  body: string;
  sender_id: string | null;
  display_name: string;
  created_at: string;
}

interface Props {
  livestreamId: string;
  initialMessages: ChatMessage[];
  isLive: boolean;
  isAuthenticated: boolean;
}

const INITIAL: LiveActionState = { error: null, success: null };

const profileCache = new Map<string, string>();

export default function LiveChatClient({ livestreamId, initialMessages, isLive, isAuthenticated }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [state, setState] = useState<LiveActionState>(INITIAL);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !isLive) return;

    const channel = supabase
      .channel(`live-chat-${livestreamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_messages',
          filter: `livestream_id=eq.${livestreamId}`,
        },
        async (payload) => {
          const row = payload.new as { id: string; body: string; sender_id: string | null; created_at: string };
          const senderId = row.sender_id ?? '';
          let displayName = profileCache.get(senderId);
          if (!displayName && senderId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', senderId)
              .maybeSingle();
            displayName = (profile as { display_name: string } | null)?.display_name ?? 'Viewer';
            if (senderId) profileCache.set(senderId, displayName);
          }
          setMessages((prev) => [
            ...prev,
            {
              id: String(row.id),
              body: row.body,
              sender_id: row.sender_id,
              display_name: displayName ?? 'Viewer',
              created_at: row.created_at,
            },
          ]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [livestreamId, isLive]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const body = input.trim();
    setInput('');
    const formData = new FormData();
    formData.set('livestreamId', livestreamId);
    formData.set('body', body);
    startTransition(() => {
      void sendLiveMessageAction(INITIAL, formData).then((result) => {
        setState(result);
      });
    });
  };

  return (
    <div className="col-span-1 bg-brand-dusk/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[480px]">
      <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2 border-b border-slate-800 pb-3">
        <MessageSquare className="w-4 h-4 text-brand-caribbeanSea" /> Live Chat
        {isLive && <span className="ml-auto text-[10px] text-brand-sunriseCoral font-semibold">LIVE</span>}
      </h3>

      <div className="flex-1 overflow-y-auto space-y-2 py-3 text-xs" aria-live="polite" aria-label="Live chat messages">
        {messages.length === 0 && (
          <p className="text-center text-slate-600 text-xs py-6">Chat is quiet. Be the first to say something.</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="p-2 rounded-xl bg-brand-twilight border border-slate-800">
            <span className="font-bold text-brand-caribbeanSea">{msg.display_name}:</span>{' '}
            <span className="text-slate-200">{msg.body}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {state.error && (
        <p role="alert" className="text-[11px] text-rose-400 py-1">{state.error}</p>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLive ? 'Send live message…' : 'Stream not live yet'}
            disabled={!isLive || pending}
            maxLength={500}
            aria-label="Chat message"
            className="w-full bg-brand-twilight border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isLive || pending || !input.trim()}
            aria-label="Send message"
            className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea disabled:opacity-50 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="pt-2 border-t border-slate-800">
          <Link
            href="/login"
            className="w-full block text-center text-xs text-brand-caribbeanSea hover:underline py-2"
          >
            Sign in to chat
          </Link>
        </div>
      )}
    </div>
  );
}
