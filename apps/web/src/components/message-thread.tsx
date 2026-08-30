'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import {
  Send,
  Phone,
  Video,
  Mic,
  CheckCircle,
  Sparkles,
  Paperclip,
  X,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { sendMessageAction, type MessageActionState } from '../lib/messaging/actions';

export interface ThreadMessage {
  id: string;
  sender_id: string | null;
  body: string | null;
  created_at: string;
  profiles: { display_name: string } | null;
  audio_url?: string;
}

export default function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
  peerName = 'Caribbean Member',
}: {
  conversationId: string;
  initialMessages: ThreadMessage[];
  currentUserId: string;
  peerName?: string;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [state, setState] = useState<MessageActionState>({ error: null });
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Honest "coming soon" toast state for unimplemented features
  const [comingSoonToast, setComingSoonToast] = useState<string | null>(null);

  // Audio voice note & attachment state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


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


  // Audio recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecordingAudio) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingAudio]);

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

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function handleSendVoiceNote() {
    setIsRecordingAudio(false);
    // Voice notes require MediaRecorder + storage integration — coming soon
    // Show a temporary user-facing notice instead of injecting a fake message
    setComingSoonToast('Voice notes are coming soon to Tukubi! 🎙️');
    setTimeout(() => setComingSoonToast(null), 4000);
  }

  return (
    <section className="md:col-span-2 bg-brand-dusk/80 backdrop-blur-xl border border-brand-caribbeanSea/20 rounded-3xl flex flex-col min-h-[75vh] shadow-2xl relative overflow-hidden">
      {/* Conversation Active Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-brand-twilight/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
            {peerName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-black text-sm text-brand-sandstone flex items-center gap-1.5">
              {peerName}
              <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea" />
            </h3>
            <span className="text-[10px] text-brand-sunriseCoral font-extrabold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-sunriseCoral animate-pulse" /> Active on Tukubi
            </span>
          </div>
        </div>

        {/* VOICE & VIDEO CALL CONTROLS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setComingSoonToast('Voice & video calls are coming soon to Tukubi! 📞');
              setTimeout(() => setComingSoonToast(null), 4000);
            }}
            className="p-2.5 rounded-2xl bg-brand-dusk/80 hover:bg-brand-sunriseCoral/20 text-slate-300 hover:text-brand-sunriseCoral border border-slate-700 hover:border-brand-sunriseCoral/40 transition-all shadow-md"
            title="Voice calls coming soon"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setComingSoonToast('Voice & video calls are coming soon to Tukubi! 📞');
              setTimeout(() => setComingSoonToast(null), 4000);
            }}
            className="p-2.5 rounded-2xl bg-brand-dusk/80 hover:bg-brand-caribbeanSea/20 text-slate-300 hover:text-brand-caribbeanSea border border-slate-700 hover:border-brand-caribbeanSea/40 transition-all shadow-md"
            title="Video calls coming soon"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message History Feed */}
      <div ref={scrollRef} className="flex-1 p-5 space-y-3.5 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <Sparkles className="w-8 h-8 text-brand-caribbeanSea mx-auto" />
            <p className="text-xs text-brand-sandstone/60 font-bold">Encrypted Caribbean Direct Message</p>
            <p className="text-[11px] text-brand-sandstone/40">Say hello or initiate a voice/video call with {peerName}.</p>
          </div>
        )}
        {messages.map((message) => {
          const own = message.sender_id === currentUserId;
          return (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-2xl p-3.5 shadow-md ${
                own
                  ? 'ml-auto bg-gradient-to-r from-sky-600 via-brand-caribbeanSea to-emerald-600 text-brand-sandstone rounded-br-none'
                  : 'bg-brand-dusk/90 text-brand-sandstone border border-slate-700/80 rounded-bl-none'
              }`}
            >
              {!own && (
                <p className="text-[10px] font-black text-brand-caribbeanSea mb-1">
                  {message.profiles?.display_name ?? peerName}
                </p>
              )}
              <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">{message.body}</p>
              <span className={`text-[9px] block mt-1.5 ${own ? 'text-sky-100 text-right' : 'text-brand-sandstone/60'}`}>
                {new Date(message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>

      {state.error && (
        <p role="alert" className="mx-5 mb-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
          {state.error}
        </p>
      )}

      {comingSoonToast && (
        <div role="status" className="mx-5 mb-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
          <span>🚀</span>
          <span>{comingSoonToast}</span>
        </div>
      )}

      {/* Audio Voice Note Recording Ribbon */}
      {isRecordingAudio && (
        <div className="mx-4 p-3 bg-rose-950/80 border border-rose-500/40 rounded-2xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-black text-rose-300">Recording Voice Note... ({formatTime(recordingSeconds)})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRecordingAudio(false)}
              className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendVoiceNote}
              className="bg-rose-500 hover:bg-rose-400 text-brand-sandstone font-black px-3 py-1 rounded-xl text-xs"
            >
              Send Voice Note
            </button>
          </div>
        </div>
      )}

      {/* Message Input Toolbar */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800/80 bg-brand-twilight/60 flex items-center gap-2">
        <input type="hidden" name="conversationId" value={conversationId} />

        <button
          type="button"
          onClick={() => setIsRecordingAudio(!isRecordingAudio)}
          className={`p-2.5 rounded-full transition-all ${
            isRecordingAudio ? 'bg-rose-500 text-brand-sandstone animate-pulse' : 'text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-brand-dusk'
          }`}
          title="Record Audio Voice Note"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => setSelectedFileCount(e.target.files?.length || 0)}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 rounded-full transition-all relative ${
            selectedFileCount > 0
              ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea'
              : 'text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-brand-dusk'
          }`}
          title={selectedFileCount > 0 ? `${selectedFileCount} file(s) selected` : 'Attach Media or File'}
        >
          <Paperclip className="w-4 h-4" />
          {selectedFileCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-caribbeanSea text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
              {selectedFileCount}
            </span>
          )}
        </button>

        <input
          name="body"
          type="text"
          required={!isRecordingAudio}
          placeholder={`Message ${peerName}...`}
          className="flex-1 bg-brand-dusk border border-slate-800/90 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-colors"
        />

        <button
          type="submit"
          aria-label="Send message"
          disabled={pending}
          className="w-10 h-10 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:from-brand-caribbeanSea hover:to-emerald-300 disabled:opacity-60 text-slate-950 flex items-center justify-center shadow-md transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </section>
  );
}
