import React from 'react';
import Link from 'next/link';
import {
  Briefcase, Star, Search, MapPin, CheckCircle, ArrowRight, DollarSign, Calendar, Users
} from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { fetchCreatorMarketplaceListingsAction } from '../../lib/marketplace/creator-marketplace-actions';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['ALL', 'Music', 'Food', 'Fashion', 'Sports', 'Comedy', 'Travel', 'Business'];

export default async function CreatorMarketplacePage({ searchParams }: { searchParams?: Promise<{ tab?: string; category?: string }> }) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeTab = resolvedParams.tab || 'browse';
  const category = resolvedParams.category || 'ALL';

  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  let listings: any[] = [];
  let userBriefs: any[] = [];

  if (activeTab === 'browse') {
    const res = await fetchCreatorMarketplaceListingsAction({ category });
    listings = res.listings || [];
  } else if (activeTab === 'briefs' && user && supabase) {
    const { data } = await supabase.from('brand_campaign_briefs').select('*, creator_applications(count)').eq('business_id', user.id);
    userBriefs = data || [];
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto space-y-6 text-brand-sandstone animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-sandstone flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-400" /> Creator Marketplace
          </h1>
          <p className="text-sm text-brand-sandstone/70 mt-1">Connect with the top Caribbean creators and influencers.</p>
        </div>
        <div className="flex bg-brand-dusk border border-slate-800 rounded-2xl p-1">
          <Link href="?tab=browse" className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'browse' ? 'bg-brand-caribbeanSea text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
            Browse Creators
          </Link>
          <Link href="?tab=briefs" className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'briefs' ? 'bg-brand-sunriseCoral text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
            Brand Campaigns
          </Link>
        </div>
      </div>

      {activeTab === 'browse' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <Link
                key={cat}
                href={`?tab=browse&category=${cat}`}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${category === cat ? 'bg-brand-twilight text-brand-sandstone border-brand-twilight' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'}`}
              >
                {cat}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-400 bg-brand-dusk/40 border border-slate-800 rounded-3xl">
                No creators found for this category.
              </div>
            ) : (
              listings.map(listing => (
                <div key={listing.id} className="bg-brand-dusk border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={listing.profiles?.avatar_url || '/default-avatar.png'} alt="" className="w-12 h-12 rounded-full object-cover bg-slate-800" />
                    <div>
                      <h3 className="font-bold text-sm text-brand-sandstone">{listing.profiles?.display_name}</h3>
                      <p className="text-[10px] text-slate-400">@{listing.profiles?.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {listing.categories?.map((c: string) => (
                      <span key={c} className="px-2 py-0.5 rounded-md bg-brand-twilight/50 text-[9px] font-bold uppercase text-brand-sandstone border border-brand-twilight">
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/50 p-2 rounded-xl">
                      <p className="text-[10px] text-slate-400">Min. Budget</p>
                      <p className="font-bold text-yellow-400">${((listing.min_collaboration_budget_cents || 0)/100).toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-xl">
                      <p className="text-[10px] text-slate-400">Turnaround</p>
                      <p className="font-bold text-brand-sandstone">{listing.typical_turnaround_days} days</p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-2 pt-2">
                    <Link href={`/profile/${listing.profiles?.username}`} className="block w-full py-2 text-center text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                      View Profile
                    </Link>
                    <Link href={`/messages?u=${listing.profiles?.username}&compose=true`} className="block w-full py-2 text-center text-xs font-bold text-slate-900 bg-brand-caribbeanSea hover:bg-emerald-400 rounded-xl transition-colors">
                      Invite to Collaborate
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'briefs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-black text-brand-sandstone">Your Campaigns</h2>
            {userBriefs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-brand-dusk/40 border border-slate-800 rounded-3xl">
                You haven&apos;t posted any briefs yet.
              </div>
            ) : (
              <div className="space-y-4">
                {userBriefs.map(brief => (
                  <div key={brief.id} className="p-5 border border-slate-800 rounded-3xl bg-brand-dusk flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-brand-sandstone">{brief.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 max-w-lg">{brief.description}</p>
                      <div className="flex gap-4 text-[10px] text-brand-sandstone/60">
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-400"/> ${(brief.budget_range_cents_max/100).toFixed(0)} max</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-blue-400"/> {new Date(brief.deadline).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-brand-sunriseCoral"/> {brief.creator_applications[0]?.count || 0} applicants</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center">
                      <span className="px-3 py-1 rounded-full bg-brand-caribbeanSea/10 text-brand-caribbeanSea border border-brand-caribbeanSea/30 text-[10px] font-bold uppercase">
                        {brief.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-6 border border-slate-800 rounded-3xl bg-brand-dusk">
              <h2 className="text-sm font-bold text-brand-sandstone mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-sunriseCoral" /> Post a New Brief
              </h2>
              <div className="p-4 bg-slate-900/50 rounded-2xl text-xs text-slate-400 text-center border border-dashed border-slate-700">
                Create a new brief form placeholder (implemented via Client Component calling createBriefAction).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
