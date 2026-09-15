'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Plane,
  HelpCircle,
  FileCheck2,
  Check,
  DollarSign,
  Info,
} from 'lucide-react';
import {
  estimateCaribbeanCustomsDuties,
  DESTINATION_VAT_RATES,
  DE_MINIMIS_LIMITS_USD_MINOR,
} from '@caribbean/marketplace';

const CARIBBEAN_DESTINATIONS: Array<{ code: string; name: string; flag: string }> = [
  { code: 'JAM', name: 'Jamaica (GCT 15%)', flag: '🇯🇲' },
  { code: 'TTO', name: 'Trinidad & Tobago (VAT 12.5%)', flag: '🇹🇹' },
  { code: 'DOM', name: 'Dominican Republic (ITBIS 18%)', flag: '🇩🇴' },
  { code: 'BRB', name: 'Barbados (VAT 17.5%)', flag: '🇧🇧' },
  { code: 'BHS', name: 'Bahamas (VAT 10%)', flag: '🇧🇸' },
  { code: 'PRI', name: 'Puerto Rico (IVU 11.5%)', flag: '🇵🇷' },
  { code: 'LCA', name: 'Saint Lucia (VAT 12.5%)', flag: '🇱🇨' },
  { code: 'GUY', name: 'Guyana (VAT 14%)', flag: '🇬🇾' },
  { code: 'HTI', name: 'Haiti (TCA 10%)', flag: '🇭🇹' },
];

const ORIGIN_OPTIONS: Array<{ code: string; name: string; isDiaspora: boolean }> = [
  { code: 'USA', name: 'United States (Miami / NY Hub)', isDiaspora: true },
  { code: 'GBR', name: 'United Kingdom (London Hub)', isDiaspora: true },
  { code: 'CAN', name: 'Canada (Toronto Hub)', isDiaspora: true },
  { code: 'JAM', name: 'Jamaica (Regional Hub)', isDiaspora: false },
  { code: 'TTO', name: 'Trinidad & Tobago (Regional Hub)', isDiaspora: false },
  { code: 'DOM', name: 'Dominican Republic (Regional Hub)', isDiaspora: false },
  { code: 'BRB', name: 'Barbados (Regional Hub)', isDiaspora: false },
];

export interface CustomsDutyEstimatorProps {
  itemValueMinor: number;
  shippingMinor?: number;
  originCountryIso?: string;
  destinationCountryIso?: string;
  categorySlug?: string;
  currency?: string;
  onDdpToggle?: (ddpEnabled: boolean, dutyTotalMinor: number) => void;
  className?: string;
}

export function CustomsDutyEstimator({
  itemValueMinor,
  shippingMinor = 1500,
  originCountryIso = 'USA',
  destinationCountryIso = 'JAM',
  categorySlug = 'fashion-apparel',
  currency = 'USD',
  onDdpToggle,
  className = '',
}: CustomsDutyEstimatorProps) {
  const [selectedOrigin, setSelectedOrigin] = useState<string>(originCountryIso.toUpperCase());
  const [selectedDest, setSelectedDest] = useState<string>(destinationCountryIso.toUpperCase());
  const [isDdpEnabled, setIsDdpEnabled] = useState<boolean>(true);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const estimate = useMemo(() => {
    return estimateCaribbeanCustomsDuties({
      itemValueMinor,
      shippingMinor,
      originCountryIso: selectedOrigin,
      destinationCountryIso: selectedDest,
      categorySlug,
      prepayDuties: isDdpEnabled,
    });
  }, [itemValueMinor, shippingMinor, selectedOrigin, selectedDest, categorySlug, isDdpEnabled]);

  const handleToggle = (enabled: boolean) => {
    setIsDdpEnabled(enabled);
    if (onDdpToggle) {
      onDdpToggle(enabled, enabled ? estimate.totalEstimatedDutiesMinor : 0);
    }
  };

  const isDomestic = selectedOrigin === selectedDest;
  const isCaricomToCaricom =
    ['JAM', 'TTO', 'BRB', 'LCA', 'GUY', 'BHS'].includes(selectedOrigin) &&
    ['JAM', 'TTO', 'BRB', 'LCA', 'GUY', 'BHS'].includes(selectedDest) &&
    !isDomestic;

  return (
    <div
      className={`surface-card border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl text-brand-sandstone ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/30 flex items-center justify-center text-brand-caribbeanSea">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Cross-Border Duties &amp; Tariffs
            </h4>
            <p className="text-[11px] text-brand-sandstone/70">
              CARICOM CET &amp; Island VAT estimation for smooth customs clearance
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-brand-sandstone/60 hover:text-white transition-colors cursor-pointer"
          title="Learn about Caribbean tariffs"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Info Card if toggled */}
      {showExplanation && (
        <div className="p-3.5 rounded-2xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/25 text-xs text-brand-sandstone/90 space-y-1.5">
          <p className="font-bold text-white flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-brand-caribbeanSea" /> How Caribbean Import Duties Work
          </p>
          <p className="text-[11px] leading-relaxed">
            All shipments between Caribbean territories and international diaspora hubs pass through national customs.
            Items are taxed under the CARICOM Common External Tariff (CET) plus domestic island VAT/GCT. With Delivered
            Duty Paid (DDP), TUKUBI prepays and guarantees border clearance with no unexpected terminal fees.
          </p>
        </div>
      )}

      {/* Origin & Destination Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-brand-sandstone/70">Origin Hub</label>
          <select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea cursor-pointer min-h-[40px]"
          >
            {ORIGIN_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-brand-sandstone/70">Destination Island</label>
          <select
            value={selectedDest}
            onChange={(e) => setSelectedDest(e.target.value)}
            className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea cursor-pointer min-h-[40px]"
          >
            {CARIBBEAN_DESTINATIONS.map((dest) => (
              <option key={dest.code} value={dest.code}>
                {dest.flag} {dest.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Duty Assessment Output */}
      {isDomestic ? (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
          <FileCheck2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-emerald-300">Domestic Island Trade</span>
            <p className="text-[11px] text-brand-sandstone/70 mt-0.5">
              Zero customs duties, zero import tariffs, and zero border processing fees.
            </p>
          </div>
        </div>
      ) : estimate.deMinimisExempt ? (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-emerald-300">De Minimis Exemption Applied</span>
              <p className="text-[11px] text-brand-sandstone/70 mt-0.5">
                Item value (${(itemValueMinor / 100).toFixed(2)}) is below the ${(estimate.deMinimisLimitMinor / 100).toFixed(2)} import threshold.
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-400 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            DUTY FREE
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Breakdown Table */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-brand-sandstone/80">
              <span>Merchandise Value:</span>
              <span className="font-mono text-white">${(itemValueMinor / 100).toFixed(2)} {currency}</span>
            </div>

            <div className="flex items-center justify-between text-brand-sandstone/80">
              <span>CARICOM CET Duty ({(estimate.effectiveDutyRateBps / 100).toFixed(0)}%):</span>
              <span className="font-mono text-white">${(estimate.customsDutyMinor / 100).toFixed(2)} {currency}</span>
            </div>

            <div className="flex items-center justify-between text-brand-sandstone/80">
              <span>National Import VAT ({(estimate.effectiveVatRateBps / 100).toFixed(1)}%):</span>
              <span className="font-mono text-white">${(estimate.importVatMinor / 100).toFixed(2)} {currency}</span>
            </div>

            <div className="flex items-center justify-between text-brand-sandstone/80">
              <span>Customs Declaration Admin Fee:</span>
              <span className="font-mono text-white">${(estimate.adminFeeMinor / 100).toFixed(2)} {currency}</span>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between font-bold text-white">
              <span>Total Estimated Duties &amp; Taxes:</span>
              <span className="font-black font-mono text-brand-caribbeanSea text-sm">
                ${(estimate.totalEstimatedDutiesMinor / 100).toFixed(2)} {currency}
              </span>
            </div>
          </div>

          {/* DDP Pre-paid Guarantee Toggle */}
          <div
            onClick={() => handleToggle(!isDdpEnabled)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 min-h-[44px] ${
              isDdpEnabled
                ? 'bg-brand-caribbeanSea/15 border-brand-caribbeanSea/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  isDdpEnabled
                    ? 'bg-brand-caribbeanSea border-brand-caribbeanSea text-slate-950'
                    : 'border-white/30'
                }`}
              >
                {isDdpEnabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="text-xs">
                <span className="font-black text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Prepay Duties (DDP Guaranteed)
                </span>
                <p className="text-[11px] text-brand-sandstone/70">
                  Pay now with TUKUBI protection. Zero surprises or import delays upon island arrival.
                </p>
              </div>
            </div>

            <span className="text-xs font-black text-white font-mono flex-shrink-0">
              +${(estimate.totalEstimatedDutiesMinor / 100).toFixed(2)}
            </span>
          </div>

          {isCaricomToCaricom && (
            <p className="text-[10px] text-brand-goldenHour/90 font-medium">
              🌴 <strong>CSME Notice:</strong> Certified goods produced wholly within CARICOM member states qualify for CET duty waiver upon customs inspection.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
