'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Users, Building2, Calendar, LayoutGrid, MessageSquare, ShoppingBag, Loader2, Info, X, ArrowRight } from 'lucide-react';
import type { CaribbeanGeoEntity } from '../../lib/constants/caribbean-geography';

interface TerritoryDiscoveryPanelProps {
  entity: CaribbeanGeoEntity;
  onClose?: () => void;
}

type TabType = 'creators' | 'businesses' | 'products' | 'events' | 'communities' | 'posts';

const TABS = [
  { id: 'creators', label: 'Creators', icon: Users },
  { id: 'businesses', label: 'Businesses', icon: Building2 },
  { id: 'products', label: 'Marketplace', icon: ShoppingBag },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'communities', label: 'Communities', icon: LayoutGrid },
  { id: 'posts', label: 'Posts', icon: MessageSquare },
] as const;

export default function TerritoryDiscoveryPanel({ entity, onClose }: TerritoryDiscoveryPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('creators');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTabContent = async () => {
      setLoading(true);
      setError(null);
      setData([]);

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      try {
        let res;
        switch (activeTab) {
          case 'creators':
            res = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url, bio')
              .eq('origin_country_iso', entity.iso)
              .limit(10);
            break;
          case 'businesses':
            res = await supabase
              .from('businesses')
              .select('id, name, description, logo_url')
              .eq('country_iso', entity.iso)
              .limit(10);
            break;
          case 'products':
            res = await supabase
              .from('products')
              .select('id, title, description, price_minor, currency, condition, marketplace_product_media(media_url)')
              .eq('location_country_iso', entity.iso)
              .eq('is_active', true)
              .limit(10);
            break;
          case 'events':
            res = await supabase
              .from('events')
              .select('id, title, description, starts_at')
              .eq('country_iso', entity.iso)
              .limit(10);
            break;
          case 'communities':
            res = await supabase
              .from('communities')
              .select('id, name, description, avatar_url')
              .eq('country_iso', entity.iso)
              .limit(10);
            break;
          case 'posts':
            res = await supabase
              .from('posts')
              .select('id, content, created_at, countries!inner(iso_code)')
              .eq('countries.iso_code', entity.iso)
              .limit(10);
            break;
        }

        if (res?.error) {
          throw new Error(res.error.message);
        }

        if (isMounted) {
          setData(res?.data || []);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTabContent();
    return () => {
      isMounted = false;
    };
  }, [activeTab, entity.iso]);

  return (
    <div className="bg-brand-dusk/95 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-full overflow-hidden relative">
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral" />
      
      <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4 mt-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{entity.flag}</span>
          <div>
            <h2 className="text-lg font-black text-brand-sandstone">{entity.name} Discovery</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-brand-sandstone/60">Explore local content and trade</p>
              <span className="text-brand-sandstone/40">•</span>
              <Link
                href={`/marketplace?territory=${entity.iso}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 hover:underline"
              >
                <ShoppingBag className="w-3 h-3" />
                Shop Marketplace
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-2 bg-brand-twilight border border-slate-800 rounded-full hover:bg-slate-800 transition-colors text-brand-sandstone/60 hover:text-brand-sandstone"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none mb-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-caribbeanSea text-slate-950 shadow-md'
                  : 'bg-brand-twilight text-brand-sandstone/60 border border-slate-800 hover:text-brand-sandstone'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-brand-sandstone/60 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-brand-caribbeanSea" />
            <p className="text-xs font-medium">Discovering {tabLabel(activeTab).toLowerCase()}...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2">
            <Info className="w-5 h-5" />
            <p className="text-xs text-center">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-brand-sandstone/40 gap-3 py-10">
            <Info className="w-8 h-8 opacity-20" />
            <p className="text-xs font-medium text-center max-w-[200px]">
              No {tabLabel(activeTab).toLowerCase()} discovered in {entity.name} yet.
            </p>
            {activeTab === 'products' && (
              <Link
                href="/marketplace/seller-center/create"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold hover:bg-orange-500/30 transition-all"
              >
                List a product in {entity.name} →
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {data.map((item) => (
              <li key={item.id} className="p-3 bg-brand-twilight border border-slate-800 rounded-2xl flex gap-3">
                {activeTab === 'creators' && (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0 overflow-hidden">
                      {item.avatar_url && <img src={item.avatar_url} alt={item.full_name} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-sandstone">{item.full_name || item.username || 'Anonymous'}</p>
                      {item.bio && <p className="text-xs text-brand-sandstone/60 line-clamp-1">{item.bio}</p>}
                    </div>
                  </>
                )}
                {activeTab === 'businesses' && (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center text-brand-sandstone/40">
                      {item.logo_url ? <img src={item.logo_url} alt={item.name} className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-sandstone">{item.name}</p>
                      {item.description && <p className="text-xs text-brand-sandstone/60 line-clamp-1">{item.description}</p>}
                    </div>
                  </>
                )}
                {activeTab === 'products' && (
                  <Link href={`/marketplace/${item.id}`} className="flex gap-3 w-full hover:opacity-90 transition-opacity">
                    <div className="w-11 h-11 rounded-xl bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center text-brand-sandstone/40 border border-slate-700">
                      {item.marketplace_product_media?.[0]?.media_url ? (
                        <img src={item.marketplace_product_media[0].media_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-orange-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-brand-sandstone truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-black text-orange-400">
                          ${((item.price_minor || 0) / 100).toFixed(2)} {item.currency || 'USD'}
                        </span>
                        {item.condition && (
                          <span className="text-[10px] font-semibold text-brand-sandstone/60 capitalize">
                            • {item.condition.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )}
                {activeTab === 'events' && (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-brand-caribbeanSea/10 shrink-0 flex flex-col items-center justify-center text-brand-caribbeanSea">
                      <span className="text-[9px] uppercase font-black">{new Date(item.starts_at).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-sm font-black leading-none">{new Date(item.starts_at).getDate()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-sandstone line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-brand-sandstone/60 mt-1">{new Date(item.starts_at).toLocaleDateString()}</p>
                    </div>
                  </>
                )}
                {activeTab === 'communities' && (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center text-brand-sandstone/40">
                      {item.avatar_url ? <img src={item.avatar_url} alt={item.name} className="w-full h-full object-cover" /> : <LayoutGrid className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-sandstone">{item.name}</p>
                      {item.description && <p className="text-xs text-brand-sandstone/60 line-clamp-1">{item.description}</p>}
                    </div>
                  </>
                )}
                {activeTab === 'posts' && (
                  <div>
                    <p className="text-xs text-brand-sandstone line-clamp-3">{item.content}</p>
                    <p className="text-[10px] text-brand-sandstone/50 mt-1.5">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function tabLabel(id: TabType) {
  return TABS.find((t) => t.id === id)?.label || id;
}
