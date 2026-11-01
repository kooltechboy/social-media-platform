'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  Film,
  Music,
  Calendar,
  ShoppingBag,
  Play,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Globe,
  Zap,
  Menu,
  X,
  Heart,
  MessageCircle,
  Share2,
  Search,
  Plus,
  Home,
  User,
} from 'lucide-react';
import { TukubiLogo } from './brand/tukubi-logo';

function CaribbeanPalmEmblem({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Palm Fronds */}
      <path d="M50 48C45 32 30 25 18 28C28 36 38 42 48 50Z" fill="#FBBF24" />
      <path d="M50 48C55 32 70 25 82 28C72 36 62 42 52 50Z" fill="#FBBF24" />
      <path d="M50 46C50 28 42 16 35 12C42 22 47 32 50 46Z" fill="#FDE047" />
      <path d="M50 46C50 28 58 16 65 12C58 22 53 32 50 46Z" fill="#FDE047" />
      <path d="M50 44C49 22 50 10 50 8C51 10 51 22 50 44Z" fill="#FEF08A" />
      <path d="M48 50C34 45 20 48 12 55C24 55 36 53 48 50Z" fill="#F59E0B" />
      <path d="M52 50C66 45 80 48 88 55C76 55 64 53 52 50Z" fill="#F59E0B" />
      {/* Curved Coral Trunk */}
      <path d="M49 48C48 56 47 65 44 75C46 75 48 75 50 75C51 65 52 56 51 48Z" fill="#FB7185" />
      {/* Cyan & Ocean Waves */}
      <path d="M15 82C28 74 42 82 55 76C68 70 82 78 90 74C82 82 68 86 55 82C42 88 28 80 15 82Z" fill="#06B6D4" />
      <path d="M10 88C25 82 40 88 55 84C70 80 85 86 92 82C84 90 69 94 55 90C41 96 25 88 10 88Z" fill="#0284C7" />
    </svg>
  );
}

export default function PublicFrontDoor() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* ========================================================================= */}
      {/* TOP NAVIGATION BAR                                                        */}
      {/* ========================================================================= */}
      <header className="relative z-30 w-full border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <TukubiLogo size="md" variant="horizontal" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="/" className="text-white hover:text-pink-400 transition-colors">
              Home
            </Link>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <Link href="/login?next=/creator-studio" className="hover:text-white transition-colors">
              Creators
            </Link>
            <Link href="/login?next=/marketplace" className="hover:text-white transition-colors">
              Businesses
            </Link>
          </nav>

          {/* Desktop Auth CTA Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all"
            >
              Log In
            </Link>
            <Link
              href="/login?signup=true"
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/25 transition-all"
            >
              Join TUKUBI
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-violet-600"
            >
              Log In
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/10 bg-slate-950/95 backdrop-blur-xl px-4 py-5 space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-white hover:text-pink-400 py-1"
            >
              Home
            </Link>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-300 hover:text-white py-1"
            >
              About
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-300 hover:text-white py-1"
            >
              Features
            </a>
            <Link
              href="/login?next=/creator-studio"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-300 hover:text-white py-1"
            >
              Creators
            </Link>
            <Link
              href="/login?next=/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-300 hover:text-white py-1"
            >
              Businesses
            </Link>
            <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
              <Link
                href="/login?signup=true"
                className="w-full text-center py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg"
              >
                Join TUKUBI
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION WITH CARIBBEAN BACKDROP & PHONE MOCKUP                       */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8">
        {/* Scenic Caribbean Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/backgrounds/sunset-shore.jpg"
            alt="Scenic Caribbean tropical horizon"
            fill
            priority
            className="object-cover object-center scale-105"
          />
          {/* Gradient Scrims for Perfect Text Contrast & Caribbean Warmth */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Subtitle, Action Pills & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
              The Caribbean<br />Connected.
            </h1>

            <p className="mt-4 text-lg sm:text-xl text-slate-200 max-w-lg leading-relaxed font-normal">
              A simple, powerful platform for the Caribbean and our global community.
            </p>

            {/* 5 Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-8">
              <Link href="/login" className="flex flex-col items-center gap-1.5 text-center group">
                <div className="w-11 h-11 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white/20 group-hover:scale-105 transition-all">
                  <Play className="w-4 h-4 ml-0.5 fill-white" />
                </div>
                <span className="text-xs font-medium text-slate-200">Share</span>
              </Link>

              <Link href="/login" className="flex flex-col items-center gap-1.5 text-center group">
                <div className="w-11 h-11 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white/20 group-hover:scale-105 transition-all">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-200">Connect</span>
              </Link>

              <Link href="/login" className="flex flex-col items-center gap-1.5 text-center group">
                <div className="w-11 h-11 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white/20 group-hover:scale-105 transition-all">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-200">Create</span>
              </Link>

              <Link href="/login" className="flex flex-col items-center gap-1.5 text-center group">
                <div className="w-11 h-11 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white/20 group-hover:scale-105 transition-all">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-200">Buy & Sell</span>
              </Link>

              <Link href="/login" className="flex flex-col items-center gap-1.5 text-center group">
                <div className="w-11 h-11 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white/20 group-hover:scale-105 transition-all">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-200">Discover</span>
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <Link
                href="/login?signup=true"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-xl shadow-pink-500/30 hover:scale-105 transition-all text-sm sm:text-base"
              >
                Join the Movement <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-full font-semibold text-white bg-slate-900/60 hover:bg-slate-800/80 border border-white/20 backdrop-blur-md transition-all text-sm sm:text-base"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Right Column: Sleek iPhone Mobile App Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-[280px] sm:w-[320px] aspect-[9/18.5] rounded-[48px] bg-slate-900 p-3 shadow-2xl shadow-purple-950/50 ring-1 ring-white/20">
              {/* Screen Glass */}
              <div className="w-full h-full rounded-[38px] overflow-hidden relative flex flex-col bg-slate-950">
                {/* Dynamic Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-24 h-5 bg-black rounded-full" />

                {/* Status Bar */}
                <div className="relative z-20 pt-2 px-6 flex items-center justify-between text-[11px] font-semibold text-white/90">
                  <span>3:31</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">5G</span>
                    <div className="w-4 h-2 rounded-sm border border-white/80 p-0.5">
                      <div className="w-full h-full bg-white rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Mobile App Navigation Header */}
                <div className="relative z-20 pt-3 px-4 pb-2 flex items-center justify-between border-b border-white/10">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                      T
                    </div>
                    <span className="font-extrabold tracking-wider text-xs text-white">TUKUBI</span>
                  </div>
                  <Menu className="w-5 h-5 text-white/90" />
                </div>

                {/* For You / Following Tabs */}
                <div className="relative z-20 py-2 flex items-center justify-center gap-3">
                  <span className="text-xs font-bold text-white px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
                    For You
                  </span>
                  <span className="text-xs font-medium text-white/70 px-2 py-1">
                    Following
                  </span>
                </div>

                {/* Mobile Feed Video Content (Island Sunset) */}
                <div className="relative flex-1 w-full overflow-hidden">
                  <Image
                    src="/backgrounds/sunset-shore.jpg"
                    alt="Caribbean video content"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

                  {/* Centered Frosted Play Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform cursor-pointer">
                      <Play className="w-6 h-6 ml-1 fill-white" />
                    </div>
                  </div>

                  {/* Right Action Rail (Heart, Comment, Share) */}
                  <div className="absolute right-3 bottom-6 flex flex-col items-center gap-4 text-white">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      </div>
                      <span className="text-[10px] font-bold">1.2K</span>
                    </div>

                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold">184</span>
                    </div>

                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold">Share</span>
                    </div>
                  </div>
                </div>

                {/* Mobile App Bottom Tab Bar */}
                <div className="relative z-20 py-2.5 px-5 bg-black/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between text-white/70">
                  <Home className="w-4 h-4 text-white" />
                  <Search className="w-4 h-4" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <Film className="w-4 h-4" />
                  <User className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: EVERYTHING YOU LOVE IN ONE PLACE (CLEAN LIGHT SURFACE)          */}
      {/* ========================================================================= */}
      <section id="features" className="relative z-10 bg-white text-slate-900 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header with Accent Glow Underline */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Everything You Love in One Place
            </h2>
            <div className="w-16 h-1.5 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto mt-4 rounded-full shadow-sm" />
          </div>

          {/* 5 Clean Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* 1. Community */}
            <div className="bg-slate-50/70 hover:bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">Community</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Connect with real people.
              </p>
            </div>

            {/* 2. Shorts */}
            <div className="bg-slate-50/70 hover:bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Film className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">Shorts</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Create and discover videos.
              </p>
            </div>

            {/* 3. Music */}
            <div className="bg-slate-50/70 hover:bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Music className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">Music</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Share and stream Caribbean sounds.
              </p>
            </div>

            {/* 4. Events */}
            <div className="bg-slate-50/70 hover:bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">Events</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Find real events across the region.
              </p>
            </div>

            {/* 5. Marketplace */}
            <div className="bg-slate-50/70 hover:bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">Marketplace</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Buy, sell and support Caribbean businesses.
              </p>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* SECTION 3: HIGH-IMPACT ISLAND CTA BANNER                              */}
          {/* ===================================================================== */}
          <div className="mt-16 sm:mt-24 rounded-3xl bg-gradient-to-r from-[#110B2D] via-[#1C1045] to-[#2B0E4C] p-8 sm:p-12 lg:p-14 text-white shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 border border-white/10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 sm:gap-6">
              <div className="shrink-0">
                <CaribbeanPalmEmblem className="w-20 h-20 sm:w-24 sm:h-24" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                  Built for the Caribbean.
                </h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-200 mt-1">
                  Open to the World.
                </p>
              </div>
            </div>

            <Link
              href="/login?signup=true"
              className="shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-xl shadow-pink-500/30 hover:scale-105 transition-all text-base sm:text-lg whitespace-nowrap"
            >
              Create Your Account <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* ===================================================================== */}
          {/* SECTION 4: 3 TRUST & VALUE PILLARS                                    */}
          {/* ===================================================================== */}
          <div id="about" className="mt-16 sm:mt-20 pt-12 border-t border-slate-100 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Safe & Secure */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full border border-blue-200 bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Safe & Secure</h4>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Your privacy and content matter.
                </p>
              </div>
            </div>

            {/* Simple & Easy */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full border border-purple-200 bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Simple & Easy</h4>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  A clean, familiar experience on mobile and desktop.
                </p>
              </div>
            </div>

            {/* Caribbean First */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Caribbean First</h4>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Our people, culture and creativity at the center.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="relative bg-slate-950 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-t border-white/10 overflow-hidden">
        {/* Subtle decorative bottom wave accent */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[150px] bg-gradient-to-t from-pink-600/10 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-3">
            <TukubiLogo size="md" variant="horizontal" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/safety" className="hover:text-white transition-colors">
              Safety
            </Link>
            <Link href="/help" className="hover:text-white transition-colors">
              Help Center
            </Link>
            <Link href="/trust-safety" className="hover:text-white transition-colors">
              Trust & Safety
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
