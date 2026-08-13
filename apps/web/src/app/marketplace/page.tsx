import React from 'react';
import { ShoppingBag, Star, ShieldCheck, Wallet } from 'lucide-react';

export default function MarketplacePage() {
  const products = [
    {
      title: 'Authentic Jamaican Blue Mountain Coffee',
      seller: 'Kingston Coffee Co.',
      flag: '🇯🇲',
      price: '$34.99',
      rating: 4.9,
      reviews: 128,
    },
    {
      title: 'Dominican Organic Cacao & Chocolate Box',
      seller: 'Cacao Dominicana',
      flag: '🇩🇴',
      price: '$28.00',
      rating: 4.8,
      reviews: 94,
    },
    {
      title: 'Handcrafted Soca Carnival Costume Headdress',
      seller: 'Trini Carnival Arts',
      flag: '🇹🇹',
      price: '$180.00',
      rating: 5.0,
      reviews: 42,
    }
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-emerald-400" /> Caribbean Marketplace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Buy physical goods, authentic Caribbean food, art, apparel, and cultural crafts directly from Caribbean businesses.
          </p>
        </div>

        <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors">
          Sell Products on SpotPay
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((item, idx) => (
          <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
            <div className="space-y-3">
              <div className="aspect-video bg-slate-950 rounded-xl flex items-center justify-center text-4xl border border-slate-800">
                {item.flag}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{item.seller}</span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> {item.rating} ({item.reviews})
                </span>
              </div>
              <h3 className="font-bold text-base text-white">{item.title}</h3>
              <div className="text-xl font-black text-emerald-400">{item.price} <span className="text-xs font-normal text-slate-400">USD</span></div>
            </div>

            <button className="w-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors">
              <Wallet className="w-4 h-4" /> Buy with SpotPay
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
