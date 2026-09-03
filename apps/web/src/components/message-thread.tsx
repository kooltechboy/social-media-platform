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
  Smile,
  X,
  Image as ImageIcon,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { sendMessageAction, type MessageActionState } from '../lib/messaging/actions';
import EmojiPickerPopover from './emoji/emoji-picker-popover';
import MessageReactionBar from './emoji/message-reaction-bar';
import AudioVoiceNotePlayer from './messages/audio-voice-note-player';
import VoiceNoteRecorder from './messages/voice-note-recorder';
import CallOverlayModal, { type CallMode } from './calls/call-overlay-modal';
import UserAvatar from './user-avatar';

export interface ThreadMessage {
  id: string;
  sender_id: string | null;
  body: string | null;
  created_at: string;
  profiles: { display_name: string } | null;
  audio_url?: string;
  message_kind?: 'text' | 'voice' | 'media' | 'system';
  media_url?: string;
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
}

export default function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
  peerName = 'Caribbean Member',
  peerAvatarUrl,
}: {
  conversationId: string;
  initialMessages: ThreadMessage[];
  currentUserId: string;
  peerName?: string;
  peerAvatarUrl?: string | null;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [messageInput, setMessageInput] = useState('');
  const [state, setState] = useState<MessageActionState>({ error: null });
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Calling state
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callMode, setCallMode] = useState<CallMode>('video');

  // Voice note recorder state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  // Emoji picker state
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // File attachments state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Local optimistic reactions mapping: messageId -> reactions
  const [messageReactions, setMessageReactions] = useState<
    Record<string, Array<{ emoji: string; count: number; users: string[] }>>
  >({});

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
            current.some((message) => message.id === incoming.id) ? current : [...current, incoming]
          );
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isRecordingVoice]);

  // Handle standard text submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!messageInput.trim() && selectedFiles.length === 0) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('conversationId', conversationId);
    formData.set('body', messageInput.trim());
    formData.set('message_kind', selectedFiles.length > 0 ? 'media' : 'text');

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ThreadMessage = {
      id: tempId,
      sender_id: currentUserId,
      body: messageInput.trim(),
      created_at: new Date().toISOString(),
      profiles: { display_name: 'You' },
      message_kind: selectedFiles.length > 0 ? 'media' : 'text',
      media_url: filePreviews[0] || undefined,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput('');
    setSelectedFiles([]);
    setFilePreviews([]);

    startTransition(() => {
      void sendMessageAction(state, formData).then((next) => {
        setState(next);
      });
    });
  };

  // Handle sending a recorded voice note
  const handleSendVoiceNote = async (audioBlob: Blob, durationSec: number, audioUrl: string) => {
    setIsRecordingVoice(false);

    const tempId = `temp-voice-${Date.now()}`;
    const optimisticVoiceMessage: ThreadMessage = {
      id: tempId,
      sender_id: currentUserId,
      body: `🎙️ Voice Note (${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')})`,
      created_at: new Date().toISOString(),
      profiles: { display_name: 'You' },
      audio_url: audioUrl,
      message_kind: 'voice',
    };

    setMessages((prev) => [...prev, optimisticVoiceMessage]);

    // Send payload to backend
    const formData = new FormData();
    formData.set('conversationId', conversationId);
    formData.set('body', `[VOICE_NOTE:${audioUrl}|${durationSec}]`);
    formData.set('message_kind', 'voice');
    formData.set('audio_url', audioUrl);

    startTransition(() => {
      void sendMessageAction(state, formData).then((next) => {
        setState(next);
      });
    });
  };

  // Handle emoji selection from picker
  function handleSelectEmoji(emoji: string) {
    setMessageInput((prev) => prev + emoji);
    textInputRef.current?.focus();
  }

  // Handle message emoji reaction
  function handleReactToMessage(messageId: string, emoji: string) {
    setMessageReactions((prev) => {
      const currentList = prev[messageId] || [];
      const existing = currentList.find((r) => r.emoji === emoji);

      let nextList;
      if (existing) {
        if (existing.users.includes(currentUserId)) {
          // Remove reaction
          nextList = currentList
            .map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, users: r.users.filter((u) => u !== currentUserId) }
                : r
            )
            .filter((r) => r.count > 0);
        } else {
          // Add user to reaction
          nextList = currentList.map((r) =>
            r.emoji === emoji
              ? { ...r, count: r.count + 1, users: [...r.users, currentUserId] }
              : r
          );
        }
      } else {
        // Create new reaction
        nextList = [...currentList, { emoji, count: 1, users: [currentUserId] }];
      }

      return { ...prev, [messageId]: nextList };
    });
  }

  // Handle file picker selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      const urls = files.map((f) => URL.createObjectURL(f));
      setFilePreviews(urls);
    }
  }

  function removeSelectedFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  function startCall(mode: CallMode) {
    setCallMode(mode);
    setIsCallOpen(true);
  }

  // Helper to extract voice URL from message body if encoded
  function extractVoiceInfo(message: ThreadMessage): { isVoice: boolean; url?: string; duration?: number } {
    if (message.message_kind === 'voice' || message.audio_url) {
      return { isVoice: true, url: message.audio_url || undefined };
    }
    if (message.body && message.body.startsWith('[VOICE_NOTE:')) {
      const match = message.body.match(/\[VOICE_NOTE:([^|\]]+)(?:\|(\d+))?\]/);
      if (match) {
        return {
          isVoice: true,
          url: match[1],
          duration: match[2] ? parseInt(match[2], 10) : undefined,
        };
      }
    }
    return { isVoice: false };
  }

  return (
    <section className="flex-1 bg-[#120B1E]/95 backdrop-blur-2xl flex flex-col min-h-[75vh] relative overflow-hidden">
      {/* Active Video & Audio Calling Overlay */}
      <CallOverlayModal
        isOpen={isCallOpen}
        peerName={peerName}
        peerAvatarUrl={peerAvatarUrl}
        mode={callMode}
        onClose={() => setIsCallOpen(false)}
      />

      {/* Conversation Active Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <UserAvatar name={peerName} src={peerAvatarUrl} size="md" />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#120B1E] shadow-sm" />
          </div>
          <div>
            <h3 className="font-black text-sm text-white flex items-center gap-1.5">
              {peerName}
              <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea" />
            </h3>
            <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Direct Encrypted Session
            </span>
          </div>
        </div>

        {/* VOICE & VIDEO CALL CONTROLS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startCall('audio')}
            className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-brand-sunriseCoral/20 text-slate-300 hover:text-brand-sunriseCoral border border-white/10 hover:border-brand-sunriseCoral/40 transition-all shadow-md flex items-center gap-1.5"
            title={`Start Audio Call with ${peerName}`}
          >
            <Phone className="w-4 h-4 text-brand-sunriseCoral" />
            <span className="text-[11px] font-bold hidden sm:inline">Call</span>
          </button>

          <button
            type="button"
            onClick={() => startCall('video')}
            className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-brand-caribbeanSea/20 text-slate-300 hover:text-brand-caribbeanSea border border-white/10 hover:border-brand-caribbeanSea/40 transition-all shadow-md flex items-center gap-1.5"
            title={`Start Video Call with ${peerName}`}
          >
            <Video className="w-4 h-4 text-brand-caribbeanSea" />
            <span className="text-[11px] font-bold hidden sm:inline">Video</span>
          </button>
        </div>
      </div>

      {/* Message History Feed */}
      <div ref={scrollRef} className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {messages.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea/20 to-brand-sunriseCoral/20 border border-brand-caribbeanSea/30 flex items-center justify-center text-brand-caribbeanSea mx-auto shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-xs text-white font-bold">Encrypted Pan-Caribbean Direct Message</p>
            <p className="text-[11px] text-slate-400">Say hello, send a voice note, or collaborate with {peerName}.</p>
          </div>
        )}

        {messages.map((message) => {
          const own = message.sender_id === currentUserId;
          const voiceInfo = extractVoiceInfo(message);
          const reactions = messageReactions[message.id] || message.reactions || [];

          return (
            <div
              key={message.id}
              className={`flex flex-col ${own ? 'items-end' : 'items-start'} group/msg relative`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-3.5 shadow-md relative transition-all ${
                  own
                    ? 'bg-gradient-to-r from-sky-600 via-brand-caribbeanSea to-emerald-600 text-white rounded-br-none font-medium'
                    : 'bg-[#201530] text-slate-100 border border-white/15 rounded-bl-none'
                }`}
              >
                {!own && (
                  <p className="text-[10px] font-black text-brand-caribbeanSea mb-1">
                    {message.profiles?.display_name ?? peerName}
                  </p>
                )}

                {/* Voice Note Rendering */}
                {voiceInfo.isVoice && voiceInfo.url ? (
                  <AudioVoiceNotePlayer
                    audioUrl={voiceInfo.url}
                    durationSeconds={voiceInfo.duration}
                    senderName={own ? 'You' : peerName}
                    isOwn={own}
                  />
                ) : (
                  /* Standard Text or Media Message */
                  <>
                    {message.media_url && (
                      <div className="mb-2 rounded-2xl overflow-hidden max-h-60 bg-black/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={message.media_url} alt="Shared media" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">
                      {message.body}
                    </p>
                  </>
                )}

                {/* Timestamp */}
                <span className={`text-[9px] block mt-1.5 font-mono ${own ? 'text-sky-100 text-right' : 'text-slate-400'}`}>
                  {new Date(message.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Message Reactions Bar */}
              <div className="mt-1">
                <MessageReactionBar
                  onReact={(emoji) => handleReactToMessage(message.id, emoji)}
                  reactions={reactions}
                  currentUserId={currentUserId}
                  isOwnMessage={own}
                />
              </div>
            </div>
          );
        })}
      </div>

      {state.error && (
        <p role="alert" className="mx-5 mb-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
          {state.error}
        </p>
      )}

      {/* Attachment Previews Ribbon */}
      {filePreviews.length > 0 && (
        <div className="mx-4 p-2 bg-[#1B112B] border border-white/10 rounded-2xl flex items-center gap-2 overflow-x-auto">
          {filePreviews.map((url, i) => (
            <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/20 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Attachment preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeSelectedFile(i)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-rose-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Voice Note Live Recording Ribbon */}
      {isRecordingVoice && (
        <div className="mx-4 mb-2">
          <VoiceNoteRecorder
            onSendVoiceNote={handleSendVoiceNote}
            onCancel={() => setIsRecordingVoice(false)}
          />
        </div>
      )}

      {/* Message Input Toolbar */}
      {!isRecordingVoice && (
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-white/10 bg-[#1A1128] flex items-center gap-2 relative">
          <input type="hidden" name="conversationId" value={conversationId} />

          {/* Voice Note Trigger */}
          <button
            type="button"
            onClick={() => setIsRecordingVoice(true)}
            className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            title="Record Voice Note"
          >
            <Mic className="w-4 h-4 text-rose-400" />
          </button>

          {/* Attachment Picker Trigger */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 rounded-full transition-all relative flex-shrink-0 ${
              selectedFiles.length > 0
                ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Attach Image or Media"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Emoji Picker Popover Trigger */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className={`p-2.5 rounded-full transition-all ${
                isEmojiPickerOpen
                  ? 'bg-amber-400/20 text-amber-300'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-white/10'
              }`}
              title="Insert Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>

            <EmojiPickerPopover
              isOpen={isEmojiPickerOpen}
              onClose={() => setIsEmojiPickerOpen(false)}
              onSelectEmoji={handleSelectEmoji}
              position="top-left"
            />
          </div>

          {/* Main Message Text Input */}
          <input
            ref={textInputRef}
            name="body"
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={`Message ${peerName}...`}
            className="flex-1 bg-[#130B1E] border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-caribbeanSea transition-colors font-medium min-w-0"
          />

          {/* Send Button */}
          <button
            type="submit"
            aria-label="Send message"
            disabled={pending || (!messageInput.trim() && selectedFiles.length === 0)}
            className="w-10 h-10 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:from-cyan-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 flex items-center justify-center shadow-md transition-all flex-shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </section>
  );
}
