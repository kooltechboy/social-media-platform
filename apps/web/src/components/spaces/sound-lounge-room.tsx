'use client';

import React, { useState } from 'react';
import type { SoundLoungeRole, CulturalGenre } from '@caribbean/live';

export interface SoundLoungeRoomProps {
  loungeId: string;
  title: string;
  culturalGenre: CulturalGenre;
  hostName: string;
  initialListenerCount?: number;
  userRole?: SoundLoungeRole;
  onLeave?: () => void;
}

export function SoundLoungeRoom({
  loungeId,
  title,
  culturalGenre,
  hostName,
  initialListenerCount = 142,
  userRole = 'listener',
  onLeave,
}: SoundLoungeRoomProps) {
  const [role, setRole] = useState<SoundLoungeRole>(userRole);
  const [isMuted, setIsMuted] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [listenerCount, setListenerCount] = useState(initialListenerCount);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('speaker_host');

  const speakers = [
    { id: 'speaker_host', name: hostName, role: 'Host', isSpeaking: activeSpeakerId === 'speaker_host' },
    { id: 'speaker_2', name: 'DJ Soca King', role: 'Co-Host', isSpeaking: false },
    { id: 'speaker_3', name: 'Althea Vibes', role: 'Speaker', isSpeaking: false },
  ];

  const listeners = [
    { id: 'list_1', name: 'Kevon J.' },
    { id: 'list_2', name: 'Maria S.' },
    { id: 'list_3', name: 'Darnell B.' },
    { id: 'list_4', name: 'Nadia P.' },
    { id: 'list_5', name: 'Rohan M.' },
    { id: 'list_6', name: 'Tanya W.' },
  ];

  const toggleMic = () => {
    if (role === 'listener') return;
    setIsMuted((prev) => !prev);
  };

  const toggleHandRaise = () => {
    if (role !== 'listener') return;
    setHandRaised((prev) => !prev);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-gradient-to-b from-[#0D1628] to-[#070D1A] border border-[#15213A] shadow-2xl overflow-hidden">
      {/* Lounge Header */}
      <div className="border-b border-[#15213A] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 font-mono">
              Live Sound Lounge
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F2775A]/20 text-[#F2775A] border border-[#F2775A]/30 capitalize">
              {culturalGenre}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{title}</h2>
          <p className="text-xs text-[#E8EDF5]/60 mt-0.5">Hosted by <span className="text-[#0EA5E9] font-semibold">{hostName}</span></p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#15213A] text-xs font-mono text-[#E8EDF5]/80 flex items-center gap-2">
            <span>👥</span>
            <span>{listenerCount} in room</span>
          </div>
          {onLeave && (
            <button
              onClick={onLeave}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
            >
              Leave Quietly
            </button>
          )}
        </div>
      </div>

      {/* Stage Area: Speakers & Hosts */}
      <div className="p-6 border-b border-[#15213A]/60">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8EDF5]/50 mb-4">The Stage</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {speakers.map((s) => (
            <div
              key={s.id}
              className={`p-4 rounded-xl flex flex-col items-center text-center transition-all ${
                s.isSpeaking
                  ? 'bg-gradient-to-b from-[#F2775A]/20 to-[#15213A] ring-2 ring-[#F2775A] shadow-lg shadow-[#F2775A]/20'
                  : 'bg-[#0D1628]/60 border border-[#15213A]'
              }`}
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#F2775A] via-[#F4AE45] to-[#8B5CF6] flex items-center justify-center font-bold text-lg text-white shadow-md">
                  {s.name[0]}
                </div>
                {s.isSpeaking && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 items-center justify-center text-[9px]">
                      🎙️
                    </span>
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-semibold text-white truncate max-w-full">{s.name}</p>
              <span className="text-[10px] text-[#0EA5E9] font-mono">{s.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Audience Area: Listeners */}
      <div className="p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8EDF5]/50 mb-4">
          Audience & Diaspora ({listenerCount - speakers.length} listening)
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {listeners.map((l) => (
            <div key={l.id} className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-[#15213A]/40 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#15213A] flex items-center justify-center font-medium text-xs text-[#E8EDF5]/80 border border-[#15213A]">
                {l.name[0]}
              </div>
              <p className="mt-1 text-xs text-[#E8EDF5]/70 truncate max-w-full">{l.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lounge Controls Bar */}
      <div className="bg-[#0D1628] border-t border-[#15213A] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {role !== 'listener' ? (
            <button
              onClick={toggleMic}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ring-1 ring-emerald-500/50'
              }`}
            >
              <span>{isMuted ? '🔇' : '🎙️'}</span>
              <span>{isMuted ? 'Muted' : 'Speaking'}</span>
            </button>
          ) : (
            <button
              onClick={toggleHandRaise}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                handRaised
                  ? 'bg-[#F2775A] text-white shadow-md shadow-[#F2775A]/30'
                  : 'bg-[#15213A] hover:bg-[#15213A]/80 text-[#E8EDF5]'
              }`}
            >
              <span>✋</span>
              <span>{handRaised ? 'Hand Raised' : 'Request to Speak'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-lg">
          <button className="p-2 rounded-lg hover:bg-[#15213A] transition-colors" title="Applause">🪘</button>
          <button className="p-2 rounded-lg hover:bg-[#15213A] transition-colors" title="Salute">👑</button>
          <button className="p-2 rounded-lg hover:bg-[#15213A] transition-colors" title="Fire">🔥</button>
          <button className="p-2 rounded-lg hover:bg-[#15213A] transition-colors" title="Island Vibes">🌴</button>
        </div>
      </div>
    </div>
  );
}
