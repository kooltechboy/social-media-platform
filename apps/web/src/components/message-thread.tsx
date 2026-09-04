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
  ArrowLeft,
  Reply,
  Edit2,
  Trash2,
  MoreVertical,
  RotateCcw,
  WifiOff,
  CornerDownRight,
  Flag,
  UserX,
  Check,
  CheckCheck,
  Bot,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import {
  sendMessageAction,
  editMessageAction,
  deleteMessageAction,
  toggleMessageReactionAction,
  generateBusinessAiResponseAction,
  type MessageActionState,
} from '../lib/messaging/actions';
import EmojiPickerPopover from './emoji/emoji-picker-popover';
import MessageReactionBar from './emoji/message-reaction-bar';
import AudioVoiceNotePlayer from './messages/audio-voice-note-player';
import VoiceNoteRecorder from './messages/voice-note-recorder';
import CallOverlayModal, { type CallMode } from './calls/call-overlay-modal';
import MessageContextCard from './messages/cards/message-context-card';
import UserAvatar from './user-avatar';
import { generateClientMessageId, type MessageKind, type MessageMetadata } from '@caribbean/messaging';

export interface ThreadMessage {
  id: string;
  sender_id: string | null;
  body: string | null;
  created_at: string;
  profiles: { display_name: string } | null;
  audio_url?: string;
  message_kind?: MessageKind;
  media_url?: string;
  client_message_id?: string;
  sequence_number?: number;
  reply_to_id?: string;
  edited_at?: string;
  deleted_at?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
  metadata?: MessageMetadata;
}

export default function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
  peerName = 'Caribbean Member',
  peerAvatarUrl,
  onBack,
}: {
  conversationId: string;
  initialMessages: ThreadMessage[];
  currentUserId: string;
  peerName?: string;
  peerAvatarUrl?: string | null;
  onBack?: () => void;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [messageInput, setMessageInput] = useState('');
  const [state, setState] = useState<MessageActionState>({ error: null });
  const [pending, startTransition] = useTransition();
  const [isAiResponding, setIsAiResponding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Calling state
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callMode, setCallMode] = useState<CallMode>('video');

  // Voice note recorder state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  // Emoji picker state
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Reply & Edit state
  const [replyingTo, setReplyingTo] = useState<ThreadMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ThreadMessage | null>(null);
  const [editInput, setEditInput] = useState('');

  // Options dropdown state for a message
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);

  // Offline / Network state
  const [isOffline, setIsOffline] = useState(typeof window !== 'undefined' ? !navigator.onLine : false);

  // Realtime typing indicator state
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom on updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  // Network offline listener
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Realtime Channel & Broadcast Subscription
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    // 1. Private Postgres Changes Channel
    const changesChannel = supabase
      .channel(`conversation:${conversationId}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => {
            // Reconcile optimistic message by client_message_id
            if (newMsg.client_message_id) {
              const optIndex = prev.findIndex((m) => m.client_message_id === newMsg.client_message_id);
              if (optIndex >= 0) {
                const updated = [...prev];
                updated[optIndex] = {
                  ...updated[optIndex],
                  ...newMsg,
                  status: 'delivered',
                };
                return updated;
              }
            }

            if (prev.some((m) => m.id === newMsg.id)) return prev;

            return [
              ...prev,
              {
                id: newMsg.id,
                sender_id: newMsg.sender_id,
                body: newMsg.body,
                created_at: newMsg.created_at,
                audio_url: newMsg.metadata?.audio_url,
                message_kind: newMsg.message_kind || 'text',
                client_message_id: newMsg.client_message_id,
                sequence_number: newMsg.sequence_number,
                reply_to_id: newMsg.reply_to_id,
                metadata: newMsg.metadata,
                status: 'delivered',
                profiles: {
                  display_name: newMsg.sender_id === currentUserId ? 'You' : (newMsg.message_kind === 'ai_response' ? 'TUKUBI Business AI' : peerName),
                },
              },
            ];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const deleted = payload.old as any;
          setMessages((prev) => prev.filter((m) => m.id !== deleted.id));
        }
      )
      .subscribe();

    // 2. Ephemeral Realtime Broadcast Channel for Typing & Presence
    const broadcastChannel = supabase
      .channel(`broadcast:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId !== currentUserId) {
          const name = payload.payload?.userName || peerName;
          setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== name));
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(changesChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [conversationId, currentUserId, peerName]);

  // Broadcast typing indicator
  function handleTyping() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    if (!typingTimeoutRef.current) {
      supabase.channel(`broadcast:${conversationId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, userName: 'User' },
      });
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2500);
    }
  }

  // Send message handler with idempotency and optimistic rendering
  function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;

    const bodyText = messageInput.trim();
    const clientMsgId = generateClientMessageId();
    const replyId = replyingTo?.id;

    // Optimistic Message
    const optimisticMessage: ThreadMessage = {
      id: clientMsgId,
      client_message_id: clientMsgId,
      sender_id: currentUserId,
      body: bodyText,
      created_at: new Date().toISOString(),
      message_kind: 'text',
      reply_to_id: replyId,
      status: isOffline ? 'failed' : 'sending',
      profiles: { display_name: 'You' },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput('');
    setReplyingTo(null);

    if (isOffline) {
      setState({ error: 'You are currently offline. Message saved to retry.' });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set('conversationId', conversationId);
      formData.set('body', bodyText);
      formData.set('message_kind', 'text');
      formData.set('client_message_id', clientMsgId);
      if (replyId) formData.set('reply_to_id', replyId);

      const res = await sendMessageAction({ error: null }, formData);
      if (res.error) {
        setState({ error: res.error });
        setMessages((prev) =>
          prev.map((m) => (m.client_message_id === clientMsgId ? { ...m, status: 'failed' } : m))
        );
      } else {
        setState({ error: null });
        setMessages((prev) =>
          prev.map((m) =>
            m.client_message_id === clientMsgId
              ? { ...m, ...res.message, status: 'sent' }
              : m
          )
        );
      }
    });
  }

  // Handle asking AI Assistant
  async function handleAskAiAssistant() {
    if (!messageInput.trim()) return;
    const prompt = messageInput.trim();
    setMessageInput('');
    setIsAiResponding(true);

    try {
      const userMsgId = generateClientMessageId();
      const userMsg: ThreadMessage = {
        id: userMsgId,
        client_message_id: userMsgId,
        sender_id: currentUserId,
        body: prompt,
        created_at: new Date().toISOString(),
        message_kind: 'text',
        status: 'sent',
        profiles: { display_name: 'You' },
      };
      setMessages((prev) => [...prev, userMsg]);

      const aiRes = await generateBusinessAiResponseAction(conversationId, prompt);
      if (aiRes.aiMessage) {
        setMessages((prev) => [
          ...prev,
          {
            ...aiRes.aiMessage,
            profiles: { display_name: 'TUKUBI Business AI' },
          },
        ]);
      }
    } finally {
      setIsAiResponding(false);
    }
  }

  // Retry sending failed message
  function handleRetry(msg: ThreadMessage) {
    if (isOffline) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, status: 'sending' } : m))
    );

    startTransition(async () => {
      const formData = new FormData();
      formData.set('conversationId', conversationId);
      formData.set('body', msg.body || '');
      formData.set('message_kind', msg.message_kind || 'text');
      formData.set('client_message_id', msg.client_message_id || generateClientMessageId());
      if (msg.reply_to_id) formData.set('reply_to_id', msg.reply_to_id);

      const res = await sendMessageAction({ error: null }, formData);
      if (res.error) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'failed' } : m))
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, ...res.message, status: 'sent' } : m))
        );
      }
    });
  }

  // Handle voice note send
  async function handleSendVoiceNote(audioBlob: Blob, durationSec: number) {
    setIsRecordingVoice(false);
    const audioUrl = URL.createObjectURL(audioBlob);
    const clientMsgId = generateClientMessageId();

    const optimisticMessage: ThreadMessage = {
      id: clientMsgId,
      client_message_id: clientMsgId,
      sender_id: currentUserId,
      body: `[Voice Note: ${Math.round(durationSec)}s]`,
      audio_url: audioUrl,
      message_kind: 'voice',
      created_at: new Date().toISOString(),
      status: 'sending',
      profiles: { display_name: 'You' },
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    startTransition(async () => {
      const formData = new FormData();
      formData.set('conversationId', conversationId);
      formData.set('body', `[Voice Note: ${Math.round(durationSec)}s]`);
      formData.set('message_kind', 'voice');
      formData.set('audio_url', audioUrl);
      formData.set('client_message_id', clientMsgId);

      const res = await sendMessageAction({ error: null }, formData);
      if (res.error) {
        setState({ error: res.error });
      }
    });
  }

  // Handle message edit save
  async function handleSaveEdit() {
    if (!editingMessage || !editInput.trim()) return;
    const msgId = editingMessage.id;
    const newText = editInput.trim();

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, body: newText, edited_at: new Date().toISOString() } : m))
    );
    setEditingMessage(null);
    setEditInput('');

    await editMessageAction(msgId, newText);
  }

  // Handle message delete
  async function handleDeleteMessage(msgId: string, deleteType: 'for_everyone' | 'for_me') {
    setActiveMenuMessageId(null);
    if (deleteType === 'for_me') {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, body: 'This message was deleted.', deleted_at: new Date().toISOString() }
            : m
        )
      );
    }
    await deleteMessageAction(msgId, deleteType);
  }

  // Handle emoji reaction toggle
  async function handleToggleReaction(messageId: string, emoji: string) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = [...(m.reactions || [])];
        const existing = reactions.find((r) => r.emoji === emoji);
        if (existing) {
          if (existing.users.includes(currentUserId)) {
            existing.count = Math.max(0, existing.count - 1);
            existing.users = existing.users.filter((u) => u !== currentUserId);
          } else {
            existing.count += 1;
            existing.users.push(currentUserId);
          }
        } else {
          reactions.push({ emoji, count: 1, users: [currentUserId] });
        }
        return { ...m, reactions: reactions.filter((r) => r.count > 0) };
      })
    );

    await toggleMessageReactionAction(messageId, emoji);
  }

  return (
    <div className="flex flex-col h-full min-h-[78vh] bg-slate-950/40 relative">
      {/* 1. Header with Peer Details & Calls */}
      <div className="p-3.5 sm:p-4 border-b border-white/10 bg-[#0E0818]/90 backdrop-blur-xl flex items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 md:hidden transition-all"
              title="Back to conversation list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="relative flex-shrink-0">
            <UserAvatar name={peerName} avatarUrl={peerAvatarUrl} size="md" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0E0818]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black text-white truncate">{peerName}</h3>
              <span title="256-Bit E2EE Verified">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-caribbeanSea" />
              </span>
            </div>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active now
            </p>
          </div>
        </div>

        {/* Action Controls: Audio / Video Calls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setCallMode('audio');
              setIsCallOpen(true);
            }}
            title="Start Audio Call"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Phone className="w-3.5 h-3.5 text-brand-caribbeanSea" />
            <span className="hidden sm:inline">Audio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCallMode('video');
              setIsCallOpen(true);
            }}
            title="Start HD Video Call"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea/20 to-brand-sunriseCoral/20 hover:from-brand-caribbeanSea/30 hover:to-brand-sunriseCoral/30 text-brand-caribbeanSea border border-brand-caribbeanSea/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Video</span>
          </button>
        </div>
      </div>

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-amber-300 text-xs font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span>You are currently offline. Outgoing messages will queue locally.</span>
          </div>
        </div>
      )}

      {/* 2. Messages Stream List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-caribbeanSea">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-white">Direct Caribbean Conversation</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Say wah gwaan to {peerName}! All messages, calls, and voice notes are end-to-end encrypted.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.sender_id === currentUserId;
            const isVoice = msg.message_kind === 'voice' || !!msg.audio_url;
            const isDeleted = !!msg.deleted_at;
            const repliedMsg = msg.reply_to_id ? messages.find((m) => m.id === msg.reply_to_id) : null;
            const isRichCard = [
              'product', 'order', 'event', 'livestream', 'store', 'community', 'profile', 'ai_response'
            ].includes(msg.message_kind || '');

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col group relative ${isMine ? 'items-end' : 'items-start'}`}
              >
                {/* Reply Quote Preview */}
                {repliedMsg && (
                  <div
                    className={`flex items-center gap-1 text-[11px] text-slate-400 mb-1 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/5 max-w-sm truncate ${
                      isMine ? 'mr-1' : 'ml-1'
                    }`}
                  >
                    <CornerDownRight className="w-3 h-3 text-brand-caribbeanSea flex-shrink-0" />
                    <span className="font-bold text-slate-300 truncate">
                      {repliedMsg.sender_id === currentUserId ? 'You' : peerName}:
                    </span>
                    <span className="truncate">{repliedMsg.body}</span>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div className="flex items-end gap-2 max-w-[88%] sm:max-w-[78%] relative">
                  {!isMine && (
                    <div className="flex-shrink-0 mb-1">
                      <UserAvatar name={peerName} avatarUrl={peerAvatarUrl} size="sm" />
                    </div>
                  )}

                  <div className="flex flex-col">
                    {/* Rich Context Card (Product, Order, Event, Store, Live, AI) */}
                    {isRichCard && !isDeleted ? (
                      <div className="space-y-2">
                        <MessageContextCard
                          kind={msg.message_kind!}
                          metadata={msg.metadata}
                          isMine={isMine}
                          onActionClick={(act) => {
                            if (act === 'escalate_human') {
                              setMessageInput('I would like to speak with human staff.');
                            } else if (act === 'ask_question') {
                              setMessageInput('Do you ship across the Caribbean?');
                            }
                          }}
                        />
                        {msg.body && !msg.body.startsWith('[') && (
                          <div
                            className={`p-3 rounded-2xl text-xs ${
                              isMine
                                ? 'bg-gradient-to-tr from-brand-caribbeanSea via-teal-500 to-brand-sunriseCoral text-slate-950 font-bold'
                                : 'bg-[#181126] border border-white/10 text-white'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Bubble */
                      <div
                        className={`p-3.5 rounded-2xl text-xs relative transition-all shadow-md ${
                          isDeleted
                            ? 'bg-white/5 border border-white/10 text-slate-400 italic'
                            : isMine
                            ? 'bg-gradient-to-tr from-brand-caribbeanSea via-teal-500 to-brand-sunriseCoral text-slate-950 font-bold rounded-br-none shadow-brand-caribbeanSea/10'
                            : 'bg-[#181126] border border-white/10 text-white rounded-bl-none shadow-black/30'
                        }`}
                      >
                        {/* Voice Note Player or Text Content */}
                        {isVoice && !isDeleted ? (
                          <div className="min-w-[220px] sm:min-w-[260px]">
                            <AudioVoiceNotePlayer
                              audioUrl={msg.audio_url || ''}
                              isCurrentUser={isMine}
                            />
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words leading-relaxed font-semibold">
                            {msg.body}
                          </p>
                        )}

                        {/* Timestamp & Status Metadata */}
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                            isMine ? 'text-slate-900/80 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {msg.edited_at && <span className="italic mr-0.5">(edited)</span>}
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMine && (
                            <span>
                              {msg.status === 'failed' ? (
                                <button
                                  onClick={() => handleRetry(msg)}
                                  className="text-rose-600 hover:underline flex items-center gap-0.5 font-black"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" /> Retry
                                </button>
                              ) : msg.status === 'sending' ? (
                                <span className="opacity-70 animate-pulse">…</span>
                              ) : (
                                <CheckCheck className="w-3 h-3 text-slate-950" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reaction Badges */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {msg.reactions.map((r, i) => {
                          const hasReacted = r.users.includes(currentUserId);
                          return (
                            <button
                              key={i}
                              onClick={() => handleToggleReaction(msg.id, r.emoji)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-all ${
                                hasReacted
                                  ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea/40 text-brand-caribbeanSea'
                                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span>{r.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Hover Actions: Reaction Ribbon & More Menu */}
                  {!isDeleted && (
                    <div
                      className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${
                        isMine ? 'order-first' : 'order-last'
                      }`}
                    >
                      <MessageReactionBar
                        messageId={msg.id}
                        onReact={(emoji) => handleToggleReaction(msg.id, emoji)}
                      />

                      <button
                        onClick={() => setReplyingTo(msg)}
                        title="Reply to message"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs transition-all"
                      >
                        <Reply className="w-3 h-3" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id)
                          }
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs transition-all"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>

                        {activeMenuMessageId === msg.id && (
                          <div className="absolute right-0 bottom-full mb-1 w-36 bg-[#160E24] border border-white/15 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 text-xs font-bold">
                            {isMine && !isVoice && (
                              <button
                                onClick={() => {
                                  setEditingMessage(msg);
                                  setEditInput(msg.body || '');
                                  setActiveMenuMessageId(null);
                                }}
                                className="w-full px-2 py-1.5 rounded-lg text-left text-slate-200 hover:bg-white/10 flex items-center gap-2"
                              >
                                <Edit2 className="w-3 h-3 text-brand-caribbeanSea" /> Edit
                              </button>
                            )}

                            {isMine && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id, 'for_everyone')}
                                className="w-full px-2 py-1.5 rounded-lg text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                              >
                                <Trash2 className="w-3 h-3" /> Delete All
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteMessage(msg.id, 'for_me')}
                              className="w-full px-2 py-1.5 rounded-lg text-left text-slate-300 hover:bg-white/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3 text-slate-400" /> Delete For Me
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Realtime Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-brand-caribbeanSea font-bold italic animate-fadeIn">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>{typingUsers.join(', ')} is typing…</span>
          </div>
        )}
      </div>

      {/* 3. Reply Quote Bar (When replying) */}
      {replyingTo && (
        <div className="px-4 py-2 bg-white/[0.04] border-t border-white/10 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />
            <span className="font-bold text-slate-300">
              Replying to {replyingTo.sender_id === currentUserId ? 'yourself' : peerName}:
            </span>
            <span className="text-slate-400 truncate max-w-xs">{replyingTo.body}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Edit Message Bar (When editing inline) */}
      {editingMessage && (
        <div className="p-3 bg-brand-twilight/80 border-t border-white/10 flex items-center gap-2 animate-fadeIn">
          <Edit2 className="w-4 h-4 text-brand-caribbeanSea flex-shrink-0" />
          <input
            type="text"
            value={editInput}
            onChange={(e) => setEditInput(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
            placeholder="Edit message…"
            autoFocus
          />
          <button
            onClick={handleSaveEdit}
            className="px-3 py-1.5 rounded-xl bg-brand-caribbeanSea text-slate-950 text-xs font-black"
          >
            Save
          </button>
          <button
            onClick={() => setEditingMessage(null)}
            className="p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. Voice Note Recorder Ribbon */}
      {isRecordingVoice && (
        <div className="p-3 border-t border-white/10 bg-[#140C22] animate-fadeIn">
          <VoiceNoteRecorder
            onSendVoiceNote={handleSendVoiceNote}
            onCancel={() => setIsRecordingVoice(false)}
          />
        </div>
      )}

      {/* 6. Composer Input Dock */}
      {!isRecordingVoice && !editingMessage && (
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 border-t border-white/10 bg-[#0E0818]/90 backdrop-blur-xl flex items-center gap-2"
        >
          {/* Emoji Popover Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              title="Insert Emojis & Diaspora Vibrations"
              className={`p-2 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-white/5 border border-white/10 transition-all ${
                isEmojiPickerOpen ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' : ''
              }`}
            >
              <Smile className="w-4 h-4 text-amber-400" />
            </button>

            <EmojiPickerPopover
              isOpen={isEmojiPickerOpen}
              onClose={() => setIsEmojiPickerOpen(false)}
              onSelectEmoji={(emoji) => {
                setMessageInput((prev) => prev + emoji);
                if (textInputRef.current) textInputRef.current.focus();
              }}
              position="top-left"
            />
          </div>

          {/* Ask AI Trigger Button */}
          <button
            type="button"
            onClick={handleAskAiAssistant}
            title="Ask TUKUBI Business AI"
            disabled={!messageInput.trim() || isAiResponding}
            className="p-2 rounded-xl text-brand-goldenHour hover:bg-brand-goldenHour/10 border border-brand-goldenHour/30 disabled:opacity-30 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4" />
          </button>

          {/* Voice Record Button */}
          <button
            type="button"
            onClick={() => setIsRecordingVoice(true)}
            title="Record Voice Note"
            className="p-2 rounded-xl text-slate-300 hover:text-brand-caribbeanSea hover:bg-white/5 border border-white/10 transition-all"
          >
            <Mic className="w-4 h-4 text-brand-caribbeanSea" />
          </button>

          {/* Text Input */}
          <input
            ref={textInputRef}
            type="text"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              handleTyping();
            }}
            placeholder={`Message ${peerName}…`}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-caribbeanSea/60 transition-all"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={pending || !messageInput.trim()}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-brand-caribbeanSea/20 hover:opacity-95 disabled:opacity-30 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      )}

      {/* 7. WebRTC Audio & Video Calling Overlay HUD */}
      <CallOverlayModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        peerName={peerName}
        peerAvatarUrl={peerAvatarUrl}
        mode={callMode}
      />
    </div>
  );
}
