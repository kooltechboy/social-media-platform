'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, X, Send, Loader2, MessageSquare, Utensils, Clock, MapPin, CheckCircle } from 'lucide-react';

interface AskBusinessAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  businessSlug: string;
  category: string;
  location: string;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function AskBusinessAIModal({
  isOpen,
  onClose,
  businessName,
  businessSlug,
  category,
  location,
}: AskBusinessAIModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Hello! I am the automated Antilia AI Assistant for ${businessName}. How can I assist you today? You can ask about our catalog, store hours in ${location}, reservations, or diaspora shipping.`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

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
      let reply = `Thank you for reaching out to ${businessName}! `;
      const lower = text.toLowerCase();

      if (lower.includes('hour') || lower.includes('open') || lower.includes('time')) {
        reply += `We are open Monday through Saturday from 8:00 AM to 9:00 PM AST at our ${location} flagship store.`;
      } else if (lower.includes('ship') || lower.includes('delivery') || lower.includes('diaspora')) {
        reply += `Yes! We ship across North America (NYC, Miami, Toronto) and Europe via SpotPay logistics with guaranteed customs clearance.`;
      } else if (lower.includes('menu') || lower.includes('price') || lower.includes('product')) {
        reply += `Our full verified catalog is available right on our Antilia Store tab. SpotPay 1-click checkout is active for all orders.`;
      } else if (lower.includes('reserve') || lower.includes('booking') || lower.includes('table')) {
        reply += `We have table and VIP appointments available for this weekend. Would you like me to request a reservation for 2 or 4 guests?`;
      } else {
        reply += `Our team has received your query. All transactions and bookings through our Antilia page are protected under the SpotPay Guarantee.`;
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: reply, timestamp: 'Just now' }]);
      setIsTyping(false);
    }, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col h-[580px] relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-sunriseCoral to-brand-goldenHour text-white flex items-center justify-center shadow-lg shadow-brand-sunriseCoral/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm text-white">{businessName} AI</h3>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-goldenHour/20 text-brand-goldenHour border border-brand-goldenHour/30">
                  Antilia Business AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-brand-sunriseCoral" /> {location} &bull; Multilingual Concierge
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-slate-950/60 border-b border-slate-800/80 flex gap-2 overflow-x-auto text-[11px]">
          <button
            type="button"
            onClick={() => handleQuickPrompt('What are your opening hours and location?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-brand-sunriseCoral hover:text-white shrink-0 flex items-center gap-1"
          >
            <Clock className="w-3 h-3 text-brand-sunriseCoral" /> Opening Hours
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt('Do you ship products to the diaspora (USA / Canada)?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-brand-sunriseCoral hover:text-white shrink-0 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-brand-goldenHour" /> Diaspora Shipping
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt('Can I book a table or consultation appointment?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-brand-sunriseCoral hover:text-white shrink-0 flex items-center gap-1"
          >
            <Utensils className="w-3 h-3 text-emerald-400" /> Bookings & Menu
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/30">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-brand-sunriseCoral text-white rounded-br-none shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-2 rounded-2xl w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-sunriseCoral" />
              <span>{businessName} AI is composing response...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900/90 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${businessName} anything...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-sunriseCoral"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 rounded-xl bg-brand-sunriseCoral hover:bg-brand-goldenHour text-white font-bold text-xs disabled:opacity-40 transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
