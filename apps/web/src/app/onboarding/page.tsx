'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateOnboardingIdentity } from '../../lib/social/onboarding-actions';

// Extracted from database schema
const CARIBBEAN_COUNTRIES = [
  { iso: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
  { iso: 'DOM', name: 'Dominican Republic', flag: '🇩🇴' },
  { iso: 'TTO', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { iso: 'BRB', name: 'Barbados', flag: '🇧🇧' },
  { iso: 'BHS', name: 'Bahamas', flag: '🇧🇸' },
  { iso: 'HTI', name: 'Haiti', flag: '🇭🇹' },
];

const DIASPORA_HUBS = [
  { id: '2c5a0899-7ab0-4966-96b5-0c6a5a3a0e0f', name: 'Miami, USA', flag: '🇺🇸' },
  { id: '375a3f12-0cf7-4f6c-84ea-9d8a3a2ebf5f', name: 'New York, USA', flag: '🇺🇸' },
  { id: '417b3f9b-6b2c-47fc-8f7d-0d6eb3eb3fc8', name: 'Toronto, Canada', flag: '🇨🇦' },
  { id: '5f9b48c7-4f4d-495a-b9c2-7b1c3e3f0e0d', name: 'London, UK', flag: '🇬🇧' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [originIso, setOriginIso] = useState<string>('');
  const [diasporaId, setDiasporaId] = useState<string>('');
  const [isDiaspora, setIsDiaspora] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originIso) return;
    
    setLoading(true);
    try {
      await updateOnboardingIdentity(originIso, isDiaspora ? diasporaId : null);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-16 px-4">
      <div className="bg-[#0B132B]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to ANTILIA</h1>
        <p className="text-slate-400 mb-8">
          To personalize your experience and connect you with your community, let&apos;s establish your Caribbean roots.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Origin Country */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-sky-400">Where are your Caribbean roots?</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CARIBBEAN_COUNTRIES.map((c) => (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => setOriginIso(c.iso)}
                  className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                    originIso === c.iso
                      ? 'bg-sky-500/20 border-sky-500/50 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-3xl mb-2">{c.flag}</span>
                  <span className="text-xs font-bold text-center">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Diaspora Toggle */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isDiaspora}
                onChange={(e) => setIsDiaspora(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950"
              />
              <span className="text-sm font-semibold text-slate-200">I currently live in the Global Diaspora</span>
            </label>
            
            {isDiaspora && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {DIASPORA_HUBS.map((hub) => (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => setDiasporaId(hub.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                      diasporaId === hub.id
                        ? 'bg-sky-500/20 border-sky-500/50 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xl">{hub.flag}</span>
                    <span className="text-xs font-bold">{hub.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800/80">
            <button
              type="submit"
              disabled={!originIso || loading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              {loading ? 'Saving...' : 'Enter the Platform'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
