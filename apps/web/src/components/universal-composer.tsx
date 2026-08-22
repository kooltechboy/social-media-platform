'use client';

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Video,
  Link2,
  BarChart2,
  Calendar,
  ShoppingBag,
  HeartHandshake,
  MapPin,
  Globe,
  Sparkles,
  Send,
  X,
  Plus,
  Smile,
  Wallet,
  CheckCircle,
} from 'lucide-react';
import { createPostAction } from '../lib/social/actions';

type ComposerMode = 'text' | 'photo' | 'video' | 'link' | 'poll' | 'product' | 'event' | 'fundraiser';

interface UniversalComposerProps {
  displayName?: string;
  avatarInitials?: string;
  onPostCreated?: () => void;
}

const CARIBBEAN_COUNTRIES = [
  'Jamaica 🇯🇲',
  'Trinidad & Tobago 🇹🇹',
  'Dominican Republic 🇩🇴',
  'Barbados 🇧🇧',
  'Haiti 🇭🇹',
  'Bahamas 🇧🇸',
  'Cuba 🇨🇺',
  'Puerto Rico 🇵🇷',
  'Guyana 🇬🇾',
  'Suriname 🇸🇷',
  'Belize 🇧🇿',
  'Grenada 🇬🇩',
  'Saint Lucia 🇱🇨',
  'Antigua & Barbuda 🇦🇬',
  'Dominica 🇩🇲',
  'St. Vincent & Grenadines 🇻🇨',
  'St. Kitts & Nevis 🇰🇳',
  'Curaçao 🇨🇼',
  'Aruba 🇦🇼',
  'Global Diaspora 🌍',
];

const DIASPORA_HUBS = [
  'Island Local',
  'Toronto, Canada 🇨🇦',
  'Miami, USA 🗽',
  'Brooklyn / NYC, USA 🗽',
  'London, UK 🇬🇧',
  'Montreal, Canada 🇨🇦',
  'Amsterdam, Netherlands 🇳🇱',
  'Atlanta, USA 🗽',
];

export default function UniversalComposer({
  displayName = 'Caribbean Member',
  avatarInitials = 'CO',
  onPostCreated,
}: UniversalComposerProps) {
  const [mode, setMode] = useState<ComposerMode>('text');
  const [content, setContent] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(CARIBBEAN_COUNTRIES[0]);
  const [selectedHub, setSelectedHub] = useState(DIASPORA_HUBS[0]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [productTitle, setProductTitle] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && mode === 'text') return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      let finalContent = content;

      if (mode === 'poll') {
        finalContent = `${content}\n\n📊 Poll: ${pollQuestion}\n• ${pollOptions.filter(Boolean).join('\n• ')}`;
      } else if (mode === 'product') {
        finalContent = `${content}\n\n🛍️ Attached Product: ${productTitle} ($${productPrice} USD on SpotPay)`;
      } else if (mode === 'event') {
        finalContent = `${content}\n\n📅 Upcoming Event: ${eventTitle} (${eventDate})`;
      }

      // Add Country & Diaspora meta tag
      finalContent = `${finalContent}\n\n📍 ${selectedCountry} • ${selectedHub}`;

      const formData = new FormData();
      formData.set('content', finalContent);
      const result = await createPostAction({ error: null }, formData);

      if (result.error) {
        setSuccessMessage(`Error: ${result.error}`);
        return;
      }

      setContent('');
      setPollQuestion('');
      setPollOptions(['', '']);
      setProductTitle('');
      setProductPrice('');
      setEventTitle('');
      setEventDate('');
      setMode('text');
      setSuccessMessage('Published to the Caribbean One ecosystem!');
      setTimeout(() => setSuccessMessage(null), 4000);
      if (onPostCreated) onPostCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4">
      {/* Top Header & Identity */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
            {avatarInitials}
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">{displayName}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-300 rounded-lg px-2 py-0.5 focus:outline-none focus:border-sky-500"
              >
                {CARIBBEAN_COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-300 rounded-lg px-2 py-0.5 focus:outline-none focus:border-sky-500"
              >
                {DIASPORA_HUBS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
          Universal Composer
        </span>
      </div>

      {/* Main Textarea */}
      <form onSubmit={handlePublish} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What is happening across the Caribbean or diaspora, ${displayName.split(' ')[0]}?`}
          rows={3}
          className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/60 transition-all resize-none"
        />

        {/* Mode Specific Attachments */}
        {mode === 'poll' && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4" /> Caribbean Community Poll
              </span>
              <button type="button" onClick={() => setMode('text')} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask a question to the community..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
            />
            <div className="space-y-2">
              {pollOptions.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[idx] = e.target.value;
                    setPollOptions(next);
                  }}
                  placeholder={`Option ${idx + 1}`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                />
              ))}
            </div>
            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="text-[11px] font-bold text-sky-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Option
              </button>
            )}
          </div>
        )}

        {mode === 'product' && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" /> Attach Marketplace Product / Service
              </span>
              <button type="button" onClick={() => setMode('text')} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder="Product name (e.g. Handmade Mas Costume)"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="Price (USD minor / e.g. 45.00)"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        )}

        {mode === 'event' && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-yellow-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Attach Cultural Event / Fete
              </span>
              <button type="button" onClick={() => setMode('text')} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Event Title (e.g. Jouvert Sunrise Party)"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
              />
            </div>
          </div>
        )}

        {/* Action Toolbar & Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {/* Mode Selector Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setMode(mode === 'photo' ? 'text' : 'photo')}
              title="Add Photos"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'photo' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <span className="hidden md:inline">Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === 'video' ? 'text' : 'video')}
              title="Add Video / Reel"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'video' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Video className="w-4 h-4 text-rose-400" />
              <span className="hidden md:inline">Video</span>
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === 'poll' ? 'text' : 'poll')}
              title="Create Poll"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'poll' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <span className="hidden md:inline">Poll</span>
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === 'product' ? 'text' : 'product')}
              title="Attach Product"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'product' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Product</span>
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === 'event' ? 'text' : 'event')}
              title="Attach Event"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'event' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4 text-yellow-400" />
              <span className="hidden md:inline">Event</span>
            </button>
          </div>

          {/* Publish Button */}
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && mode === 'text')}
            className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-black px-6 py-2 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Publishing...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Publish to Diaspora
              </>
            )}
          </button>
        </div>

        {successMessage && (
          <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <CheckCircle className="w-4 h-4" /> {successMessage}
          </p>
        )}
      </form>
    </div>
  );
}
