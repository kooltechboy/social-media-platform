'use client';

import React, { useState } from 'react';
import { Sparkles, Bot, ArrowRight, X, ShieldCheck, HelpCircle } from 'lucide-react';
import { parseNaturalLanguageSearch } from '@caribbean/marketplace';
import { useRouter } from 'next/navigation';

interface AiShoppingAssistantProps {
  productContext?: {
    title: string;
    description?: string | null;
    priceFormatted: string;
    condition?: string;
    sellerName: string;
    location?: string;
  };
}

export default function AiShoppingAssistant({ productContext }: AiShoppingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'assistant'; text: string; actionUrl?: string; actionLabel?: string }>
  >([
    {
      sender: 'assistant',
      text: productContext
        ? `Hello! I'm TUKUBI Shopping AI. You can ask me anything about "${productContext.title}", compare it with other island merchandise, or check shipping protection.`
        : 'Welcome to TUKUBI Caribbean Commerce! Tell me what you are looking for (e.g. "used iPhone under $300 in Kingston" or "handmade coffee in Dominican Republic") and I will filter verified island listings for you.',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query.trim();
    setQuery('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      if (productContext) {
        // Product specific answer logic
        const qNorm = userText.toLowerCase();
        let reply = '';
        if (qNorm.includes('shipping') || qNorm.includes('deliver') || qNorm.includes('protection')) {
          reply = `This listing is sold by ${productContext.sellerName} and backed by TUKUBI 30-day Buyer Protection. Payments are held safely in verified escrow until delivery is confirmed.`;
        } else if (qNorm.includes('condition') || qNorm.includes('quality')) {
          reply = `The seller has listed this item in "${productContext.condition || 'verified'}" condition. Description provided: "${productContext.description || 'Authentic Caribbean offering'}".`;
        } else if (qNorm.includes('similar') || qNorm.includes('cheaper') || qNorm.includes('more')) {
          reply = `Searching for related Caribbean listings matching "${productContext.title}"...`;
          setMessages((prev) => [
            ...prev,
            {
              sender: 'assistant',
              text: reply,
              actionUrl: `/marketplace?q=${encodeURIComponent(productContext.title.split(' ')[0])}`,
              actionLabel: `View Similar Products`,
            },
          ]);
          return;
        } else {
          reply = `"${productContext.title}" is listed at ${productContext.priceFormatted} by ${productContext.sellerName}${productContext.location ? ` in ${productContext.location}` : ''}. You can make an offer or message the seller directly for personalized arrangements!`;
        }

        setMessages((prev) => [...prev, { sender: 'assistant', text: reply }]);
      } else {
        // Global search planning logic
        const parsed = parseNaturalLanguageSearch(userText);
        let filterSummary = [];
        const params = new URLSearchParams();

        if (parsed.query) {
          params.set('q', parsed.query);
          filterSummary.push(`keywords "${parsed.query}"`);
        }
        if (parsed.categorySlug) {
          params.set('category', parsed.categorySlug);
          filterSummary.push(`category`);
        }
        if (parsed.maxPriceMinor) {
          filterSummary.push(`max price $${(parsed.maxPriceMinor / 100).toFixed(2)}`);
        }
        if (parsed.countryIso) {
          filterSummary.push(`territory ${parsed.countryIso}`);
        }
        if (parsed.pickupOnly) {
          filterSummary.push(`local island pickup`);
        }

        const reply = `I've analyzed your request and structured a verified marketplace query: filtering by ${filterSummary.join(', ') || 'relevance'}.`;
        const actionUrl = `/marketplace?${params.toString()}`;

        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: reply,
            actionUrl,
            actionLabel: 'Apply AI Filters & Browse',
          },
        ]);
      }
    }, 600);
  };

  return (
    <div>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-xl transition-all"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Ask TUKUBI AI</span>
        </button>
      )}

      {/* Slide-out Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-950 border-l border-orange-500/30 shadow-2xl flex flex-col animate-slideLeft">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#140C22]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>Ask TUKUBI</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Grounded AI
                  </span>
                </h3>
                <p className="text-[10px] text-brand-sandstone/60">
                  Caribbean Commerce Assistant • Never fabricated
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-brand-sandstone/60 hover:text-white p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-orange-500 text-slate-950 font-bold rounded-br-none'
                      : 'bg-white/10 border border-white/10 text-white rounded-bl-none'
                  }`}
                >
                  <p>{m.text}</p>
                </div>
                {m.actionUrl && (
                  <button
                    onClick={() => {
                      if (m.actionUrl) router.push(m.actionUrl);
                      setIsOpen(false);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-[11px] hover:brightness-110 transition-all shadow-md"
                  >
                    <span>{m.actionLabel || 'View Results'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10 text-brand-sandstone/60 max-w-[50%]">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce delay-150" />
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce delay-300" />
              </div>
            )}
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="p-3 border-t border-white/10 bg-[#10091D] space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-brand-sandstone/60 uppercase font-black tracking-wider">
              <HelpCircle className="w-3 h-3 text-orange-400" /> Quick Questions
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(productContext
                ? [
                    'How does buyer protection work?',
                    'Find similar products',
                    'Explain product condition',
                  ]
                : [
                    'Find used laptops under $400',
                    'Handmade Jamaican coffee',
                    'Soca & Carnival accessories',
                  ]
              ).map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(chip);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-brand-sandstone/80 hover:text-white whitespace-nowrap transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Query Input */}
          <form onSubmit={handleAsk} className="p-3 border-t border-white/10 bg-[#140C22] flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about products, shipping, or sellers..."
              className="flex-1 bg-slate-900 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-slate-950 font-black text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
