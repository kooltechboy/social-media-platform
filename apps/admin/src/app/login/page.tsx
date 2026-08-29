import React from 'react';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex items-center justify-center p-6">
      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-8 max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-brand-sandstone tracking-wider">TUKUBI</h1>
          <p className="text-xs text-rose-300 font-semibold mt-1">Admin Console — Restricted Access</p>
        </div>
        <p className="text-sm text-brand-sandstone/60 text-center">
          Admin authentication is handled via Supabase Auth. Sign in through the main platform, then return here.
        </p>
        <a
          href={process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000/login'}
          className="block w-full text-center bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          Sign In via Tukubi
        </a>
      </div>
    </div>
  );
}
