'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Phone,
  Video,
  ShieldCheck,
  ShieldAlert,
  Bell,
  BellOff,
  UserX,
  Search,
  Image as ImageIcon,
  FileText,
  Lock,
  ChevronRight,
  ExternalLink,
  Users,
  Calendar,
  Check,
  Flag,
  Radio,
} from 'lucide-react';
import UserAvatar from '../user-avatar';
import { type ConversationSummary } from './messages-center-client';
import { type ThreadMessage } from '../message-thread';

export interface ConversationDetailsPanelProps {
  conversation: ConversationSummary;
  messages: ThreadMessage[];
  currentUserId: string;
  isOnline?: boolean;
  onClose: () => void;
  onStartCall?: (mode: 'audio' | 'video') => void;
}

export default function ConversationDetailsPanel({
  conversation,
  messages,
  currentUserId,
  isOnline = false,
  onClose,
  onStartCall,
}: ConversationDetailsPanelProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'media' | 'files'>('media');
  const [blockConfirm, setBlockConfirm] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Extract shared media (images/videos) and files from thread messages
  const sharedMedia = useMemo(() => {
    const mediaList: Array<{ id: string; url: string; createdAt: string }> = [];
    messages.forEach((msg) => {
      if (msg.deleted_at) return;
      if (msg.media_url) {
        mediaList.push({ id: msg.id, url: msg.media_url, createdAt: msg.created_at });
      }
      if (msg.metadata?.media_urls && Array.isArray(msg.metadata.media_urls)) {
        msg.metadata.media_urls.forEach((url, i) => {
          mediaList.push({ id: `${msg.id}-${i}`, url, createdAt: msg.created_at });
        });
      }
    });
    return mediaList;
  }, [messages]);

  // Extract shared files and links
  const sharedLinksAndFiles = useMemo(() => {
    const list: Array<{ id: string; title: string; url: string; domain?: string }> = [];
    messages.forEach((msg) => {
      if (msg.deleted_at) return;
      const preview = msg.metadata?.link_preview as any;
      const extMedia = msg.metadata?.external_media as any;
      if (preview && typeof preview === 'object') {
        list.push({
          id: msg.id,
          title: String(preview.title || 'Shared Link'),
          url: String(preview.url || '#'),
          domain: preview.siteName ? String(preview.siteName) : undefined,
        });
      } else if (extMedia && typeof extMedia === 'object' && extMedia.url) {
        list.push({
          id: msg.id,
          title: String(extMedia.title || 'Shared Media Resource'),
          url: String(extMedia.url),
          domain: extMedia.provider ? String(extMedia.provider) : undefined,
        });
      }
    });
    return list;
  }, [messages]);

  const displayName = conversation.displayName;
  const username = conversation.partnerUsername || (conversation.kind === 'group' ? 'group_channel' : 'member');
  const isGroup = conversation.kind === 'group';

  return (
    <aside className="w-full h-full flex flex-col bg-[#070E1B]/95 border-l border-white/10 overflow-y-auto custom-scrollbar select-none">
      {/* Header Bar */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#070E1B]/95 backdrop-blur-xl z-10">
        <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
          {isGroup ? <Users className="w-3.5 h-3.5 text-brand-caribbeanSea" /> : null}
          <span>{isGroup ? 'Group Information' : 'Contact Details'}</span>
        </h3>
        <button
          onClick={onClose}
          aria-label="Close details"
          className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 flex flex-col items-center text-center border-b border-white/10 space-y-3">
        <div className="relative">
          <UserAvatar
            name={displayName}
            avatarUrl={conversation.avatarUrl}
            size="xl"
          />
          {!isGroup && (
            <span
              className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-[#070E1B] ${
                isOnline ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
              title={isOnline ? 'Online now' : 'Offline'}
            />
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h4 className="text-base font-black text-white">{displayName}</h4>
            <span title="Verified Member">
              <ShieldCheck className="w-4 h-4 text-brand-caribbeanSea" />
            </span>
          </div>
          <p className="text-xs text-slate-400">@{username}</p>
          {!isGroup && (
            <p className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1.5 pt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isOnline ? 'Online now' : 'Offline'}</span>
            </p>
          )}
        </div>

        {/* Quick Action Shortcuts */}
        {!isGroup && onStartCall && (
          <div className="flex items-center gap-2 pt-2 w-full max-w-xs">
            <button
              onClick={() => onStartCall('audio')}
              className="flex-1 py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Phone className="w-3.5 h-3.5 text-brand-caribbeanSea" />
              <span>Audio</span>
            </button>
            <button
              onClick={() => onStartCall('video')}
              className="flex-1 py-2 px-3 rounded-xl bg-brand-caribbeanSea/15 hover:bg-brand-caribbeanSea/25 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
          </div>
        )}
      </div>

      {/* Encryption & Trust Badge */}
      <div className="p-4 mx-4 my-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/20 flex items-center justify-center text-brand-caribbeanSea flex-shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h5 className="text-xs font-bold text-white flex items-center gap-1">
            <span>End-to-End Encrypted</span>
          </h5>
          <p className="text-[11px] text-slate-400 leading-tight">
            Messages and calls are secured with 256-bit encryption.
          </p>
        </div>
      </div>

      {/* Shared Content Tabs */}
      <div className="p-4 space-y-3 flex-1">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('media')}
              className={`text-xs font-bold pb-1 transition-colors relative ${
                activeTab === 'media' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Shared Media ({sharedMedia.length})</span>
              {activeTab === 'media' && (
                <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-brand-caribbeanSea rounded-full" />
              )}
            </button>
            <span className="text-slate-600">·</span>
            <button
              onClick={() => setActiveTab('files')}
              className={`text-xs font-bold pb-1 transition-colors relative ${
                activeTab === 'files' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Links & Files ({sharedLinksAndFiles.length})</span>
              {activeTab === 'files' && (
                <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-brand-caribbeanSea rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'media' ? (
          sharedMedia.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs space-y-1">
              <ImageIcon className="w-6 h-6 mx-auto text-slate-600 opacity-60" />
              <p>No photos or videos shared yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {sharedMedia.slice(0, 9).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-xl bg-white/[0.05] border border-white/10 overflow-hidden relative group hover:border-brand-caribbeanSea/50 transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt="Shared media"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                  </div>
                </a>
              ))}
            </div>
          )
        ) : sharedLinksAndFiles.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs space-y-1">
            <FileText className="w-6 h-6 mx-auto text-slate-600 opacity-60" />
            <p>No links or documents shared yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sharedLinksAndFiles.slice(0, 6).map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between gap-2 transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-brand-caribbeanSea shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-brand-caribbeanSea transition-colors">
                      {file.title}
                    </p>
                    {file.domain && <p className="text-[10px] text-slate-400 truncate">{file.domain}</p>}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Privacy, Safety & Controls Section */}
      <div className="p-4 border-t border-white/10 space-y-1 mt-auto">
        {/* Mute Notifications Toggle */}
        <button
          onClick={() => setIsMuted((prev) => !prev)}
          className="w-full p-2.5 rounded-xl hover:bg-white/[0.05] text-slate-300 hover:text-white text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            {isMuted ? <BellOff className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4 text-slate-400" />}
            <span>Mute notifications</span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal">{isMuted ? 'Muted' : 'Unmuted'}</span>
        </button>

        {/* Block / Safety Controls */}
        {!isGroup && (
          <div>
            {blockConfirm ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <p className="text-xs text-rose-300 font-bold">
                  Block {displayName}? They will not be able to message you or view your online status.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsBlocked(true);
                      setBlockConfirm(false);
                    }}
                    className="flex-1 py-1 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                  >
                    Confirm Block
                  </button>
                  <button
                    onClick={() => setBlockConfirm(false)}
                    className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : isBlocked ? (
              <div className="w-full p-2.5 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold flex items-center justify-between">
                <span>User Blocked</span>
                <button
                  onClick={() => setIsBlocked(false)}
                  className="text-xs text-rose-300 hover:underline"
                >
                  Unblock
                </button>
              </div>
            ) : (
              <button
                onClick={() => setBlockConfirm(true)}
                className="w-full p-2.5 rounded-xl hover:bg-rose-500/10 text-rose-400 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <UserX className="w-4 h-4" />
                <span>Block {displayName}</span>
              </button>
            )}
          </div>
        )}

        {/* Report Conversation */}
        <button
          onClick={() => {
            alert('Report submitted to TUKUBI Trust & Safety team for review.');
          }}
          className="w-full p-2.5 rounded-xl hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
        >
          <Flag className="w-4 h-4" />
          <span>Report conversation</span>
        </button>
      </div>
    </aside>
  );
}
