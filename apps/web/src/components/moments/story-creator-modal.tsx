'use client';

import React, { useState, useRef, useTransition } from 'react';
import { Camera, Video, Type, BarChart2, MessageCircle, MapPin, Tag, Link as LinkIcon, Clock, X, Image as ImageIcon, Send, Music } from 'lucide-react';
import { createStoryAction } from '../../lib/social/actions';

interface StoryCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated?: () => void;
}

type Mode = 'photo' | 'video' | 'text' | 'poll' | 'question';

const GRADIENTS = [
  { name: 'Sunset', value: 'from-orange-500 to-rose-600' },
  { name: 'Caribbean Sea', value: 'from-cyan-500 to-blue-700' },
  { name: 'Tropical', value: 'from-green-500 to-teal-600' },
  { name: 'Golden Hour', value: 'from-amber-400 to-orange-600' },
  { name: 'Twilight', value: 'from-purple-700 to-indigo-900' },
  { name: 'Midnight', value: 'from-slate-800 to-slate-950' },
];

export default function StoryCreatorModal({ isOpen, onClose, onStoryCreated }: StoryCreatorModalProps) {
  const [mode, setMode] = useState<Mode>('photo');
  const [mediaUrl, setMediaUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [bgGradient, setBgGradient] = useState(GRADIENTS[0].value);
  const [audience, setAudience] = useState<'public' | 'friends' | 'close_friends'>('public');
  const [poll, setPoll] = useState({ question: '', optionA: '', optionB: '' });
  const [question, setQuestion] = useState({ prompt: '' });
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePublish = () => {
    setErrorMsg('');
    startTransition(async () => {
      const { error } = await createStoryAction({
        mediaUrl: mode === 'photo' || mode === 'video' ? mediaUrl : undefined,
        mediaType: mode === 'photo' ? 'photo' : mode === 'video' ? 'video' : 'text',
        textContent,
        backgroundColor: mode === 'text' ? bgGradient : undefined,
        pollData: mode === 'poll' ? poll : undefined,
        questionData: mode === 'question' ? question : undefined,
        audienceMode: audience,
      });

      if (error) {
        setErrorMsg(error);
      } else {
        onStoryCreated?.();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0A1024] border border-white/10 w-full max-w-md h-[85vh] max-h-[800px] rounded-3xl overflow-hidden flex flex-col relative shadow-2xl">
        {/* Header */}
        <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
          <button onClick={onClose} className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70">
            <X className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as any)}
              className="bg-black/50 text-xs text-white border-none rounded-full px-3 py-1 outline-none"
            >
              <option value="public">🌎 Everyone</option>
              <option value="friends">👥 Friends Only</option>
              <option value="close_friends">⭐ Close Friends</option>
            </select>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="px-4 pt-16 pb-2 flex gap-2 overflow-x-auto scrollbar-none justify-center">
          {[
            { id: 'photo', icon: <Camera size={16} />, label: 'Photo' },
            { id: 'video', icon: <Video size={16} />, label: 'Video' },
            { id: 'text', icon: <Type size={16} />, label: 'Text' },
            { id: 'poll', icon: <BarChart2 size={16} />, label: 'Poll' },
            { id: 'question', icon: <MessageCircle size={16} />, label: 'Question' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as Mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${mode === m.id ? 'bg-brand-caribbeanSea text-black' : 'bg-white/10 text-white'}`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative m-4 rounded-2xl overflow-hidden border border-white/10 bg-slate-900 flex items-center justify-center">
          
          {(mode === 'photo' || mode === 'video') && (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {mediaUrl ? (
                mode === 'photo' ? (
                  <img src={mediaUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={mediaUrl} className="w-full h-full object-cover" controls />
                )
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 bg-white/5 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <ImageIcon size={32} className="text-brand-caribbeanSea" />
                  <span className="text-sm font-bold text-white">Choose {mode}</span>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={mode === 'photo' ? 'image/*' : 'video/*'}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setMediaUrl(URL.createObjectURL(e.target.files[0]));
                  }
                }}
              />
              {mediaUrl && (
                <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-4">
                   <input
                     type="text"
                     placeholder="Add a caption..."
                     value={textContent}
                     onChange={(e) => setTextContent(e.target.value)}
                     className="w-full bg-black/50 text-white rounded-xl px-4 py-3 placeholder:text-white/70 border border-white/20"
                   />
                </div>
              )}
            </div>
          )}

          {mode === 'text' && (
            <div className={`w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br ${bgGradient}`}>
              <textarea
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder="Type something..."
                className="bg-transparent text-center text-2xl font-bold text-white placeholder:text-white/50 w-full resize-none outline-none"
                rows={4}
              />
              <div className="absolute bottom-4 flex gap-2">
                {GRADIENTS.map(g => (
                  <button
                    key={g.name}
                    onClick={() => setBgGradient(g.value)}
                    className={`w-8 h-8 rounded-full border-2 ${bgGradient === g.value ? 'border-white' : 'border-transparent'} bg-gradient-to-br ${g.value}`}
                  />
                ))}
              </div>
            </div>
          )}

          {mode === 'poll' && (
            <div className="w-full p-6 space-y-4">
               <input
                 type="text"
                 placeholder="Ask a question..."
                 value={poll.question}
                 onChange={e => setPoll({...poll, question: e.target.value})}
                 className="w-full bg-white/10 text-white text-lg font-bold p-4 rounded-xl border border-white/20 text-center"
               />
               <div className="space-y-2">
                 <input
                   type="text"
                   placeholder="Option A"
                   value={poll.optionA}
                   onChange={e => setPoll({...poll, optionA: e.target.value})}
                   className="w-full bg-brand-caribbeanSea/20 text-brand-caribbeanSea text-center font-bold p-3 rounded-xl border border-brand-caribbeanSea/50"
                 />
                 <input
                   type="text"
                   placeholder="Option B"
                   value={poll.optionB}
                   onChange={e => setPoll({...poll, optionB: e.target.value})}
                   className="w-full bg-brand-sunriseCoral/20 text-brand-sunriseCoral text-center font-bold p-3 rounded-xl border border-brand-sunriseCoral/50"
                 />
               </div>
            </div>
          )}

          {mode === 'question' && (
            <div className="w-full p-6">
              <div className="bg-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral" />
                <textarea
                  value={question.prompt}
                  onChange={e => setQuestion({prompt: e.target.value})}
                  placeholder="Ask me anything..."
                  className="w-full bg-transparent text-slate-900 text-lg font-bold text-center resize-none outline-none mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sticker Tray */}
        <div className="px-4 pb-4 flex gap-3 overflow-x-auto scrollbar-none">
          {[
            { icon: <MapPin size={14}/>, label: 'Location' },
            { icon: <Tag size={14}/>, label: 'Mention' },
            { icon: <Music size={14}/>, label: 'Music' },
            { icon: <LinkIcon size={14}/>, label: 'Link' },
            { icon: <Clock size={14}/>, label: 'Countdown' }
          ].map(s => (
             <button key={s.label} className="flex-shrink-0 flex flex-col items-center gap-1 group">
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-brand-caribbeanSea group-hover:text-black transition-colors">
                 {s.icon}
               </div>
               <span className="text-[10px] text-white/50">{s.label}</span>
             </button>
          ))}
        </div>

        {errorMsg && <p className="text-rose-400 text-xs text-center pb-2 px-4">{errorMsg}</p>}

        {/* Footer */}
        <div className="p-4 pt-0">
          <button
            onClick={handlePublish}
            disabled={isPending}
            className="w-full bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-caribbeanSea/20 hover:brightness-110 disabled:opacity-50"
          >
            {isPending ? 'Publishing...' : <><Send size={18} /> Publish Story</>}
          </button>
        </div>
      </div>
    </div>
  );
}
