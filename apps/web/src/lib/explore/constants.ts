export interface VibeCategory {
  id: string;
  name: string;
  icon: string;
  desc: string;
  color: string;
  tags: string[];
}

export const VIBE_CATEGORIES: VibeCategory[] = [
  { id: 'music', name: 'Soca & Reggae', icon: '🎵', desc: 'Sound systems, soca, dancehall & dubplates', color: 'from-purple-500/20 to-purple-950/40 border-purple-500/30', tags: ['music', 'soca', 'reggae', 'dancehall', 'calypso', 'stems'] },
  { id: 'carnival', name: 'Carnival & Fetes', icon: '🎭', desc: 'Road marches, costumes, mas bands & J\'ouvert', color: 'from-rose-500/20 to-rose-950/40 border-rose-500/30', tags: ['carnival', 'fete', 'jouvert', 'mas', 'costume', 'band'] },
  { id: 'food', name: 'Food & Rum', icon: '🍛', desc: 'Authentic jerk, roti, aged rums & pepper sauces', color: 'from-amber-500/20 to-amber-950/40 border-amber-500/30', tags: ['food', 'jerk', 'rum', 'coffee', 'culinary', 'spices', 'roti'] },
  { id: 'tech', name: 'Tech & Business', icon: '🚀', desc: 'Founders, startups, fintech & remote work', color: 'from-brand-caribbeanSea/20 to-sky-950/40 border-brand-caribbeanSea/30', tags: ['tech', 'business', 'startups', 'fintech', 'payments', 'dev'] },
  { id: 'fashion', name: 'Fashion & Art', icon: '👗', desc: 'Caribbean designers, beaded jewelry & art', color: 'from-pink-500/20 to-pink-950/40 border-pink-500/30', tags: ['fashion', 'art', 'design', 'apparel', 'craft', 'jewelry'] },
  { id: 'nightlife', name: 'Nightlife & Sessions', icon: '🌙', desc: 'Clubs, soundclash, beach lounges & boat rides', color: 'from-indigo-500/20 to-indigo-950/40 border-indigo-500/30', tags: ['nightlife', 'party', 'lounge', 'soundclash', 'session', 'club'] },
  { id: 'sports', name: 'Cricket & Athletics', icon: '🏏', desc: 'Track champions, athletics, cricket & football', color: 'from-emerald-500/20 to-emerald-950/40 border-emerald-500/30', tags: ['sports', 'cricket', 'track', 'athletics', 'football', 'fitness'] },
  { id: 'travel', name: 'Islands & Resorts', icon: '🌴', desc: 'Hidden beaches, eco-resorts & island heritage', color: 'from-teal-500/20 to-teal-950/40 border-teal-500/30', tags: ['travel', 'islands', 'beach', 'resort', 'tourism', 'nature'] },
];

export interface ExploreQueryResult {
  posts: any[];
  creators: any[];
  events: any[];
  communities: any[];
  products: any[];
  selectedVibe: VibeCategory | null;
  selectedCountry: any | null;
  selectedHub: any | null;
  totalMatches: number;
}
