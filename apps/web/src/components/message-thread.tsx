'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { sendMessageAction, type MessageActionState } from '../lib/messaging/actions';

export interface ThreadMessage {
  id: string;
  sender_id: string | null;
  body: string | null;
  created_at: string;
  profiles: { display_name: string } | null;
}

export default function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
}: {
  conversationId: string;
  initialMessages: ThreadMessage[];
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [state, setState] = useState<MessageActionState>({ error: null });
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const incoming = payload.new as ThreadMessage;
          setMessages((current) =>
            current.some((message) => message.id === incoming.id) ? current : [...current, incoming],
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(() => {
      void sendMessageAction(state, formData).then((next) => {
        setState(next);
        if (!next.error) form.reset();
      });
    });
  };

  return (
    <section className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col min-h-[70vh]">
      <div ref={scrollRef} className="flex-1 p-4 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-8">No messages yet — say hello.</p>
        )}
        {messages.map((message) => {
          const own = message.sender_id === currentUserId;
          return (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-2xl p-3 ${
                own ? 'ml-auto bg-sky-600/90 rounded-br-sm' : 'bg-slate-800/80 rounded-bl-sm'
              }`}
            >
              {!own && (
                <p className="text-[10px] font-bold text-sky-300 mb-0.5">
                  {message.profiles?.display_name ?? 'Member'}
                </p>
              )}
              <p className={`text-sm ${own ? 'text-white' : 'text-slate-200'}`}>{message.body}</p>
              <span className={`text-[10px] block mt-1 ${own ? 'text-sky-200 text-right' : 'text-slate-500'}`}>
                {new Date(message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>

      {state.error && (
        <p role="alert" className="mx-4 mb-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
          {state.error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 flex items-center gap-3">
        <input type="hidden" name="conversationId" value={conversationId} />
        <input
          name="body"
          type="text"
          required
          placeholder="Write a message…"
          className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={pending}
          className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-slate-950 flex items-center justify-center transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </section>
  );
}
