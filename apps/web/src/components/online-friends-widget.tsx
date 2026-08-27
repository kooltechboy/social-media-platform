'use client';

import React, { useState } from 'react';
import { Search, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
}

const MOCK_FRIENDS: Friend[] = [
  { id: '1', name: 'Marcus Garvey Guild', username: 'garvey_diaspora', avatar: 'MG', isOnline: true },
  { id: '2', name: 'Aaliyah Baptiste', username: 'aaliyah_soca', avatar: 'AB', isOnline: true },
  { id: '3', name: 'Carlos Santana', username: 'carlos_rd', avatar: 'CS', isOnline: false, lastSeen: '2h ago' },
  { id: '4', name: 'Karene Reid', username: 'karenereid', avatar: 'KR', isOnline: true },
  { id: '5', name: 'David Lee', username: 'd_lee', avatar: 'DL', isOnline: false, lastSeen: '1d ago' },
];

export default function OnlineFriendsWidget() {
  const [search, setSearch] = useState('');

  const filteredFriends = MOCK_FRIENDS.filter((friend) => 
    friend.name.toLowerCase().includes(search.toLowerCase()) || 
    friend.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-brand-dusk/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-sm text-brand-sandstone flex items-center gap-2">
          Friends
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30">
          {MOCK_FRIENDS.filter(f => f.isOnline).length} ONLINE
        </span>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-brand-sandstone/40" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search friends..."
          className="w-full bg-brand-twilight/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea/50 transition-all"
        />
      </div>

      <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-1">
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => (
            <div key={friend.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-brand-dusk/50 transition-colors group cursor-pointer">
              <Link
                href={`/profile/${friend.username}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-brand-dusk flex items-center justify-center text-xs font-bold text-slate-300">
                    {friend.avatar}
                  </div>
                  {friend.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-brand-sunriseCoral border-2 border-slate-900"></span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 group-hover:text-brand-sandstone transition-colors truncate">{friend.name}</p>
                  <p className="text-[10px] text-brand-sandstone/40 truncate">
                    {friend.isOnline ? (
                      <span className="text-brand-sunriseCoral font-medium">Online</span>
                    ) : (
                      `Last seen ${friend.lastSeen}`
                    )}
                  </p>
                </div>
              </Link>
              
              <Link
                href={`/messages/${friend.username}`}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-slate-700 hover:bg-brand-caribbeanSea hover:text-brand-sandstone text-slate-300 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="w-4 h-4" />
              </Link>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-xs text-brand-sandstone/40">
            No friends found matching &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
