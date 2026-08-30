'use client';

import React, { useState, useTransition } from 'react';
import { Plus, X, Package, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { createProductAction, type MarketplaceActionState } from '../../lib/marketplace/actions';
import { SUPPORTED_CURRENCIES } from '@caribbean/creator';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}

export default function CreateProductModal({
  isOpen,
  onClose,
  isAuthenticated,
}: CreateProductModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [productKind, setProductKind] = useState<'physical' | 'digital' | 'service'>('physical');
  const [inventoryCount, setInventoryCount] = useState('10');

  const [state, setState] = useState<MarketplaceActionState>({ error: null, success: null });
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set('title', title);
    formData.set('description', description);
    formData.set('price', price);
    formData.set('currency', currency);
    formData.set('productKind', productKind);
    formData.set('inventoryCount', inventoryCount);

    startTransition(async () => {
      const res = await createProductAction({ error: null, success: null }, formData);
      setState(res);
      if (!res.error) {
        setTimeout(() => {
          onClose();
          setState({ error: null, success: null });
          setTitle('');
          setDescription('');
          setPrice('');
        }, 1800);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Add Product or Service</h3>
            <p className="text-xs text-brand-sandstone/60">
              Build your Caribbean store inventory ahead of marketplace commerce launch
            </p>
          </div>
        </div>

        {state.success ? (
          <div className="py-8 text-center space-y-3 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-black text-white">Item Listed Successfully!</h4>
            <p className="text-xs text-slate-300">
              Your listing is now active in the TUKUBI Caribbean catalog.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 block">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Blue Mountain Roast Coffee (16oz)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 block">Description</label>
              <textarea
                rows={3}
                placeholder="Describe your authentic Caribbean product, materials, or service scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Type</label>
                <select
                  value={productKind}
                  onChange={(e) => setProductKind(e.target.value as 'physical' | 'digital' | 'service')}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="physical">Physical Product</option>
                  <option value="digital">Digital Asset / Audio</option>
                  <option value="service">Bookable Service</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Inventory</label>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={inventoryCount}
                  onChange={(e) => setInventoryCount(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  required
                  placeholder="25.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {SUPPORTED_CURRENCIES.map((cur) => (
                    <option key={cur} value={cur}>
                      {cur}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {state.error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-orange-500 to-brand-goldenHour hover:from-orange-400 hover:to-brand-goldenHour text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing Item...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Publish Listing to Marketplace
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
