'use client';

import React from 'react';

export default function CaribbeanSunsetBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* High Definition SVG Caribbean Beach Sunset Backdrop */}
      <svg
        className="absolute inset-0 w-full h-full object-cover opacity-45 min-w-[1000px] min-h-[1000px]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Sunset Sky Gradient */}
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="35%" stopColor="#1C2541" />
            <stop offset="60%" stopColor="#3A506B" />
            <stop offset="80%" stopColor="#B56576" />
            <stop offset="92%" stopColor="#E56B6F" />
            <stop offset="100%" stopColor="#EAAC8B" />
          </linearGradient>

          {/* Sun Radial Glow */}
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF4D0" stopOpacity="1" />
            <stop offset="25%" stopColor="#FDB813" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#F37021" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E56B6F" stopOpacity="0" />
          </radialGradient>

          {/* Sea Ocean Water Gradient */}
          <linearGradient id="seaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#0369A1" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#075985" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0C4A6E" stopOpacity="0.95" />
          </linearGradient>

          {/* Sun Water Reflection */}
          <linearGradient id="sunReflection" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF4D0" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FDB813" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Sky Base */}
        <rect width="1440" height="900" fill="url(#skyGrad)" />

        {/* 2. Sun Disk on Horizon */}
        <circle cx="720" cy="480" r="140" fill="url(#sunGlow)" />
        <circle cx="720" cy="480" r="45" fill="#FFFBEB" />

        {/* 3. Soft Cloud Layers */}
        <path d="M-100 380 Q 200 340 500 390 T 1100 370 T 1600 400 L 1600 500 L -100 500 Z" fill="#E56B6F" opacity="0.25" />
        <path d="M-50 420 Q 350 390 720 430 T 1500 410 L 1500 500 L -50 500 Z" fill="#B56576" opacity="0.3" />

        {/* 4. Ocean Horizon & Sea Water */}
        <rect x="0" y="480" width="1440" height="420" fill="url(#seaGrad)" />

        {/* 5. Sun Reflection Shimmer on Waves */}
        <polygon points="660,480 780,480 840,900 600,900" fill="url(#sunReflection)" />

        {/* Wave lines */}
        <path d="M 0 520 Q 360 510 720 520 T 1440 520" stroke="#FDB813" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
        <path d="M 0 560 Q 360 550 720 560 T 1440 560" stroke="#38BDF8" strokeWidth="1.2" strokeOpacity="0.3" fill="none" />
        <path d="M 0 620 Q 360 610 720 620 T 1440 620" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.25" fill="none" />
        <path d="M 0 700 Q 360 690 720 700 T 1440 700" stroke="#38BDF8" strokeWidth="2" strokeOpacity="0.2" fill="none" />

        {/* 6. Caribbean Island & Palm Silhouettes Left & Right */}
        {/* Left Palm Coast */}
        <path d="M-20 900 L -20 650 Q 80 670 140 720 Q 180 770 240 900 Z" fill="#060D1A" />
        <path d="M 60 700 Q 40 610 -30 550" stroke="#060D1A" strokeWidth="8" strokeLinecap="round" fill="none" />
        {/* Palm Fronds */}
        <path d="M -30 550 Q -90 530 -140 560 M -30 550 Q -70 490 -100 450 M -30 550 Q 20 480 60 460 M -30 550 Q 40 540 90 560" stroke="#060D1A" strokeWidth="4" fill="none" />

        {/* Right Palm Coast */}
        <path d="M1460 900 L 1460 630 Q 1360 650 1300 710 Q 1240 780 1180 900 Z" fill="#060D1A" />
        <path d="M 1360 680 Q 1390 590 1460 530" stroke="#060D1A" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M 1460 530 Q 1400 500 1340 510 M 1460 530 Q 1420 460 1390 420 M 1460 530 Q 1500 470 1540 450" stroke="#060D1A" strokeWidth="4" fill="none" />
      </svg>

      {/* Atmospheric Ambient Lighting Glows */}
      <div className="absolute top-10 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-transparent blur-[120px] animate-pulse-glow" />
      <div className="absolute top-1/2 left-10 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-sky-500/20 via-cyan-500/15 to-transparent blur-[130px]" />
    </div>
  );
}
