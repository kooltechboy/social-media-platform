import React from 'react';
import Image from 'next/image';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-brand-twilight text-brand-sandstone flex flex-col justify-between p-6">
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-8 max-w-sm w-full space-y-6 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Image
                src="/brand/tukubi-emblem.png"
                alt="TUKUBI"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral bg-clip-text text-transparent tracking-wider">
              TUKUBI
            </h1>
            <p className="text-xs text-rose-300 font-semibold">Admin Console — Restricted Access</p>
          </div>
          <p className="text-xs text-brand-sandstone/60 text-center leading-relaxed">
            Admin authentication is cryptographically gated. Sign in through the master Tukubi gateway, then return here.
          </p>
          <a
            href={process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000/login'}
            className="block w-full text-center bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:opacity-95 text-slate-950 font-black px-5 py-3 rounded-xl text-sm transition-all shadow-lg shadow-brand-caribbeanSea/20"
          >
            Sign In via Master Gateway
          </a>
        </div>
      </div>

      {/* Dark Footer with Image 2 Logo */}
      <footer className="w-full max-w-sm mx-auto flex flex-col items-center gap-3 pt-6 text-center text-xs text-brand-sandstone/40">
        <Image
          src="/brand/tukubi-footer-dark.png"
          alt="TUKUBI — The Caribbean Connected."
          width={140}
          height={56}
          className="object-contain rounded-lg border border-white/10"
        />
        <p>&copy; {new Date().getFullYear()} TUKUBI. All administrative actions audited.</p>
      </footer>
    </div>
  );
}
