'use client';

import React from 'react';
import {
  HeartHandshake,
  ShieldAlert,
  DollarSign,
  Globe,
  FileText,
  Link as LinkIcon,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type {
  CreateReliefCampaignInput,
  ReliefCategory,
} from '../../lib/relief/types';
import { RELIEF_CATEGORY_METADATA } from '../../lib/relief/types';

export interface ReliefComposerPanelProps {
  value: CreateReliefCampaignInput;
  onChange: (val: CreateReliefCampaignInput) => void;
  className?: string;
  onRemove?: () => void;
}

const CARIBBEAN_TERRITORIES: Array<{ code: string; name: string }> = [
  { code: 'JAM', name: 'Jamaica (JAM)' },
  { code: 'TTO', name: 'Trinidad & Tobago (TTO)' },
  { code: 'BRB', name: 'Barbados (BRB)' },
  { code: 'GRD', name: 'Grenada (GRD)' },
  { code: 'VCT', name: 'St. Vincent & Grenadines (VCT)' },
  { code: 'LCA', name: 'Saint Lucia (LCA)' },
  { code: 'DMA', name: 'Dominica (DMA)' },
  { code: 'BHS', name: 'Bahamas (BHS)' },
  { code: 'ATG', name: 'Antigua & Barbuda (ATG)' },
  { code: 'GUY', name: 'Guyana (GUY)' },
  { code: 'BLZ', name: 'Belize (BLZ)' },
  { code: 'KNA', name: 'St. Kitts & Nevis (KNA)' },
];

export default function ReliefComposerPanel({
  value,
  onChange,
  className = '',
  onRemove,
}: ReliefComposerPanelProps) {
  const currentGoalDollars = Math.round((value.goal_minor || 0) / 100);
  const isGoalBelowMin = currentGoalDollars < 100;

  const handleFieldChange = <K extends keyof CreateReliefCampaignInput>(
    field: K,
    newVal: CreateReliefCampaignInput[K]
  ) => {
    onChange({
      ...value,
      [field]: newVal,
    });
  };

  const handleGoalChange = (dollarsStr: string) => {
    const dollars = parseInt(dollarsStr, 10);
    const minorUnits = Number.isNaN(dollars) ? 0 : Math.max(0, dollars * 100);
    handleFieldChange('goal_minor', minorUnits);
  };

  const currentCategory = value.category || 'hurricane_relief';
  const categoryMeta = RELIEF_CATEGORY_METADATA[currentCategory] || RELIEF_CATEGORY_METADATA.hurricane_relief;

  const primaryEvidenceUrl = value.supporting_evidence_urls?.[0] || '';

  return (
    <div
      className={`p-4 rounded-2xl bg-brand-twilight/90 border border-rose-500/30 space-y-4 animate-fadeIn shadow-lg ${className}`}
      data-testid="relief-composer-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-bold text-rose-400 flex items-center gap-1.5">
              Launch Community Relief & Mutual Aid
            </h4>
            <p className="text-[11px] text-brand-sandstone/60">
              Verified Caribbean disaster response with regional agency protocols (CDEMA, ODPEM, NEMO)
            </p>
          </div>
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove relief campaign"
            className="text-brand-sandstone/40 hover:text-brand-sandstone text-xs flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        )}
      </div>

      {/* Goal Validation Alert */}
      {isGoalBelowMin && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Validation Error: Minimum funding goal is $100. Current goal is ${currentGoalDollars}.</span>
        </div>
      )}

      {/* Campaign Title */}
      <div>
        <label
          htmlFor="relief-title-input"
          className="block text-xs font-semibold text-brand-sandstone/80 mb-1"
        >
          Relief Initiative / Campaign Title *
        </label>
        <input
          id="relief-title-input"
          type="text"
          value={value.title || ''}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="e.g. Hurricane Beryl Community Emergency Response"
          required
          aria-required="true"
          className="w-full bg-brand-dusk border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
        />
      </div>

      {/* Category Selector with Caribbean Disaster Protocol Badges */}
      <div>
        <label
          htmlFor="relief-category-select"
          className="block text-xs font-semibold text-brand-sandstone/80 mb-1"
        >
          Disaster & Relief Category
        </label>
        <select
          id="relief-category-select"
          value={currentCategory}
          onChange={(e) => handleFieldChange('category', e.target.value as ReliefCategory)}
          className="w-full bg-brand-dusk border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
        >
          {(Object.keys(RELIEF_CATEGORY_METADATA) as ReliefCategory[]).map((catKey) => {
            const meta = RELIEF_CATEGORY_METADATA[catKey];
            return (
              <option key={catKey} value={catKey}>
                {meta.title} [{meta.protocol}] — {meta.agency.split(' (')[0]}
              </option>
            );
          })}
        </select>

        {/* Selected Agency Protocol Badge */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-medium">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            Protocol: {categoryMeta.protocol}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-brand-sandstone/70">
            Agency: {categoryMeta.agency}
          </span>
        </div>
      </div>

      {/* Goal & Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="relief-goal-input"
            className="block text-xs font-semibold text-brand-sandstone/80 mb-1 flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5 text-rose-400" /> Funding Goal ($ Min $100) *
          </label>
          <input
            id="relief-goal-input"
            type="number"
            min="100"
            value={currentGoalDollars || ''}
            onChange={(e) => handleGoalChange(e.target.value)}
            placeholder="Goal in dollars (e.g. 5000)"
            required
            aria-required="true"
            className="w-full bg-brand-dusk border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="relief-currency-select"
            className="block text-xs font-semibold text-brand-sandstone/80 mb-1"
          >
            Currency
          </label>
          <select
            id="relief-currency-select"
            value={value.currency || 'USD'}
            onChange={(e) => handleFieldChange('currency', e.target.value)}
            className="w-full bg-brand-dusk border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
          >
            <option value="USD">USD ($ United States Dollar)</option>
            <option value="JMD">JMD (J$ Jamaican Dollar)</option>
            <option value="TTD">TTD (TT$ Trinidad & Tobago Dollar)</option>
            <option value="BBD">BBD (Bds$ Barbadian Dollar)</option>
            <option value="XCD">XCD (EC$ Eastern Caribbean Dollar)</option>
          </select>
        </div>
      </div>

      {/* Target Territory & Disaster Declaration Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="relief-territory-select"
            className="block text-xs font-semibold text-brand-sandstone/80 mb-1 flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Target Territory ISO
          </label>
          <select
            id="relief-territory-select"
            value={value.target_country_iso || 'JAM'}
            onChange={(e) => handleFieldChange('target_country_iso', e.target.value)}
            className="w-full bg-brand-dusk border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
          >
            {CARIBBEAN_TERRITORIES.map((terr) => (
              <option key={terr.code} value={terr.code}>
                {terr.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="relief-declaration-ref-input"
            className="block text-xs font-semibold text-brand-sandstone/80 mb-1 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" /> Disaster Declaration Protocol Ref
          </label>
          <input
            id="relief-declaration-ref-input"
            type="text"
            value={value.disaster_declaration_ref || ''}
            onChange={(e) => handleFieldChange('disaster_declaration_ref', e.target.value)}
            placeholder="e.g. CDEMA-SITREP-2026-01 / ODPEM-DECL"
            className="w-full bg-brand-dusk border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
          />
        </div>
      </div>

      {/* Supporting Evidence URL */}
      <div>
        <label
          htmlFor="relief-evidence-url-input"
          className="block text-xs font-semibold text-brand-sandstone/80 mb-1 flex items-center gap-1.5"
        >
          <LinkIcon className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Supporting Evidence URL
        </label>
        <input
          id="relief-evidence-url-input"
          type="url"
          value={primaryEvidenceUrl}
          onChange={(e) => {
            const url = e.target.value.trim();
            handleFieldChange('supporting_evidence_urls', url ? [url] : []);
          }}
          placeholder="https://cdema.org/situation-reports/... or local news bulletin"
          className="w-full bg-brand-dusk border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
        />
      </div>
    </div>
  );
}
