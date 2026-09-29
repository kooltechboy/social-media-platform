'use client';

import React from 'react';
import {
  Store,
  Palette,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  Globe,
  DollarSign,
  Mail,
  Truck,
  Check,
  Eye,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import {
  SELLER_TYPE_REGISTRY,
  type SellerType,
} from '@caribbean/marketplace';
import type { StorefrontConfig } from '../../lib/commerce/types';
import { createOrUpdateStorefrontAction } from '../../lib/commerce/actions';

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

  if (dispatcher && typeof React.useEffect === 'function') {
    React.useEffect(effect, deps);
  }
}

/**
 * Caribbean Futurism Signature Color Swatches
 */
export const CARIBBEAN_FUTURISM_SWATCHES = [
  {
    name: 'Sunset Coral',
    value: '#FF6B4A',
    description: 'Vibrant island sunrise warmth',
  },
  {
    name: 'Golden Hour',
    value: '#F59E0B',
    description: 'Warm Caribbean afternoon glow',
  },
  {
    name: 'Caribbean Sea',
    value: '#06B6D4',
    description: 'Tropical crystalline coastal blues',
  },
  {
    name: 'Twilight',
    value: '#8B5CF6',
    description: 'Luminous Caribbean evening purple',
  },
] as const;

/**
 * Core Caribbean Trading Currencies
 */
export const CARIBBEAN_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$' },
  { code: 'TTD', name: 'Trinidad & Tobago Dollar', symbol: 'TT$' },
  { code: 'XCD', name: 'East Caribbean Dollar', symbol: 'EC$' },
  { code: 'BBD', name: 'Barbados Dollar', symbol: 'Bds$' },
] as const;

/**
 * Canonical Caribbean territories for merchant regional alignment.
 */
export const CARIBBEAN_TERRITORIES = [
  { iso: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
  { iso: 'TTO', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { iso: 'BRB', name: 'Barbados', flag: '🇧🇧' },
  { iso: 'BHS', name: 'The Bahamas', flag: '🇧🇸' },
  { iso: 'LCA', name: 'Saint Lucia', flag: '🇱🇨' },
  { iso: 'ATG', name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { iso: 'DMA', name: 'Dominica', flag: '🇩🇲' },
  { iso: 'GRD', name: 'Grenada', flag: '🇬🇩' },
  { iso: 'KNA', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { iso: 'VCT', name: 'Saint Vincent & Grenadines', flag: '🇻🇨' },
  { iso: 'GUY', name: 'Guyana', flag: '🇬🇾' },
  { iso: 'SUR', name: 'Suriname', flag: '🇸🇷' },
  { iso: 'BLZ', name: 'Belize', flag: '🇧🇿' },
  { iso: 'CYM', name: 'Cayman Islands', flag: '🇰🇾' },
  { iso: 'DOM', name: 'Dominican Republic', flag: '🇩🇴' },
  { iso: 'HTI', name: 'Haiti', flag: '🇭🇹' },
  { iso: 'PRI', name: 'Puerto Rico', flag: '🇵🇷' },
  { iso: 'ABW', name: 'Aruba', flag: '🇦🇼' },
  { iso: 'CUW', name: 'Curaçao', flag: '🇨🇼' },
  { iso: 'SXM', name: 'Sint Maarten', flag: '🇸🇽' },
  { iso: 'BMU', name: 'Bermuda', flag: '🇧🇲' },
  { iso: 'VGB', name: 'British Virgin Islands', flag: '🇻🇬' },
  { iso: 'VIR', name: 'U.S. Virgin Islands', flag: '🇻🇮' },
  { iso: 'AIA', name: 'Anguilla', flag: '🇦🇮' },
  { iso: 'MSR', name: 'Montserrat', flag: '🇲🇸' },
  { iso: 'TCA', name: 'Turks & Caicos Islands', flag: '🇹🇨' },
] as const;

export interface StoreCreationWizardProps {
  initialConfig?: Partial<StorefrontConfig> | null;
  onSuccess?: (config: StorefrontConfig) => void;
  onCancel?: () => void;
  className?: string;
}

export default function StoreCreationWizard({
  initialConfig,
  onSuccess,
  onCancel,
  className = '',
}: StoreCreationWizardProps) {
  // Wizard state
  const [currentStep, setCurrentStep] = useSafeState<number>(1);
  const [headline, setHeadline] = useSafeState<string>(initialConfig?.headline || '');
  const [sellerType, setSellerType] = useSafeState<SellerType>(initialConfig?.sellerType || 'merchant');
  const [countryIso, setCountryIso] = useSafeState<string>(
    initialConfig?.countryIso || (initialConfig as any)?.policies?.countryIso || 'JAM'
  );
  const [currency, setCurrency] = useSafeState<string>(initialConfig?.currency || 'USD');

  // Step 2 Branding
  const [heroImageUrl, setHeroImageUrl] = useSafeState<string>(initialConfig?.heroImageUrl || '');
  const [brandColor, setBrandColor] = useSafeState<string>(initialConfig?.brandColor || '#FF6B4A');

  // Step 3 Trust & Policies
  const [shippingPolicy, setShippingPolicy] = useSafeState<string>(
    initialConfig?.shippingPolicy ||
      'Standard Caribbean inter-island express delivery in 3-5 business days. Local courier dispatch with tracked dispatch.'
  );
  const [returnPolicy, setReturnPolicy] = useSafeState<string>(
    initialConfig?.returnPolicy ||
      'Protected by TUKUBI 30-Day Escrow Guarantee. 100% full refund on items not received or significantly not as described.'
  );
  const [supportEmail, setSupportEmail] = useSafeState<string>(
    initialConfig?.supportEmail || ''
  );

  // Step 4 Review & Publish
  const [isPublished, setIsPublished] = useSafeState<boolean>(
    initialConfig?.isPublished !== undefined ? initialConfig.isPublished : true
  );

  const [isPending, setIsPending] = useSafeState<boolean>(false);
  const [errorMessage, setErrorMessage] = useSafeState<string | null>(null);
  const [successMessage, setSuccessMessage] = useSafeState<string | null>(null);

  const steps = [
    { number: 1, label: 'Store Basics', icon: Store },
    { number: 2, label: 'Branding', icon: Palette },
    { number: 3, label: 'Trust & Policies', icon: ShieldCheck },
    { number: 4, label: 'Review & Publish', icon: CheckCircle2 },
  ];

  // Step validation
  const validateStep = (step: number): boolean => {
    setErrorMessage(null);
    if (step === 1) {
      if (!headline.trim()) {
        setErrorMessage('Please enter a storefront title or headline.');
        return false;
      }
      if (!sellerType || !SELLER_TYPE_REGISTRY[sellerType]) {
        setErrorMessage('Please select a valid Caribbean seller category.');
        return false;
      }
      if (!countryIso) {
        setErrorMessage('Please select your Caribbean home territory.');
        return false;
      }
      if (!currency) {
        setErrorMessage('Please select your store operational currency.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!brandColor) {
        setErrorMessage('Please pick a brand accent color swatch.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!supportEmail.trim() || !supportEmail.includes('@')) {
        setErrorMessage('Please enter a valid customer support email for buyer inquiries.');
        return false;
      }
      if (!shippingPolicy.trim()) {
        setErrorMessage('Please provide your Caribbean shipping and fulfillment policy.');
        return false;
      }
      if (!returnPolicy.trim()) {
        setErrorMessage('Please specify your dispute and return terms.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Keyboard accessibility: Escape triggers onCancel if provided
  useSafeEffect(() => {
    if (!onCancel) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await createOrUpdateStorefrontAction({
        headline,
        sellerType,
        countryIso,
        currency,
        heroImageUrl: heroImageUrl.trim() || undefined,
        brandColor,
        shippingPolicy,
        returnPolicy,
        supportEmail,
        isPublished,
      });

      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'Failed to save storefront configuration.');
      } else {
        setSuccessMessage('Storefront configured successfully!');
        if (onSuccess) {
          onSuccess(res.data);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected network error.');
    } finally {
      setIsPending(false);
    }
  };

  const selectedCountry = CARIBBEAN_TERRITORIES.find((t) => t.iso === countryIso);
  const selectedSellerInfo = SELLER_TYPE_REGISTRY[sellerType] || SELLER_TYPE_REGISTRY.merchant;

  return (
    <div
      role="region"
      aria-label="TUKUBI Store Creation Wizard"
      className={`bg-brand-dusk border border-slate-800 rounded-3xl p-4 sm:p-6 md:p-8 max-w-4xl mx-auto shadow-2xl space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-sunriseCoral to-brand-goldenHour text-slate-950 font-black flex items-center justify-center shadow-lg shadow-brand-sunriseCoral/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Store Creation &amp; Management Wizard
              </h1>
              <p className="text-xs text-brand-sandstone/70">
                Launch your verified Caribbean storefront with built-in TUKUBI 30-Day Escrow Protection
              </p>
            </div>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progressive Step Indicator */}
      <nav
        role="tablist"
        aria-label="Store Creation Progress"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2 rounded-2xl bg-slate-950/60 border border-slate-800/80"
      >
        {steps.map((s) => {
          const StepIcon = s.icon;
          const isActive = currentStep === s.number;
          const isDone = currentStep > s.number;

          return (
            <button
              key={s.number}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'step' : undefined}
              onClick={() => {
                if (isDone || validateStep(currentStep)) {
                  setCurrentStep(s.number);
                }
              }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all min-h-[44px] cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-brand-sunriseCoral/20 to-brand-goldenHour/20 border border-brand-sunriseCoral/40 text-brand-sunriseCoral font-black shadow-sm'
                  : isDone
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
                  isActive
                    ? 'bg-brand-sunriseCoral text-slate-950'
                    : isDone
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase tracking-wider block opacity-70">
                  Step {s.number}
                </span>
                <span className="text-xs truncate block font-bold">{s.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Error / Success Feedback Alerts */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="pt-2">
        {/* STEP 1: Store Basics */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-brand-sunriseCoral" /> Basic Information &amp; Classification
              </h2>
              <p className="text-xs text-brand-sandstone/70 mt-1">
                Define your public store title, Caribbean commercial identity, and local operating currency.
              </p>
            </div>

            {/* Headline / Title */}
            <div className="space-y-1.5">
              <label htmlFor="store-headline" className="block text-xs font-black text-slate-200">
                Storefront Headline &amp; Title <span className="text-rose-400">*</span>
              </label>
              <input
                id="store-headline"
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Kingston Spices &amp; Blue Mountain Roasts"
                className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-sunriseCoral focus:ring-1 focus:ring-brand-sunriseCoral transition-colors"
              />
            </div>

            {/* Seller Type Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-200">
                Caribbean Seller Category <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(SELLER_TYPE_REGISTRY) as SellerType[]).map((key) => {
                  const info = SELLER_TYPE_REGISTRY[key];
                  const isSelected = sellerType === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSellerType(key)}
                      className={`p-3.5 rounded-2xl text-left border transition-all min-h-[44px] flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-brand-sunriseCoral/10 border-brand-sunriseCoral text-white ring-1 ring-brand-sunriseCoral'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-white">{info.title}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-sunriseCoral" />}
                        </div>
                        <p className="text-[11px] text-brand-sandstone/60 mt-1 line-clamp-2">
                          {info.description}
                        </p>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/60">
                        {info.supportsPhysical && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Physical
                          </span>
                        )}
                        {info.supportsDigital && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Digital
                          </span>
                        )}
                        {info.supportsServices && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Services
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Country and Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="store-country" className="block text-xs font-black text-slate-200">
                  Caribbean Territory / Island <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    id="store-country"
                    value={countryIso}
                    onChange={(e) => setCountryIso(e.target.value)}
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-sunriseCoral cursor-pointer appearance-none pr-10"
                  >
                    {CARIBBEAN_TERRITORIES.map((t) => (
                      <option key={t.iso} value={t.iso} className="bg-slate-900 text-white">
                        {t.flag} {t.name} ({t.iso})
                      </option>
                    ))}
                  </select>
                  <Globe className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="store-currency" className="block text-xs font-black text-slate-200">
                  Operational Currency <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    id="store-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-sunriseCoral cursor-pointer appearance-none pr-10"
                  >
                    {CARIBBEAN_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                        {c.code} — {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                  <DollarSign className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Branding & Aesthetics */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-brand-goldenHour" /> Branding &amp; Aesthetics
              </h2>
              <p className="text-xs text-brand-sandstone/70 mt-1">
                Customize your storefront with Caribbean Futurism color swatches and bespoke banner art.
              </p>
            </div>

            {/* Hero Image URL */}
            <div className="space-y-2">
              <label htmlFor="hero-image-url" className="block text-xs font-black text-slate-200">
                Hero Banner Image URL
              </label>
              <div className="relative">
                <input
                  id="hero-image-url"
                  type="url"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-goldenHour focus:ring-1 focus:ring-brand-goldenHour transition-colors pr-10"
                />
                <ImageIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Banner Preview */}
            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold text-slate-400">Banner Live Preview</span>
              <div
                className="w-full h-36 rounded-2xl border border-slate-800 overflow-hidden relative flex items-end p-4 transition-all"
                style={{
                  backgroundColor: brandColor,
                  backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-goldenHour px-2 py-0.5 rounded-full bg-slate-950/80 border border-white/10">
                    {selectedSellerInfo.title}
                  </span>
                  <h3 className="text-sm font-black text-white mt-1">
                    {headline || 'Your Storefront Headline'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Caribbean Futurism Swatches */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-200">
                Caribbean Futurism Brand Palette Swatches <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CARIBBEAN_FUTURISM_SWATCHES.map((swatch) => {
                  const isSelected = brandColor === swatch.value;
                  return (
                    <button
                      key={swatch.value}
                      type="button"
                      onClick={() => setBrandColor(swatch.value)}
                      className={`p-3 rounded-2xl border text-left transition-all min-h-[44px] flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-white ring-2 ring-white/30 text-white'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: swatch.value }}
                        />
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="mt-2">
                        <span className="text-xs font-black block">{swatch.name}</span>
                        <span className="text-[10px] text-brand-sandstone/60 font-mono">
                          {swatch.value}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Policies & Customer Trust */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Policies &amp; Customer Trust
              </h2>
              <p className="text-xs text-brand-sandstone/70 mt-1">
                Establish buyer confidence with clear shipping terms, dispute handling, and direct support.
              </p>
            </div>

            {/* Customer Support Email */}
            <div className="space-y-1.5">
              <label htmlFor="support-email" className="block text-xs font-black text-slate-200">
                Customer Support Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="support-email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@yourislandstore.com"
                  className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-sunriseCoral focus:ring-1 focus:ring-brand-sunriseCoral transition-colors pr-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Caribbean Shipping Policy */}
            <div className="space-y-1.5">
              <label htmlFor="shipping-policy" className="block text-xs font-black text-slate-200 flex items-center justify-between">
                <span>Caribbean Shipping &amp; Logistics Policy <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-slate-400 font-normal">Courier / Inter-island transit</span>
              </label>
              <textarea
                id="shipping-policy"
                rows={3}
                value={shippingPolicy}
                onChange={(e) => setShippingPolicy(e.target.value)}
                placeholder="Details on local express courier, inter-island cargo, and estimated delivery windows..."
                className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-sunriseCoral transition-colors resize-none"
              />
            </div>

            {/* 30-Day Return & Escrow Policy */}
            <div className="space-y-1.5">
              <label htmlFor="return-policy" className="block text-xs font-black text-slate-200 flex items-center justify-between">
                <span>30-Day Escrow &amp; Return Terms <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-emerald-400 font-bold">TUKUBI Protected</span>
              </label>
              <textarea
                id="return-policy"
                rows={3}
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                placeholder="Conditions for returns, replacements, and escrow resolution..."
                className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-sunriseCoral transition-colors resize-none"
              />
            </div>

            {/* Trust Callout */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-white">TUKUBI 30-Day Escrow Guarantee Active</span>
                <span className="text-[11px] text-emerald-300/80 leading-relaxed block mt-0.5">
                  All transactions placed through your storefront are protected. Buyer funds remain securely in escrow until delivery confirmation, mitigating merchant chargebacks and counterfeit disputes.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Publish */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-sunriseCoral" /> Review &amp; Publish Storefront
              </h2>
              <p className="text-xs text-brand-sandstone/70 mt-1">
                Preview your storefront summary card and publish your shop to the Caribbean marketplace.
              </p>
            </div>

            {/* Interactive Summary Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-xl">
              {/* Card Banner Preview */}
              <div
                className="h-32 w-full relative flex items-end p-4 transition-all"
                style={{
                  backgroundColor: brandColor,
                  backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-full bg-slate-950/80 border border-white/20">
                      {selectedSellerInfo.title}
                    </span>
                    <h3 className="text-base font-black text-white mt-1 drop-shadow-md">
                      {headline}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-white/10 text-xs font-bold text-white">
                    <span>{selectedCountry?.flag}</span>
                    <span>{countryIso}</span>
                    <span className="text-brand-sandstone/50">•</span>
                    <span className="text-brand-goldenHour">{currency}</span>
                  </div>
                </div>
              </div>

              {/* Card Body Details */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                      Customer Support
                    </span>
                    <span className="text-xs font-black text-white truncate block mt-0.5">
                      {supportEmail}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                      Brand Accent
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: brandColor }}
                      />
                      <span className="text-xs font-mono font-bold text-white">{brandColor}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                      Escrow Safety
                    </span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> 30-Day Escrow
                    </span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-800/80 pt-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">Shipping Policy:</span>
                    <p className="text-xs text-brand-sandstone/80 mt-0.5 line-clamp-2">
                      {shippingPolicy}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">Return &amp; Dispute Terms:</span>
                    <p className="text-xs text-brand-sandstone/80 mt-0.5 line-clamp-2">
                      {returnPolicy}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Publish Toggle */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <label htmlFor="publish-toggle" className="text-xs font-black text-white block cursor-pointer">
                  Publish Storefront Immediately
                </label>
                <p className="text-[11px] text-brand-sandstone/60 mt-0.5">
                  When enabled, your storefront is publicly discoverable across the Caribbean marketplace.
                </p>
              </div>

              <input
                id="publish-toggle"
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-5 h-5 accent-brand-sunriseCoral cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Wizard Footer Controls */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-5 gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1 || isPending}
          className="px-4 py-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-xs font-bold text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex items-center gap-2">
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour hover:brightness-110 active:scale-95 text-xs font-black text-slate-950 transition-all shadow-md shadow-brand-sunriseCoral/20 flex items-center gap-1.5 cursor-pointer"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="px-6 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-sunriseCoral hover:brightness-110 active:scale-95 disabled:opacity-50 text-xs font-black text-slate-950 transition-all shadow-lg shadow-brand-sunriseCoral/25 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Publishing Storefront...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{isPublished ? 'Publish Storefront' : 'Save Draft Storefront'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
