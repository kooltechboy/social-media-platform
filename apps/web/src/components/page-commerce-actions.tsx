'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, Building2, ShoppingBag } from 'lucide-react';
import AskBusinessAIModal from './ask-business-ai-modal';
import BusinessTierModal from './business-tier-modal';

interface PageCommerceActionsProps {
  businessName: string;
  businessSlug: string;
  category: string;
  location: string;
}

export default function PageCommerceActions({
  businessName,
  businessSlug,
  category,
  location,
}: PageCommerceActionsProps) {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTierOpen, setIsTierOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsAIOpen(true)}
          className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-goldenHour/20 to-brand-sunriseCoral/20 border border-brand-goldenHour/40 hover:border-brand-goldenHour text-brand-goldenHour hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-brand-goldenHour/10"
        >
          <Bot className="w-4 h-4 text-brand-goldenHour" />
          <span>Ask Store AI</span>
        </button>

        <button
          type="button"
          onClick={() => setIsTierOpen(true)}
          className="px-3.5 py-2.5 rounded-2xl bg-brand-dusk hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-sunriseCoral" />
          <span>Merchant Plans</span>
        </button>
      </div>

      <AskBusinessAIModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        businessName={businessName}
        businessSlug={businessSlug}
        category={category}
        location={location}
      />

      <BusinessTierModal
        isOpen={isTierOpen}
        onClose={() => setIsTierOpen(false)}
        businessName={businessName}
      />
    </>
  );
}
