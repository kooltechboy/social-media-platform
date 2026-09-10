'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Target, Users, Layout, Image as ImageIcon, DollarSign, Sparkles, Loader2, Megaphone, CheckCircle, Play, MessageCircle, ShoppingCart, Search } from 'lucide-react';
import { 
  createCampaignAction, 
  createAdSetAction, 
  createAdAction, 
  generateAIAdCopyAction 
} from '../../../lib/advertising/actions';

const OBJECTIVES = [
  { id: 'awareness', icon: Megaphone, name: 'Awareness', desc: 'Reach more Caribbean people' },
  { id: 'traffic', icon: Target, name: 'Traffic', desc: 'Drive visitors to your website' },
  { id: 'engagement', icon: Users, name: 'Engagement', desc: 'Get more likes, comments & shares' },
  { id: 'video_views', icon: Play, name: 'Video Views', desc: 'Showcase your videos & Reels' },
  { id: 'messages', icon: MessageCircle, name: 'Messages', desc: 'Start conversations with customers' },
  { id: 'marketplace_sales', icon: ShoppingCart, name: 'Sales', desc: 'Drive purchases on your store' },
  { id: 'creator_promotion', icon: Sparkles, name: 'Creator Promotion', desc: 'Grow your creator presence' },
];

const CARIBBEAN_COUNTRIES = [
  { code: 'JAM', name: 'Jamaica' },
  { code: 'TTO', name: 'Trinidad & Tobago' },
  { code: 'BRB', name: 'Barbados' },
  { code: 'BHS', name: 'Bahamas' },
  { code: 'HTG', name: 'Haiti' },
  { code: 'DOM', name: 'Dominican Republic' },
];

const LANGUAGES = ['English', 'Spanish', 'French', 'Haitian Creole', 'Papiamento', 'Dutch'];
const INTERESTS = ['Music', 'Food', 'Fashion', 'Sports', 'Business', 'Travel', 'Community', 'Culture'];

const PLACEMENTS = [
  { id: 'feed', name: 'Feed', icon: Layout },
  { id: 'reels', name: 'Reels', icon: Play },
  { id: 'stories', name: 'Stories', icon: ImageIcon },
  { id: 'explore', name: 'Explore', icon: Search },
  { id: 'marketplace', name: 'Marketplace', icon: ShoppingCart },
  { id: 'communities', name: 'Communities', icon: Users },
];


export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [objective, setObjective] = useState('');
  const [campaignName, setCampaignName] = useState('My Campaign');
  
  // Audience
  const [countries, setCountries] = useState<string[]>([]);
  const [diaspora, setDiaspora] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  
  // Placements
  const [placements, setPlacements] = useState<string[]>(['feed']);
  const [autoPlacements, setAutoPlacements] = useState(true);

  // Creative
  const [creativeType, setCreativeType] = useState('single_image');
  const [adName, setAdName] = useState('Ad 1');
  const [headline, setHeadline] = useState('');
  const [primaryText, setPrimaryText] = useState('');
  const [cta, setCta] = useState('Learn More');
  const [businessDesc, setBusinessDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mediaPath, setMediaPath] = useState('/placeholder-ad.jpg');

  // Budget
  const [budgetType, setBudgetType] = useState('daily');
  const [amount, setAmount] = useState('10');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  const [agreed, setAgreed] = useState(false);

  const toggleArray = (arr: string[], setArr: any, val: string) => {
    if (arr.includes(val)) setArr(arr.filter(a => a !== val));
    else setArr([...arr, val]);
  };

  const handleGenerateAI = async () => {
    if (!businessDesc) return;
    setIsGenerating(true);
    const { copy, error } = await generateAIAdCopyAction({ businessDescription: businessDesc });
    if (copy) {
      setHeadline(copy.headline);
      setPrimaryText(copy.primaryText);
      setCta(copy.cta);
    }
    setIsGenerating(false);
  };

  const handleSubmit = async () => {
    if (!agreed) return;
    setIsSubmitting(true);
    setError(null);
    
    // Create Campaign
    const campRes = await createCampaignAction({
      name: campaignName,
      objective: 'awareness',
      objective_v2: objective,
      budgetTotalMinor: budgetType === 'total' ? parseFloat(amount) * 100 : parseFloat(amount) * 100 * 30, // Rough if daily
      budgetDailyMinor: budgetType === 'daily' ? parseFloat(amount) * 100 : undefined,
      currency: 'USD',
      startsAt: new Date(startDate).toISOString(),
    });

    if (campRes.error || !campRes.campaignId) {
      setError(campRes.error || 'Failed to create campaign');
      setIsSubmitting(false);
      return;
    }

    // Create Ad Set
    const adSetRes = await createAdSetAction({
      campaignId: campRes.campaignId,
      name: 'Ad Set 1',
      placements: autoPlacements ? PLACEMENTS.map(p => p.id) : placements,
      interest_keys: interests,
      country_iso: countries[0] || 'JAM'
    });

    if (adSetRes.error || !adSetRes.adSetId) {
      setError(adSetRes.error || 'Failed to create ad set');
      setIsSubmitting(false);
      return;
    }

    // Create Ad
    const adRes = await createAdAction({
      adSetId: adSetRes.adSetId,
      headline,
      body: primaryText,
      media_path: mediaPath,
      creative_type: creativeType,
    });

    if (adRes.error || !adRes.adId) {
      setError(adRes.error || 'Failed to create ad');
      setIsSubmitting(false);
      return;
    }

    router.push('/ads');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-brand-twilight pb-20">
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black text-white">Create New Campaign</h1>
            <button onClick={() => router.push('/ads')} className="text-sm font-bold text-slate-400 hover:text-white">Cancel</button>
          </div>
          
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s ? 'bg-brand-sunriseCoral text-white' : 
                  step > s ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider hidden md:block ${
                  step === s ? 'text-brand-sunriseCoral' : 'text-slate-500'
                }`}>
                  {s === 1 && 'Objective'}
                  {s === 2 && 'Audience'}
                  {s === 3 && 'Placements'}
                  {s === 4 && 'Creative'}
                  {s === 5 && 'Budget'}
                  {s === 6 && 'Review'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 min-h-[500px]">
          
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-black text-white mb-6">Choose Campaign Objective</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {OBJECTIVES.map((obj) => {
                  const Icon = obj.icon;
                  return (
                    <button
                      key={obj.id}
                      onClick={() => setObjective(obj.id)}
                      className={`p-5 rounded-2xl border text-left transition-all group ${
                        objective === obj.id 
                          ? 'border-brand-sunriseCoral bg-brand-sunriseCoral/10' 
                          : 'border-slate-800 bg-slate-950 hover:border-slate-600'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mb-3 ${objective === obj.id ? 'text-brand-sunriseCoral' : 'text-slate-400 group-hover:text-white'}`} />
                      <div className="font-bold text-white mb-1">{obj.name}</div>
                      <div className="text-xs text-slate-400">{obj.desc}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8">
                <label className="block text-sm font-bold text-slate-300 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-sunriseCoral"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-fadeIn">
              <h2 className="text-2xl font-black text-white">Audience Targeting</h2>
              
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-300">Geography (Caribbean)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CARIBBEAN_COUNTRIES.map(c => (
                    <label key={c.code} className="flex items-center gap-3 p-3 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-800/50">
                      <input 
                        type="checkbox" 
                        checked={countries.includes(c.code)}
                        onChange={() => toggleArray(countries, setCountries, c.code)}
                        className="w-5 h-5 accent-brand-sunriseCoral"
                      />
                      <span className="text-sm font-bold text-white">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-brand-goldenHour/30 bg-brand-goldenHour/5 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={diaspora}
                    onChange={(e) => setDiaspora(e.target.checked)}
                    className="w-5 h-5 accent-brand-goldenHour"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">Target Diaspora Cities</div>
                    <div className="text-xs text-slate-400">NYC, Miami, Toronto, London, Paris, Amsterdam, Montreal</div>
                  </div>
                </label>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-300">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button
                      key={l}
                      onClick={() => toggleArray(languages, setLanguages, l)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                        languages.includes(l) ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea text-brand-caribbeanSea' : 'border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-300">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(i => (
                    <button
                      key={i}
                      onClick={() => toggleArray(interests, setInterests, i)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                        interests.includes(i) ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fadeIn">
              <h2 className="text-2xl font-black text-white">Placements</h2>
              
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setAutoPlacements(true)}
                  className={`flex-1 p-4 rounded-xl border text-center font-bold transition-colors ${
                    autoPlacements ? 'border-brand-sunriseCoral bg-brand-sunriseCoral/10 text-white' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  Automatic Placements (Recommended)
                </button>
                <button
                  onClick={() => setAutoPlacements(false)}
                  className={`flex-1 p-4 rounded-xl border text-center font-bold transition-colors ${
                    !autoPlacements ? 'border-brand-sunriseCoral bg-brand-sunriseCoral/10 text-white' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  Manual Placements
                </button>
              </div>

              {!autoPlacements && (
                <div className="grid grid-cols-2 gap-4">
                  {PLACEMENTS.map(p => {
                    const Icon = p.icon;
                    return (
                      <label key={p.id} className="flex items-center gap-3 p-4 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-800/50">
                        <input
                          type="checkbox"
                          checked={placements.includes(p.id)}
                          onChange={() => toggleArray(placements, setPlacements, p.id)}
                          className="w-5 h-5 accent-brand-sunriseCoral"
                        />
                        <Icon className="w-5 h-5 text-slate-400" />
                        <span className="font-bold text-white">{p.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-black text-white">Ad Creative</h2>
              
              <div className="flex border-b border-slate-800 mb-6">
                {['single_image', 'video', 'carousel'].map(type => (
                  <button
                    key={type}
                    onClick={() => setCreativeType(type)}
                    className={`px-6 py-3 font-bold text-sm capitalize ${
                      creativeType === type ? 'text-brand-sunriseCoral border-b-2 border-brand-sunriseCoral' : 'text-slate-400'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="bg-gradient-to-r from-brand-twilight/50 to-purple-900/20 p-5 rounded-2xl border border-purple-500/30">
                <div className="flex items-center gap-2 text-purple-400 font-black mb-3">
                  <Sparkles className="w-5 h-5" /> Generate with AI
                </div>
                <textarea
                  placeholder="Describe your business or product..."
                  value={businessDesc}
                  onChange={e => setBusinessDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-purple-500/30 rounded-xl p-3 text-sm text-white focus:outline-none mb-3"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !businessDesc}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Ad Copy
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1">Headline (max 40)</label>
                  <input
                    type="text"
                    maxLength={40}
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-sunriseCoral"
                  />
                  <div className="text-right text-xs text-slate-500 mt-1">{headline.length}/40</div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1">Primary Text (max 150)</label>
                  <textarea
                    maxLength={150}
                    value={primaryText}
                    onChange={e => setPrimaryText(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-sunriseCoral resize-none"
                  />
                  <div className="text-right text-xs text-slate-500 mt-1">{primaryText.length}/150</div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1">Call to Action</label>
                  <select
                    value={cta}
                    onChange={e => setCta(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-sunriseCoral"
                  >
                    <option value="Learn More">Learn More</option>
                    <option value="Shop Now">Shop Now</option>
                    <option value="Sign Up">Sign Up</option>
                    <option value="Book Now">Book Now</option>
                    <option value="Contact Us">Contact Us</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-fadeIn">
              <h2 className="text-2xl font-black text-white">Budget & Schedule</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setBudgetType('daily')}
                  className={`p-4 rounded-xl border text-center font-bold transition-colors ${
                    budgetType === 'daily' ? 'border-brand-sunriseCoral bg-brand-sunriseCoral/10 text-white' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  Daily Budget
                </button>
                <button
                  onClick={() => setBudgetType('total')}
                  className={`p-4 rounded-xl border text-center font-bold transition-colors ${
                    budgetType === 'total' ? 'border-brand-sunriseCoral bg-brand-sunriseCoral/10 text-white' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  Total Budget
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Amount (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="number"
                    min="10"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white font-black text-xl focus:outline-none focus:border-brand-sunriseCoral"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-slate-400 text-sm font-bold mb-1">Estimated Daily Reach</div>
                <div className="text-2xl font-black text-emerald-400">500 – 2,000 people</div>
                <div className="text-xs text-slate-500 mt-2">Estimate based on your budget and targeting.</div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-8 animate-fadeIn">
              <h2 className="text-2xl font-black text-white">Review & Publish</h2>
              
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-900 text-red-400 rounded-xl text-sm font-bold">
                  {error}
                </div>
              )}
              
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Campaign</div>
                  <div className="text-white font-bold text-lg">{campaignName}</div>
                  <div className="text-slate-400 capitalize">{objective.replace('_', ' ')}</div>
                </div>
                
                <div className="h-px bg-slate-800 w-full" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Budget</div>
                    <div className="text-white font-bold">${amount} / {budgetType}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Schedule</div>
                    <div className="text-white font-bold">{startDate} {endDate ? `- ${endDate}` : 'Ongoing'}</div>
                  </div>
                </div>
                
                <div className="h-px bg-slate-800 w-full" />
                
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Ad Preview</div>
                  <div className="mt-3 border border-slate-800 rounded-xl p-4 bg-slate-900 max-w-sm">
                    <div className="text-sm text-white mb-2">{primaryText || 'Your ad text will appear here'}</div>
                    <div className="h-40 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 mb-3">
                      <ImageIcon className="w-8 h-8 opacity-50" />
                    </div>
                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg">
                      <div className="text-sm font-bold text-white truncate pr-2">{headline || 'Ad Headline'}</div>
                      <button className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md font-bold shrink-0">{cta}</button>
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5">
                  <input 
                    type="checkbox" 
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="w-5 h-5 accent-brand-sunriseCoral" 
                  />
                </div>
                <div className="text-sm text-slate-400 group-hover:text-slate-300">
                  I agree to the <span className="text-brand-sunriseCoral font-bold">TUKUBI Advertising Policies</span>. 
                  I understand that I am responsible for the content of my ads and that they must comply with local laws and platform guidelines.
                </div>
              </label>
            </div>
          )}

        </div>
        
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || isSubmitting}
            className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white disabled:opacity-0 transition-colors"
          >
            Back
          </button>
          
          {step < 6 ? (
            <button
              onClick={() => {
                if (step === 1 && !objective) return;
                setStep(step + 1);
              }}
              disabled={(step === 1 && !objective)}
              className="bg-brand-sunriseCoral hover:bg-brand-goldenHour text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!agreed || isSubmitting}
              className="bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-brand-sunriseCoral/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</>
              ) : (
                <><CheckCircle className="w-5 h-5" /> Launch Campaign</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
