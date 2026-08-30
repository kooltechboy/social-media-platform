'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, X, Send, Loader2, Clock, MapPin, CheckCircle, ShieldCheck } from 'lucide-react';
import { BusinessAIAssistant } from '@caribbean/ai';

interface AskBusinessAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  businessSlug: string;
  category: string;
  location: string;
  products?: Array<{
    title: string;
    priceFormatted: string;
    kind: string;
    inStock: boolean;
  }>;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  groundedFacts?: string[];
}

export default function AskBusinessAIModal({
  isOpen,
  onClose,
  businessName,
  businessSlug,
  category,
  location,
  products = [
    { title: 'Signature Whole Bean Coffee (16oz)', priceFormatted: '$38.00 USD', kind: 'physical', inStock: true },
    { title: 'Artisanal Organic Cacao & Rum Nibs', priceFormatted: '$24.00 USD', kind: 'physical', inStock: true },
    { title: 'Carnival VIP Experience Pass', priceFormatted: '$50.00 USD', kind: 'service', inStock: true },
  ],
}: AskBusinessAIModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Hello! I am the verified AI Business Assistant for ${businessName}. How can I help you today? You can ask about our products, store hours in ${location}, delivery across the Caribbean and diaspora, or place an order via Tukubi Checkout.`,
      timestamp: 'Just now',
      groundedFacts: ['Verified Business Profile', 'Tukubi Escrow Active'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const assistant = new BusinessAIAssistant();

  function handleQuickPrompt(prompt: string) {
    sendMessage(prompt);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  }

  function sendMessage(text: string) {
    const userMsg: Message = { sender: 'user', text, timestamp: 'Just now' };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const response = assistant.answerCustomerQuery(text, {
        businessName,
        category,
        location,
        hours: 'Monday through Saturday from 8:30 AM to 8:00 PM AST',
        deliveryPolicies:
          'Worldwide dispatch across the Caribbean, USA (NYC, Miami), Canada (Toronto, Montreal), and UK (London) with certified tracking and customs clearance.',
        products,
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: response.answer,
          timestamp: 'Just now',
          groundedFacts: response.groundedFacts,
        },
      ]);
      setIsTyping(false);
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col h-[600px] relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-sunriseCoral to-brand-goldenHour text-slate-950 flex items-center justify-center shadow-lg shadow-brand-sunriseCoral/20 font-black">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm text-white">{businessName} AI</h3>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-goldenHour/20 text-brand-goldenHour border border-brand-goldenHour/30">
                  Grounded AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-brand-sunriseCoral" /> {location} &bull; Escrow Protected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-slate-950/60 border-b border-slate-800/80 flex gap-2 overflow-x-auto text-[11px] scrollbar-none">
          <button
            type="button"
            onClick={() => handleQuickPrompt('What are your opening hours and location?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-brand-sunriseCoral hover:text-white shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Clock className="w-3 h-3 text-brand-sunriseCoral" /> Opening Hours
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt('What products do you have available in your store?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-brand-sunriseCoral hover:text-white shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-brand-goldenHour" /> Product Catalog
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt('Do you deliver to the diaspora in North America and the UK?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-brand-sunriseCoral hover:text-white shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Diaspora Shipping
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/30">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-brand-sunriseCoral text-slate-950 font-semibold rounded-br-none shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm whitespace-pre-wrap'
                }`}
              >
                {m.text}

                {m.groundedFacts && m.groundedFacts.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1 text-[9px] text-slate-400">
                    <span className="font-bold text-brand-goldenHour">Grounded on:</span>
                    {m.groundedFacts.map((fact, fIdx) => (
                      <span key={fIdx} className="bg-slate-800/90 text-slate-300 px-1.5 py-0.5 rounded">
                        ✓ {fact}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-2 rounded-2xl w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-sunriseCoral" />
              <span>Verifying business data &amp; composing response...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900/90 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${businessName} about hours, menu, or delivery...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-sunriseCoral"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2.5 rounded-xl bg-brand-sunriseCoral hover:bg-brand-goldenHour text-slate-950 font-black text-xs disabled:opacity-40 transition-colors flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
