'use client';

import React, { useState, useMemo } from 'react';
import { type ProductVariant } from '@caribbean/marketplace';
import { Money } from '@caribbean/payments';
import { Check, AlertCircle, Sparkles } from 'lucide-react';

interface VariantSelectorProps {
  variants: ProductVariant[];
  basePriceMinor: number;
  currency: string;
  onVariantChange: (variant: ProductVariant | null) => void;
}

export default function VariantSelector({
  variants,
  basePriceMinor,
  currency,
  onVariantChange,
}: VariantSelectorProps) {
  // Extract all unique option names (e.g. ['size', 'color'])
  const optionKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const v of variants) {
      if (v.options && typeof v.options === 'object') {
        Object.keys(v.options).forEach((k) => keys.add(k));
      }
    }
    return Array.from(keys);
  }, [variants]);

  // Initial selection defaults to first active variant or empty
  const initialSelection = useMemo(() => {
    const firstActive = variants.find((v) => v.isActive && v.inventoryCount > 0) || variants[0];
    return firstActive?.options ? { ...firstActive.options } : {};
  }, [variants]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(initialSelection);

  // Match the variant from the selected options
  const currentVariant = useMemo(() => {
    if (variants.length === 0) return null;
    return (
      variants.find((v) => {
        if (!v.options) return false;
        return Object.entries(selectedOptions).every(([k, val]) => v.options[k] === val);
      }) || null
    );
  }, [variants, selectedOptions]);

  // Handle option selection
  function handleSelectOption(key: string, value: string) {
    const updated = { ...selectedOptions, [key]: value };
    setSelectedOptions(updated);

    const matched =
      variants.find((v) => {
        if (!v.options) return false;
        return Object.entries(updated).every(([k, val]) => v.options[k] === val);
      }) || null;

    onVariantChange(matched);
  }

  if (variants.length === 0 || optionKeys.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Product Options &amp; Variants
        </span>
        {currentVariant && (
          <span className="text-[10px] font-mono text-slate-400">SKU: {currentVariant.sku}</span>
        )}
      </div>

      {optionKeys.map((optKey) => {
        // Find all distinct values for this option key
        const values = Array.from(
          new Set(
            variants
              .map((v) => v.options?.[optKey])
              .filter((val): val is string => Boolean(val))
          )
        );

        const currentVal = selectedOptions[optKey];

        return (
          <div key={optKey} className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold capitalize">{optKey}</span>
              <span className="text-brand-sunriseCoral font-bold">{currentVal || 'Select'}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {values.map((val) => {
                const isSelected = currentVal === val;
                // Check if any variant with this option is in stock
                const isAvailable = variants.some(
                  (v) => v.options?.[optKey] === val && v.isActive && v.inventoryCount > 0
                );

                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectOption(optKey, val)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-sunriseCoral/20'
                        : isAvailable
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-slate-900/40 text-slate-500 border border-slate-800/80 line-through'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{val}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected Variant Stock Status */}
      {currentVariant && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Availability:</span>
          {currentVariant.isActive && currentVariant.inventoryCount > 0 ? (
            <span className="font-bold text-emerald-400">
              In Stock ({currentVariant.inventoryCount} units available)
            </span>
          ) : (
            <span className="font-bold text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Out of Stock in this combination
            </span>
          )}
        </div>
      )}
    </div>
  );
}
