'use client';

import React, { useState, useTransition } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Search,
  Check,
  Sparkles,
  ShoppingBag,
  Store,
  Calendar,
  Radio,
  User,
  Users,
} from 'lucide-react';
import UserAvatar from '../user-avatar';
import { shareToChatAction } from '../../lib/messaging/actions';
import type { MessageKind, MessageMetadata } from '@caribbean/messaging';

export interface ShareTarget {
  id: string; // conversationId or profileId
  name: string;
  avatarUrl?: string | null;
  isDirectUser?: boolean;
  kind?: 'direct' | 'group';
}

interface ShareToChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageKind: MessageKind;
  title: string;
  subtitle?: string;
  metadata: MessageMetadata;
  recentConversations?: ShareTarget[];
}

export default function ShareToChatModal({
  isOpen,
  onClose,
  messageKind,
  title,
  subtitle,
  metadata,
  recentConversations = [],
}: ShareToChatModalProps) {
  const [search, setSearch] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<ShareTarget | null>(recentConversations[0] || null);
  const [note, setNote] = useState('');
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredTargets = recentConversations.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTarget) {
      setError('Please select a recipient.');
      return;
    }

    startTransition(async () => {
      setError(null);
      const res = await shareToChatAction({
        targetConversationId: selectedTarget.isDirectUser ? undefined : selectedTarget.id,
        targetUserId: selectedTarget.isDirectUser ? selectedTarget.id : undefined,
        messageKind,
        noteText: note,
        metadata,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      }
    });
  }

  function getIcon() {
    switch (messageKind) {
      case 'product':
        return <ShoppingBag className="w-4 h-4 text-brand-caribbeanSea" />;
      case 'store':
        return <Store className="w-4 h-4 text-brand-caribbeanSea" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-brand-goldenHour" />;
      case 'livestream':
        return <Radio className="w-4 h-4 text-rose-500" />;
      case 'community':
        return <Users className="w-4 h-4 text-brand-caribbeanSea" />;
      default:
        return <MessageSquare className="w-4 h-4 text-brand-caribbeanSea" />;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#120B1E] border border-white/15 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-sm font-black">Share to TUKUBI Chat</h3>
              <p className="text-[10px] text-slate-400">Send directly to your Caribbean friends or groups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Preview Strip */}
        <div className="p-3.5 bg-white/[0.02] border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            {getIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black text-white truncate">{title}</h4>
            {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
          </div>
        </div>

        {/* Target Selector */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {recentConversations.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipient…"
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
              />
            </div>
          )}

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filteredTargets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No conversations found.</p>
            ) : (
              filteredTargets.map((target) => {
                const isSelected = selectedTarget?.id === target.id;
                return (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => setSelectedTarget(target)}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? 'bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 text-white'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={target.name} avatarUrl={target.avatarUrl} size="sm" />
                      <span className="text-xs font-bold truncate">{target.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-brand-caribbeanSea" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Optional Message Note */}
          <div className="pt-2 border-t border-white/10">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a message note (optional)…"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none placeholder:text-slate-500"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#0E0818] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleShare}
            disabled={pending || !selectedTarget || success}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer"
          >
            {success ? (
              <>
                <Check className="w-3.5 h-3.5" /> Shared!
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Send to Chat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
