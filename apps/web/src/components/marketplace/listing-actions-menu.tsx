'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MoreVertical,
  Edit2,
  PauseCircle,
  PlayCircle,
  CheckCircle,
  Trash2,
  ExternalLink,
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  updateProductListingAction,
  toggleProductStatusAction,
  deleteProductListingAction,
} from '../../lib/marketplace/actions';

interface ProductItem {
  id: string;
  title: string;
  price_minor: number;
  currency: string;
  inventory_count: number | null;
  is_active: boolean;
  status?: string;
}

interface ListingActionsMenuProps {
  product: ProductItem;
}

export default function ListingActionsMenu({ product }: ListingActionsMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edit form state
  const [title, setTitle] = useState(product.title);
  const [priceMajor, setPriceMajor] = useState((product.price_minor / 100).toFixed(2));
  const [inventoryCount, setInventoryCount] = useState(
    product.inventory_count !== null ? String(product.inventory_count) : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Status & Delete loading
  const [isBusy, setIsBusy] = useState(false);

  const effectiveStatus = product.status || (product.is_active ? 'active' : 'paused');

  const handleToggleStatus = async (newStatus: 'active' | 'paused' | 'sold') => {
    setIsBusy(true);
    setIsOpen(false);
    try {
      const res = await toggleProductStatusAction(product.id, newStatus);
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch {
      alert('Failed to update product status.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    setIsOpen(false);
    if (!window.confirm(`Are you sure you want to permanently delete "${product.title}"? This cannot be undone.`)) {
      return;
    }

    setIsBusy(true);
    try {
      const res = await deleteProductListingAction(product.id);
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch {
      alert('Failed to delete listing.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const numericPrice = parseFloat(priceMajor);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setSaveError('Please enter a valid positive price.');
      setIsSaving(false);
      return;
    }

    const priceMinor = Math.round(numericPrice * 100);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('priceMinor', String(priceMinor));
    formData.append('inventoryCount', inventoryCount);

    try {
      const res = await updateProductListingAction(product.id, formData);
      if (res.error) {
        setSaveError(res.error);
      } else {
        setIsEditOpen(false);
        router.refresh();
      }
    } catch {
      setSaveError('An unexpected error occurred while updating.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center justify-end gap-2">
        <Link
          href={`/marketplace/${product.id}`}
          className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-bold text-xs"
        >
          <span>View</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className="p-1 rounded-lg hover:bg-white/10 text-brand-sandstone/70 hover:text-white transition-colors cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-7 z-40 w-44 rounded-2xl bg-brand-dusk border border-slate-700 p-1.5 shadow-2xl space-y-1 animate-fadeIn text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsEditOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-brand-sandstone hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-brand-caribbeanSea" />
              <span>Edit Listing</span>
            </button>

            {effectiveStatus === 'active' ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleToggleStatus('paused')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Pause Listing</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleToggleStatus('active')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Resume Listing</span>
              </button>
            )}

            {effectiveStatus !== 'sold' && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleToggleStatus('sold')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark as Sold</span>
              </button>
            )}

            <div className="border-t border-slate-800 my-1" />

            <button
              type="button"
              disabled={isBusy}
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </>
      )}

      {/* Edit Listing Modal */}
      {isEditOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-listing-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
        >
          <div className="w-full max-w-md bg-brand-dusk border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 id="edit-listing-title" className="text-base font-black text-white">
                Edit Product Listing
              </h2>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {saveError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Price ({product.currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    value={priceMajor}
                    onChange={(e) => setPriceMajor(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Inventory Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inventoryCount}
                    onChange={(e) => setInventoryCount(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-orange-500/20"
                >
                  {isSaving ? 'Saving...' : 'Save Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
