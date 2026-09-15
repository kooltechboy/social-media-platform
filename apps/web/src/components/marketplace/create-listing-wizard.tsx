'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Sparkles,
  Camera,
  DollarSign,
  Truck,
  MapPin,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Store,
} from 'lucide-react';
import {
  CANONICAL_CARIBBEAN_CATEGORIES,
  PRODUCT_CONDITION_METADATA,
  type ProductCondition,
} from '@caribbean/marketplace';
import { createProductAction } from '../../lib/marketplace/actions';

export default function CreateListingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [productKind, setProductKind] = useState<'physical' | 'digital' | 'service'>('physical');
  const [categorySlug, setCategorySlug] = useState<string>(CANONICAL_CARIBBEAN_CATEGORIES[0].slug);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [condition, setCondition] = useState<ProductCondition>('new');
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [inventoryCount, setInventoryCount] = useState<string>('5');
  const [pickupAvailable, setPickupAvailable] = useState<boolean>(true);
  const [shippingAvailable, setShippingAvailable] = useState<boolean>(true);
  const [locationCity, setLocationCity] = useState<string>('Kingston');
  const [locationCountryIso, setLocationCountryIso] = useState<string>('JAM');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [brand, setBrand] = useState<string>('');

  // AI Assistant Description Generator
  const handleAIAssist = () => {
    if (!title.trim()) {
      setError('Please enter a product title first so the AI assistant can formulate an authentic Caribbean description.');
      return;
    }
    setError(null);
    setDescription(
      `Authentic Caribbean ${title.trim()}. Sourced and inspected for quality, honoring regional island craftsmanship, and backed by TUKUBI 30-day Buyer Protection.`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.set('title', title.trim());
    formData.set('description', description.trim());
    formData.set('price', price.trim());
    formData.set('currency', currency);
    formData.set('productKind', productKind);
    formData.set('inventoryCount', inventoryCount.trim());
    formData.set('condition', condition);
    formData.set('categorySlug', categorySlug);
    formData.set('pickupAvailable', pickupAvailable ? 'true' : 'false');
    formData.set('shippingAvailable', shippingAvailable ? 'true' : 'false');
    formData.set('locationCity', locationCity.trim());
    formData.set('locationCountryIso', locationCountryIso);
    if (mediaUrl.trim()) formData.set('mediaUrl', mediaUrl.trim());
    if (brand.trim()) formData.set('brand', brand.trim());

    startTransition(async () => {
      const res = await createProductAction({ error: null, success: null }, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Product listing created and live in Caribbean catalog!');
        setTimeout(() => {
          if (res.productId) {
            router.push(`/marketplace/${res.productId}`);
          } else {
            router.push('/marketplace/seller-center');
          }
        }, 1500);
      }
    });
  };

  return (
    <div className="surface-card border border-white/15 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl space-y-6">
      {/* Wizard Step Progress */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-black">
            {step}
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {step === 1 && '1. Product Type & Category'}
              {step === 2 && '2. Photos & Media'}
              {step === 3 && '3. Details & Condition'}
              {step === 4 && '4. Pricing & Fulfillment'}
            </h2>
            <p className="text-xs text-brand-sandstone/60">Step {step} of 4</p>
          </div>
        </div>

        {/* AI Listing Assistant Button */}
        <button
          type="button"
          onClick={handleAIAssist}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 hover:brightness-110 shadow-md transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Assist</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Type & Category */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-brand-sandstone/90 mb-2">
                What are you listing?
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'physical', label: 'Physical Good', icon: '📦' },
                  { id: 'digital', label: 'Digital Asset', icon: '🎧' },
                  { id: 'service', label: 'Bookable Service', icon: '🤝' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setProductKind(t.id as any)}
                    className={`p-3.5 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                      productKind === t.id
                        ? 'bg-orange-500/20 border-orange-500 text-white font-black shadow-md'
                        : 'bg-white/5 border-white/10 text-brand-sandstone/70 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sandstone/90 mb-2">
                Category
              </label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full bg-slate-950 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
              >
                {CANONICAL_CARIBBEAN_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* STEP 2: Photos & Media */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-brand-sandstone/90">
                Primary Product Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or uploaded photo link"
                  className="flex-1 bg-slate-950 border border-white/20 rounded-2xl px-4 py-3 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-orange-500"
                />
              </div>
              <p className="text-[11px] text-brand-sandstone/60">
                High resolution JPG, PNG or WebP showcasing your product clearly. (Stored in Supabase product-images bucket).
              </p>
            </div>

            {mediaUrl && (
              <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-white/10 relative flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Details & Condition */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
                Listing Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Handmade Jamaican Cedar Wood Sculpture"
                className="w-full bg-slate-950 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
                className="w-full bg-slate-950 border border-white/20 rounded-2xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
              >
                {Object.entries(PRODUCT_CONDITION_METADATA).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label} — {v.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
                  Brand / Maker (Optional)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Island Craft or Apple"
                  className="w-full bg-slate-950 border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
                  Territory / Island *
                </label>
                <select
                  value={locationCountryIso}
                  onChange={(e) => setLocationCountryIso(e.target.value)}
                  className="w-full bg-slate-950 border border-white/20 rounded-2xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="JAM">🇯🇲 Jamaica</option>
                  <option value="DOM">🇩🇴 Dominican Republic</option>
                  <option value="TTO">🇹🇹 Trinidad &amp; Tobago</option>
                  <option value="HTI">🇭🇹 Haiti</option>
                  <option value="BRB">🇧🇧 Barbados</option>
                  <option value="BHS">🇧🇸 Bahamas</option>
                  <option value="GUY">🇬🇾 Guyana</option>
                  <option value="PRI">🇵🇷 Puerto Rico</option>
                  <option value="LCA">🇱🇨 Saint Lucia</option>
                  <option value="ATG">🇦🇬 Antigua &amp; Barbuda</option>
                  <option value="GRD">🇬🇩 Grenada</option>
                  <option value="BLZ">🇧🇿 Belize</option>
                  <option value="SUR">🇸🇷 Suriname</option>
                  <option value="USA">🗽 Diaspora Hub (US/NY/FL)</option>
                  <option value="GBR">🇬🇧 Diaspora Hub (UK/London)</option>
                  <option value="CAN">🍁 Diaspora Hub (Canada)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
                  Location City
                </label>
                <input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="e.g. Kingston, Santo Domingo"
                  className="w-full bg-slate-950 border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
                Description &amp; Specifications
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe features, dimensions, origins, ingredients, or service deliverables..."
                className="w-full bg-slate-950 border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Pricing & Fulfillment */}
        {step === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="25.00"
                  className="w-full bg-slate-950 border border-white/20 rounded-2xl px-4 py-3 text-lg font-black text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-white/20 rounded-2xl px-3 py-3 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="JMD">JMD (J$)</option>
                  <option value="DOP">DOP (RD$)</option>
                  <option value="TTD">TTD (TT$)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
                Available Stock Count
              </label>
              <input
                type="number"
                min="1"
                value={inventoryCount}
                onChange={(e) => setInventoryCount(e.target.value)}
                placeholder="5"
                className="w-full bg-slate-950 border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="block text-xs font-bold text-brand-sandstone/90">
                Fulfillment Options
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pickupAvailable}
                    onChange={(e) => setPickupAvailable(e.target.checked)}
                    className="accent-orange-500"
                  />
                  <span>Local Island Pickup</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shippingAvailable}
                    onChange={(e) => setShippingAvailable(e.target.checked)}
                    className="accent-orange-500"
                  />
                  <span>Regional Shipping</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="py-2.5 px-4 rounded-xl border border-white/15 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending || !title || !price}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-xl shadow-orange-500/20"
            >
              {isPending ? 'Publishing Listing...' : 'Publish to Caribbean Marketplace'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
