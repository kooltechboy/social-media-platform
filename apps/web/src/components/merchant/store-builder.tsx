'use client';

import React, { useState, useTransition } from 'react';
import {
  DEFAULT_STOREFRONT_SECTIONS,
  SELLER_TYPE_REGISTRY,
  type SellerType,
  type StorefrontSection,
} from '@caribbean/marketplace';
import {
  Layout,
  Eye,
  Check,
  MoveUp,
  MoveDown,
  Sparkles,
  Save,
  Loader2,
  Store,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

interface StoreBuilderProps {
  sellerId: string;
  storeSlug: string;
  initialSections?: StorefrontSection[];
  initialSellerType?: SellerType;
  initialHeadline?: string;
}

export default function StoreBuilder({
  sellerId,
  storeSlug,
  initialSections,
  initialSellerType = 'merchant',
  initialHeadline = 'Authentic Caribbean Storefront',
}: StoreBuilderProps) {
  const [sellerType, setSellerType] = useState<SellerType>(initialSellerType);
  const [headline, setHeadline] = useState(initialHeadline);
  const [sections, setSections] = useState<StorefrontSection[]>(
    initialSections && initialSections.length > 0 ? initialSections : DEFAULT_STOREFRONT_SECTIONS
  );
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);

  function handleToggleSection(id: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s))
    );
  }

  function handleMoveSection(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate displayOrder
    const reordered = updated.map((s, idx) => ({ ...s, displayOrder: idx + 1 }));
    setSections(reordered);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        // Save store configuration
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        await supabase.from('storefront_configs').upsert({
          seller_id: sellerId,
          seller_type: sellerType,
          headline,
          sections,
          is_published: true,
          updated_at: new Date().toISOString(),
        });

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } catch {
        // Handled
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-brand-dusk border border-slate-800">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-orange-400" /> Storefront Builder &amp; Section Layout
          </h2>
          <p className="text-xs text-brand-sandstone/60 mt-0.5">
            Configure your bespoke TUKUBI store sections, merchandising rails, and seller identity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/store/${storeSlug}`}
            target="_blank"
            className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> View Live Store
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-brand-goldenHour hover:from-orange-400 hover:to-brand-goldenHour text-slate-950 font-black text-xs transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" /> Saved!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Seller Type & Identity Selection */}
      <div className="p-6 rounded-3xl bg-brand-dusk border border-slate-800 space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-sandstone/60">
          1. Store Identity &amp; Classification
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(SELLER_TYPE_REGISTRY) as SellerType[]).map((typeKey) => {
            const info = SELLER_TYPE_REGISTRY[typeKey];
            const isSelected = sellerType === typeKey;
            return (
              <div
                key={typeKey}
                onClick={() => setSellerType(typeKey)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'bg-slate-800 border-orange-500 text-white shadow-md ring-1 ring-orange-500/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{info.title}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {info.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="pt-2 space-y-1">
          <label className="text-xs font-bold text-slate-300 block">Store Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Handmade Caribbean Jewelry & Artisanal Goods"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Modular Section Layout Blocks */}
      <div className="p-6 rounded-3xl bg-brand-dusk border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-sandstone/60">
            2. Modular Section Blocks &amp; Ordering
          </h3>
          <span className="text-[11px] text-slate-400">Drag or reorder blocks to organize storefront</span>
        </div>

        <div className="space-y-2.5">
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                section.isVisible
                  ? 'bg-slate-900/80 border-slate-800 text-white'
                  : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-[11px] font-bold flex items-center justify-center text-slate-400">
                  {idx + 1}
                </span>
                <div>
                  <div className="text-xs font-bold flex items-center gap-2">
                    <span>{section.title || section.type}</span>
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {section.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">{section.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMoveSection(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveSection(idx, 'down')}
                  disabled={idx === sections.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                >
                  <MoveDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSection(section.id)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                    section.isVisible
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {section.isVisible ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
