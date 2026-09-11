import React from 'react';
import Link from 'next/link';
import { Briefcase, Star, Users, DollarSign, Calendar, UserCircle } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import {
  fetchCreatorMarketplaceListingsAction,
  fetchMyApplicationsAction,
  fetchMyCreatorMarketplaceProfileAction,
} from '../../lib/marketplace/creator-marketplace-actions';
import CreateBriefForm from '../../components/creator/create-brief-form';
import CreatorMarketplaceProfileForm from '../../components/creator/creator-marketplace-profile-form';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['ALL', 'Music', 'Food & Beverage', 'Fashion', 'Sports', 'Comedy', 'Travel', 'Business', 'Art & Culture', 'Beauty', 'Tech'];

export default async function CreatorMarketplacePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; category?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeTab = resolvedParams.tab || 'browse';
  const category = resolvedParams.category || 'ALL';

  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  let listings: any[] = [];
  let userBriefs: any[] = [];
  let myApplications: any[] = [];
  let creatorProfile: any = null;

  if (activeTab === 'browse') {
    const res = await fetchCreatorMarketplaceListingsAction({ category });
    listings = res.listings || [];
  } else if (activeTab === 'briefs' && user && supabase) {
    const { data } = await supabase
      .from('brand_campaign_briefs')
      .select('*, creator_applications(count)')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false });
    userBriefs = data || [];
  } else if (activeTab === 'profile' && user) {
    const res = await fetchMyCreatorMarketplaceProfileAction();
    creatorProfile = res.profile;
  } else if (activeTab === 'applications' && user) {
    const res = await fetchMyApplicationsAction();
    myApplications = res.applications;
  }

  const TABS = [
    { id: 'browse', label: '🔍 Browse Creators' },
    { id: 'briefs', label: '📋 Brand Campaigns' },
    { id: 'profile', label: '🌟 My Profile' },
    { id: 'applications', label: '📨 My Applications' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto space-y-6 text-brand-sandstone animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-sandstone flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-400" /> Creator Marketplace
          </h1>
          <p className="text-sm text-brand-sandstone/70 mt-1">
            Connect Caribbean creators with brands. Authentic partnerships, real impact.
          </p>
        </div>
        <div className="flex flex-wrap bg-brand-dusk border border-slate-800 rounded-2xl p-1 gap-1">
          {TABS.map(tab => (
            <Link
              key={tab.id}
              href={`?tab=${tab.id}`}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-twilight text-brand-sandstone shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Browse Creators */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <Link
                key={cat}
                href={`?tab=browse&category=${encodeURIComponent(cat)}`}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  category === cat
                    ? 'bg-brand-twilight text-brand-sandstone border-brand-twilight'
                    : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-400 bg-brand-dusk/40 border border-slate-800 rounded-3xl">
                <Star className="w-8 h-8 mx-auto text-slate-600 mb-3" />
                <p className="font-medium">No creators found for this category.</p>
                <p className="text-xs mt-1">Check back soon or browse all categories.</p>
              </div>
            ) : (
              listings.map((listing: any) => (
                <div key={listing.id} className="bg-brand-dusk border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={listing.profiles?.avatar_url || '/default-avatar.png'}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover bg-slate-800"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-brand-sandstone">{listing.profiles?.display_name}</h3>
                      <p className="text-[10px] text-slate-400">@{listing.profiles?.username}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {listing.categories?.slice(0, 3).map((c: string) => (
                      <span key={c} className="px-2 py-0.5 rounded-md bg-brand-twilight/50 text-[9px] font-bold uppercase text-brand-sandstone border border-brand-twilight">
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/50 p-2 rounded-xl">
                      <p className="text-[10px] text-slate-400">Min. Budget</p>
                      <p className="font-bold text-yellow-400">${((listing.min_collaboration_budget_cents || 0) / 100).toFixed(0)}</p>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-xl">
                      <p className="text-[10px] text-slate-400">Turnaround</p>
                      <p className="font-bold text-brand-sandstone">{listing.typical_turnaround_days || 7} days</p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-2 pt-2">
                    <Link
                      href={`/profile/${listing.profiles?.username}`}
                      className="block w-full py-2 text-center text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/messages?u=${listing.profiles?.username}&compose=true`}
                      className="block w-full py-2 text-center text-xs font-bold text-slate-900 bg-brand-caribbeanSea hover:bg-emerald-400 rounded-xl transition-colors"
                    >
                      Invite to Collaborate
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Brand Campaigns */}
      {activeTab === 'briefs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-black text-brand-sandstone">Your Campaigns</h2>
            {!user ? (
              <div className="p-8 text-center text-slate-400 bg-brand-dusk/40 border border-slate-800 rounded-3xl">
                <p>Sign in to manage your brand campaigns.</p>
              </div>
            ) : userBriefs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-brand-dusk/40 border border-slate-800 rounded-3xl">
                <Briefcase className="w-8 h-8 mx-auto text-slate-600 mb-3" />
                <p className="font-medium">No campaigns posted yet.</p>
                <p className="text-xs mt-1">Use the form to post your first campaign brief.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userBriefs.map((brief: any) => (
                  <div key={brief.id} className="p-5 border border-slate-800 rounded-3xl bg-brand-dusk flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-brand-sandstone">{brief.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 max-w-lg">{brief.description}</p>
                      <div className="flex flex-wrap gap-4 text-[10px] text-brand-sandstone/60">
                        {brief.budget_range_cents_max && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-emerald-400" />
                            ${(brief.budget_range_cents_max / 100).toFixed(0)} max
                          </span>
                        )}
                        {brief.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            {new Date(brief.deadline).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-brand-sunriseCoral" />
                          {brief.creator_applications?.[0]?.count || 0} applicants
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        brief.status === 'open'
                          ? 'bg-brand-caribbeanSea/10 text-brand-caribbeanSea border border-brand-caribbeanSea/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
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
              {user ? (
                <CreateBriefForm />
              ) : (
                <div className="p-4 bg-slate-900/50 rounded-2xl text-xs text-slate-400 text-center border border-dashed border-slate-700">
                  Sign in to post a campaign brief.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Creator Profile */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <UserCircle className="w-5 h-5 text-brand-sunriseCoral" />
            <h2 className="text-lg font-black text-brand-sandstone">My Creator Marketplace Profile</h2>
          </div>
          {!user ? (
            <div className="p-8 text-center text-slate-400 bg-brand-dusk/40 border border-slate-800 rounded-3xl">
              Sign in to manage your creator profile.
            </div>
          ) : (
            <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6">
              <p className="text-xs text-slate-400 mb-4">
                Complete your profile to appear in brand searches and collaboration opportunities.
              </p>
              <CreatorMarketplaceProfileForm existing={creatorProfile} />
            </div>
          )}
        </div>
      )}

      {/* My Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-brand-sandstone">My Campaign Applications</h2>
          {!user ? (
            <div className="p-8 text-center text-slate-400 bg-brand-dusk/40 border border-slate-800 rounded-3xl">
              Sign in to view your applications.
            </div>
          ) : myApplications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-brand-dusk/40 border border-slate-800 rounded-3xl">
              <p className="font-medium">No applications yet.</p>
              <p className="text-xs mt-1">Browse brand campaigns and apply to ones that match your niche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {myApplications.map((app: any) => (
                <div key={app.id} className="p-5 border border-slate-800 rounded-3xl bg-brand-dusk space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-brand-sandstone text-sm">
                      {app.brand_campaign_briefs?.title || 'Campaign'}
                    </h3>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      app.status === 'accepted'
                        ? 'bg-brand-caribbeanSea/10 text-brand-caribbeanSea border border-brand-caribbeanSea/30'
                        : app.status === 'rejected'
                        ? 'bg-red-900/20 text-red-400 border border-red-800/30'
                        : 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/30'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{app.proposal}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Your rate: <span className="text-yellow-400 font-bold">${(app.rate_cents / 100).toFixed(0)}</span></span>
                    {app.brand_campaign_briefs?.deadline && (
                      <span>Deadline: {new Date(app.brand_campaign_briefs.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
