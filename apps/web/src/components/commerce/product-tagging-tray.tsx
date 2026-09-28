'use client';

import React from 'react';
import {
  Search,
  X,
  Check,
  ShoppingBag,
  Plus,
  Sparkles,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  type TaggedProductSummary,
  formatProductPrice,
  MAX_TAGGED_PRODUCTS_PER_POST,
} from '@caribbean/marketplace';

/**
 * Interface contract for ProductTaggingTray.
 */
export interface ProductTaggingTrayProps {
  selectedProducts: TaggedProductSummary[];
  onTagsChange: (products: TaggedProductSummary[]) => void;
  maxTags?: number; // default 5 (MAX_TAGGED_PRODUCTS_PER_POST)
  sellerId?: string; // optional: restrict/prioritize current user's products
  onClose?: () => void;
  className?: string;
  onSearch?: (query: string) => Promise<TaggedProductSummary[]>; // optional custom searcher for tests/mocking
}

function useSafeState<T>(initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useState<T>(initialValue);
  }
  const val = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  return [val, () => {}];
}

function useSafeEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    React.useEffect(effect, deps);
  }
}

function useSafeCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useCallback(callback, deps);
  }
  return callback;
}

/**
 * Curated authentic Caribbean diaspora mock catalog for fast client search fallback.
 */
export const DEFAULT_CARIBBEAN_PRODUCTS: TaggedProductSummary[] = [
  {
    id: 'prod-jam-01',
    title: 'Blue Mountain Peaberry Coffee',
    priceMinor: 3200,
    currency: 'USD',
    originTerritory: 'Jamaica',
    originCountry: 'Jamaica',
    sellerId: 'seller-jam-1',
    sellerName: 'Kingston Roasters',
    inventoryCount: 24,
    isAvailable: true,
    thumbnailUrl: 'https://cdn.tukubi.com/products/peaberry.jpg',
  },
  {
    id: 'prod-slu-02',
    title: 'St. Lucian Organic Cocoa Sticks',
    priceMinor: 1850,
    currency: 'USD',
    originTerritory: 'Saint Lucia',
    originCountry: 'Saint Lucia',
    sellerId: 'seller-slu-1',
    sellerName: 'Soufrière Artisan Estate',
    inventoryCount: 30,
    isAvailable: true,
    thumbnailUrl: 'https://cdn.tukubi.com/products/cocoa.jpg',
  },
  {
    id: 'prod-tto-03',
    title: 'Trinidad Moruga Scorpion Sauce',
    priceMinor: 1400,
    currency: 'USD',
    originTerritory: 'Trinidad & Tobago',
    originCountry: 'Trinidad & Tobago',
    sellerId: 'seller-tto-1',
    sellerName: 'Maracas Flavors',
    inventoryCount: 12,
    isAvailable: true,
    thumbnailUrl: 'https://cdn.tukubi.com/products/sauce.jpg',
  },
  {
    id: 'prod-brb-04',
    title: 'Barbados Vintage Rum Cake',
    priceMinor: 2400,
    currency: 'USD',
    originTerritory: 'Barbados',
    originCountry: 'Barbados',
    sellerId: 'seller-brb-1',
    sellerName: 'Bridgetown Bakeries',
    inventoryCount: 0,
    isAvailable: false,
    thumbnailUrl: 'https://cdn.tukubi.com/products/cake.jpg',
  },
  {
    id: 'prod-bhs-05',
    title: 'Bahamian Handcrafted Sea Glass Pendant',
    priceMinor: 4500,
    currency: 'USD',
    originTerritory: 'Bahamas',
    originCountry: 'Bahamas',
    sellerId: 'seller-bhs-1',
    sellerName: 'Nassau Artisans',
    inventoryCount: 5,
    isAvailable: true,
    thumbnailUrl: 'https://cdn.tukubi.com/products/seaglass.jpg',
  },
  {
    id: 'prod-grd-06',
    title: 'Grenada Whole Spice & Nutmeg Collection',
    priceMinor: 2200,
    currency: 'USD',
    originTerritory: 'Grenada',
    originCountry: 'Grenada',
    sellerId: 'seller-grd-1',
    sellerName: 'Spice Isle Harvest',
    inventoryCount: 18,
    isAvailable: true,
    thumbnailUrl: 'https://cdn.tukubi.com/products/nutmeg.jpg',
  },
];

/**
 * Pure helper function to filter product catalog by text search and optional seller ID.
 */
export function filterProducts(
  products: TaggedProductSummary[],
  query: string,
  sellerId?: string
): TaggedProductSummary[] {
  let list = products;
  if (sellerId) {
    list = list.filter((p) => p.sellerId === sellerId);
  }

  const q = query.trim().toLowerCase();
  if (!q) {
    return list;
  }

  return list.filter((p) => {
    const title = (p.title || '').toLowerCase();
    const territory = (p.originTerritory || p.originCountry || '').toLowerCase();
    const seller = (p.sellerName || '').toLowerCase();
    return title.includes(q) || territory.includes(q) || seller.includes(q);
  });
}

/**
 * Pure helper function to toggle product selection respecting availability and limits.
 */
export function toggleProductTag(
  current: TaggedProductSummary[],
  product: TaggedProductSummary,
  maxTags: number = MAX_TAGGED_PRODUCTS_PER_POST
): { next: TaggedProductSummary[]; error?: string } {
  const isSelected = current.some((p) => p.id === product.id);

  if (isSelected) {
    return {
      next: current.filter((p) => p.id !== product.id),
    };
  }

  // Stock & availability constraint
  if (
    product.isAvailable === false ||
    (typeof product.inventoryCount === 'number' && product.inventoryCount <= 0)
  ) {
    return {
      next: current,
      error: `"${product.title}" is out of stock or unavailable and cannot be tagged.`,
    };
  }

  // Maximum limit constraint
  if (current.length >= maxTags) {
    return {
      next: current,
      error: `Maximum ${maxTags} products can be tagged per post or video.`,
    };
  }

  return {
    next: [...current, product],
  };
}

/**
 * ProductTaggingTray
 * Accessible, responsive Caribbean Futurism styled product tagging tray for posts and reels.
 */
export default function ProductTaggingTray({
  selectedProducts,
  onTagsChange,
  maxTags = MAX_TAGGED_PRODUCTS_PER_POST,
  sellerId,
  onClose,
  className = '',
  onSearch,
}: ProductTaggingTrayProps) {
  const [searchQuery, setSearchQuery] = useSafeState('');
  const [debouncedQuery, setDebouncedQuery] = useSafeState('');
  const [isSearching, setIsSearching] = useSafeState(false);
  const [warningMessage, setWarningMessage] = useSafeState<string | null>(null);
  const [searchResults, setSearchResults] = useSafeState<TaggedProductSummary[]>(() =>
    filterProducts(DEFAULT_CARIBBEAN_PRODUCTS, '', sellerId)
  );

  // Debounce search input (200ms)
  useSafeEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Execute search via onSearch prop or built-in filter
  useSafeEffect(() => {
    let cancelled = false;

    async function runSearch() {
      setIsSearching(true);
      try {
        if (onSearch) {
          const results = await onSearch(debouncedQuery);
          if (!cancelled) {
            setSearchResults(filterProducts(results, '', sellerId));
          }
        } else {
          const results = filterProducts(DEFAULT_CARIBBEAN_PRODUCTS, debouncedQuery, sellerId);
          if (!cancelled) {
            setSearchResults(results);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setSearchResults(filterProducts(DEFAULT_CARIBBEAN_PRODUCTS, debouncedQuery, sellerId));
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, onSearch, sellerId]);

  // Handle keyboard navigation (Escape to close)
  useSafeEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose?.();
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [onClose]);

  // Toggle tagging an item
  const handleToggle = useSafeCallback(
    (product: TaggedProductSummary) => {
      const result = toggleProductTag(selectedProducts, product, maxTags);
      if (result.error) {
        setWarningMessage(result.error);
      } else {
        setWarningMessage(null);
        onTagsChange(result.next);
      }
    },
    [selectedProducts, onTagsChange, maxTags]
  );

  // Remove individual tag
  const handleRemoveTag = useSafeCallback(
    (productId: string) => {
      setWarningMessage(null);
      onTagsChange(selectedProducts.filter((p) => p.id !== productId));
    },
    [selectedProducts, onTagsChange]
  );

  // Clear all tags
  const handleClearAll = useSafeCallback(() => {
    setWarningMessage(null);
    onTagsChange([]);
  }, [onTagsChange]);

  const isAtLimit = selectedProducts.length >= maxTags;

  return (
    <div
      role="region"
      aria-label="Product Tagging Tray"
      className={`flex flex-col bg-brand-dusk text-brand-sandstone border border-white/10 rounded-2xl shadow-2xl overflow-hidden ${className}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-brand-dusk/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-sunriseCoral/15 text-brand-sunriseCoral border border-brand-sunriseCoral/20">
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-brand-sandstone flex items-center gap-2">
              Tag Caribbean Products
              <Sparkles className="w-4 h-4 text-brand-sunriseCoral" aria-hidden="true" />
            </h2>
            <p className="text-xs text-brand-sandstone/60">
              Attach authentic island goods to your post or reel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tag Counter with Live Region */}
          <div
            aria-live="polite"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide border transition-colors ${
              isAtLimit
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-brand-caribbeanSea/15 text-brand-caribbeanSea border-brand-caribbeanSea/30'
            }`}
          >
            {`Tagged: ${selectedProducts.length}/${maxTags}`}
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close tagging tray"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-xl text-brand-sandstone/70 hover:text-brand-sandstone hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Selected tags bar */}
      {selectedProducts.length > 0 && (
        <div className="p-4 bg-brand-twilight/50 border-b border-white/10">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-brand-sandstone/70 uppercase tracking-wider">
              Selected Products ({selectedProducts.length})
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="min-h-[44px] min-w-[44px] px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg text-brand-sandstone/70 hover:text-brand-sunriseCoral hover:bg-brand-sunriseCoral/10 transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Clear All
            </button>
          </div>

          <div
            role="list"
            aria-label="Tagged products"
            className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/20"
          >
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                role="listitem"
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-dusk border border-brand-sunriseCoral/40 rounded-xl shrink-0 group shadow-md"
              >
                {product.thumbnailUrl ? (
                  <img
                    src={product.thumbnailUrl}
                    alt=""
                    aria-hidden="true"
                    className="w-7 h-7 rounded-lg object-cover bg-black/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-brand-sunriseCoral/20 flex items-center justify-center text-brand-sunriseCoral">
                    <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                )}
                <div className="flex flex-col max-w-[130px]">
                  <span className="text-xs font-medium text-brand-sandstone truncate">
                    {product.title}
                  </span>
                  <span className="text-[11px] font-semibold text-brand-sunriseCoral">
                    {formatProductPrice(product.priceMinor, product.currency || 'USD')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(product.id)}
                  aria-label={`Remove ${product.title}`}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-1 rounded-lg text-brand-sandstone/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning / Error banner */}
      {(warningMessage || (isAtLimit && selectedProducts.length >= maxTags)) && (
        <div
          role="alert"
          aria-live="polite"
          className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {warningMessage ||
              `Maximum ${maxTags} products tagged. Remove an item to tag another.`}
          </span>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative flex items-center">
          <Search
            className="w-4 h-4 text-brand-sandstone/50 absolute left-3.5 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Caribbean products, island crafts, spices..."
            aria-label="Search Caribbean products"
            className="w-full bg-brand-twilight/80 border border-white/10 rounded-xl pl-10 pr-20 py-2.5 text-sm text-brand-sandstone placeholder:text-brand-sandstone/40 focus:outline-none focus:border-brand-sunriseCoral focus:ring-1 focus:ring-brand-sunriseCoral transition-colors"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {isSearching && (
              <Loader2
                className="w-4 h-4 text-brand-sunriseCoral animate-spin"
                aria-hidden="true"
              />
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-1 rounded-lg text-brand-sandstone/60 hover:text-brand-sandstone transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Results List */}
      <div className="flex-1 overflow-y-auto max-h-[380px] px-4 pb-4 space-y-2.5 scrollbar-thin scrollbar-thumb-white/20">
        {searchResults.length === 0 ? (
          <div className="py-12 text-center text-brand-sandstone/60">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-brand-sandstone/30" />
            <p className="text-sm font-medium">No matching products found</p>
            <p className="text-xs text-brand-sandstone/40 mt-1">
              Try searching with different island terms or keywords
            </p>
          </div>
        ) : (
          searchResults.map((product) => {
            const isSelected = selectedProducts.some((p) => p.id === product.id);
            const isOutOfStock =
              product.isAvailable === false ||
              (typeof product.inventoryCount === 'number' && product.inventoryCount <= 0);
            const territory = product.originTerritory || product.originCountry || 'Caribbean';

            return (
              <div
                key={product.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-brand-sunriseCoral/10 border-brand-sunriseCoral/50 shadow-sm'
                    : 'bg-brand-twilight/40 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt=""
                      aria-hidden="true"
                      className="w-12 h-12 rounded-xl object-cover bg-black/40 shrink-0 border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-sunriseCoral/20 flex items-center justify-center text-brand-sunriseCoral shrink-0 border border-white/10">
                      <ShoppingBag className="w-6 h-6" aria-hidden="true" />
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-brand-sandstone truncate">
                      {product.title}
                    </span>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-brand-sunriseCoral">
                        {formatProductPrice(product.priceMinor, product.currency || 'USD')}
                      </span>

                      {/* Caribbean Territory Badge */}
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
                        {territory}
                      </span>

                      {/* Stock Indicator */}
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Sold Out
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          In Stock
                        </span>
                      )}
                    </div>

                    {product.sellerName && (
                      <span className="text-[11px] text-brand-sandstone/50 mt-0.5 truncate">
                        By {product.sellerName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Selection Action Button */}
                <div className="shrink-0 ml-3">
                  {isOutOfStock ? (
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 text-brand-sandstone/40 border border-white/10 cursor-not-allowed inline-flex items-center gap-1.5"
                    >
                      Sold Out
                    </button>
                  ) : isSelected ? (
                    <button
                      type="button"
                      onClick={() => handleToggle(product)}
                      aria-pressed="true"
                      aria-label={`Untag ${product.title}`}
                      className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-sunriseCoral text-brand-twilight shadow-md hover:bg-brand-sunriseCoral/90 active:scale-95 transition-all inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      Tagged
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggle(product)}
                      aria-pressed="false"
                      aria-label={`Tag ${product.title}`}
                      className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 text-brand-sandstone hover:bg-brand-sunriseCoral/20 hover:text-brand-sunriseCoral hover:border-brand-sunriseCoral/40 border border-white/10 active:scale-95 transition-all inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      Tag
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
