'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Globe,
  Sparkles,
  ArrowRight,
  Languages,
  AlertCircle,
  FileCheck,
  HeartHandshake,
} from 'lucide-react';
import { TukubiLogo } from '../../../components/brand/tukubi-logo';
import { AdminFooter } from '../../../components/admin/admin-footer';

const DIASPORA_REGIONS = [
  'Jamaica & Northern Caribbean',
  'Trinidad & Tobago / Southern Caribbean',
  'Barbados & OECS / Eastern Caribbean',
  'Guyana & Suriname / Guianas',
  'Bahamas & Bermuda',
  'North America Diaspora (NY, Miami, Toronto)',
  'UK & European Diaspora (London, Amsterdam, Paris)',
];

const DIALECT_OPTIONS = [
  'English & Patois / Patwa',
  'Trinidadian / Tobagonian Creole',
  'Kréyòl (Haitian / Guadeloupean / Martinican)',
  'Spanish (Dominican / Puerto Rican / Cuban)',
  'Papiamento / Papiamentu (Aruba, Bonaire, Curaçao)',
  'Surinamese Sranan Tongo / Dutch',
];

export default function ModeratorSignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'Jamaica',
    diasporaRegion: DIASPORA_REGIONS[0],
    dialects: ['English & Patois / Patwa'],
    experience: '',
    reason: '',
    agreeEthics: false,
    agreeAuditing: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleDialect = (dialect: string) => {
    setFormData((prev) => {
      const exists = prev.dialects.includes(dialect);
      return {
        ...prev,
        dialects: exists
          ? prev.dialects.filter((d) => d !== dialect)
          : [...prev.dialects, dialect],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeEthics || !formData.agreeAuditing) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#081020] text-brand-sandstone flex flex-col justify-between selection:bg-[#FF7A59]/30">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 bg-[#081020]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <TukubiLogo variant="horizontal" size="sm" href="/" />

        <div className="flex items-center gap-3">
          <Link
            href="/moderation"
            className="text-xs font-semibold text-brand-sandstone/70 hover:text-brand-caribbeanSea transition-colors"
          >
            Existing Moderator Login
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-[11px] font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>Trust &amp; Safety Portal</span>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
        {submitted ? (
          <div className="bg-brand-twilight/90 border border-brand-caribbeanSea/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-fadeIn max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">Application Received</h2>
              <p className="text-sm text-brand-sandstone/80 leading-relaxed max-w-md mx-auto">
                Thank you for applying to safeguard the Caribbean Digital Ecosystem. Our Trust &amp; Safety Leadership Council will review your dialect competencies and regional background.
              </p>
            </div>

            <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between text-brand-sandstone/60">
                <span>Applicant:</span>
                <span className="text-brand-sandstone font-bold">{formData.fullName}</span>
              </div>
              <div className="flex justify-between text-brand-sandstone/60">
                <span>Primary Coverage:</span>
                <span className="text-brand-sandstone font-bold">{formData.diasporaRegion}</span>
              </div>
              <div className="flex justify-between text-brand-sandstone/60">
                <span>Dialect Competencies:</span>
                <span className="text-brand-caribbeanSea font-bold">{formData.dialects.length} selected</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black text-xs transition-all shadow-lg hover:opacity-95"
              >
                Return to Tukubi
              </Link>
              <Link
                href="/explore"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-dusk border border-slate-700 text-brand-sandstone font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Explore Platform
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hero Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/30 text-brand-sunriseCoral text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" />
                <span>Join the Guardians of Caribbean Culture</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                TUKUBI Moderator Application &amp; Registration
              </h1>
              <p className="text-sm sm:text-base text-brand-sandstone/75 max-w-2xl mx-auto leading-relaxed">
                Empower a safe, authentic, and culturally nuanced platform for millions across the Caribbean islands and global diaspora.
              </p>
            </div>

            {/* Application Card */}
            <div className="bg-brand-twilight/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Identity & Contact */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black tracking-widest text-brand-caribbeanSea uppercase flex items-center gap-2">
                    <FileCheck className="w-4 h-4" /> 1. Identity &amp; Contact Information
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-brand-sandstone/80">Full Legal Name</label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Maya Sterling"
                        className="w-full bg-[#081020] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-brand-sandstone placeholder-slate-600 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-brand-sandstone/80">Official Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="moderator.candidate@example.com"
                        className="w-full bg-[#081020] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-brand-sandstone placeholder-slate-600 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Cultural & Regional Alignment */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-black tracking-widest text-brand-goldenHour uppercase flex items-center gap-2">
                    <Globe className="w-4 h-4" /> 2. Regional Coverage &amp; Island Diaspora
                  </h3>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-sandstone/80">Primary Regional Focus</label>
                    <select
                      value={formData.diasporaRegion}
                      onChange={(e) => setFormData({ ...formData, diasporaRegion: e.target.value })}
                      className="w-full bg-[#081020] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                    >
                      {DIASPORA_REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cultural Dialects */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-brand-sandstone/80 flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                      Fluent Languages &amp; Caribbean Dialects (Select all that apply)
                    </label>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {DIALECT_OPTIONS.map((dialect) => {
                        const active = formData.dialects.includes(dialect);
                        return (
                          <button
                            type="button"
                            key={dialect}
                            onClick={() => toggleDialect(dialect)}
                            className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold text-left transition-all border ${
                              active
                                ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea text-white shadow-sm'
                                : 'bg-[#081020] border-slate-800 text-brand-sandstone/70 hover:border-slate-700'
                            }`}
                          >
                            <span>{dialect}</span>
                            {active && <CheckCircle2 className="w-4 h-4 text-brand-caribbeanSea" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Moderation Experience */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-black tracking-widest text-brand-sunriseCoral uppercase flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4" /> 3. Experience &amp; Motivation
                  </h3>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-sandstone/80">
                      Why are you passionate about moderating the Tukubi Caribbean Community?
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Describe your background, community leadership, or experience handling sensitive cultural disputes..."
                      className="w-full bg-[#081020] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-brand-sandstone placeholder-slate-600 focus:outline-none focus:border-brand-caribbeanSea resize-none"
                    />
                  </div>
                </div>

                {/* 4. Guardian Code of Ethics & Strict Auditing */}
                <div className="space-y-3 pt-4 border-t border-slate-800 bg-[#081020]/60 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-start gap-3">
                    <input
                      id="agreeEthics"
                      type="checkbox"
                      required
                      checked={formData.agreeEthics}
                      onChange={(e) => setFormData({ ...formData, agreeEthics: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-caribbeanSea focus:ring-brand-caribbeanSea"
                    />
                    <label htmlFor="agreeEthics" className="text-xs text-brand-sandstone/80 leading-relaxed cursor-pointer">
                      I agree to uphold the <strong>Tukubi Cultural Trust &amp; Safety Code</strong>: non-partisan, objective, culturally empathetic, and free from discrimination.
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      id="agreeAuditing"
                      type="checkbox"
                      required
                      checked={formData.agreeAuditing}
                      onChange={(e) => setFormData({ ...formData, agreeAuditing: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-caribbeanSea focus:ring-brand-caribbeanSea"
                    />
                    <label htmlFor="agreeAuditing" className="text-xs text-brand-sandstone/80 leading-relaxed cursor-pointer">
                      I acknowledge that all moderation actions are <strong>cryptographically logged &amp; audited</strong> by the Chief Trust &amp; Safety Office.
                    </label>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !formData.agreeEthics || !formData.agreeAuditing}
                    className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-slate-950 bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral hover:opacity-95 disabled:opacity-50 transition-all shadow-xl shadow-brand-caribbeanSea/25 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <span>Encrypting &amp; Submitting...</span>
                    ) : (
                      <>
                        <span>Submit Moderator Application</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ── Official Dark Footer (Image 2) ── */}
      <AdminFooter systemRole="Moderator Candidate" />
    </div>
  );
}
