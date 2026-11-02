'use client';

import React from 'react';

export function CaribbeanAtmosphere() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 transform-gpu" aria-hidden="true">
      {/* ── 1. Deep Midnight Oceanic Background Canvas ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050B14] via-[#071322] to-[#040912]" />

      {/* ── 2. Atmospheric Moonlight & Bioluminescent Radial Blooms ── */}
      {/* Central moon / archipelago glow */}
      <div className="absolute top-[15%] left-[20%] w-[800px] h-[550px] rounded-full bg-gradient-to-br from-[#00C2A8]/12 via-[#0EA5E9]/10 to-transparent blur-[140px]" />
      
      {/* Horizon twilight ocean glow */}
      <div className="absolute bottom-[20%] left-0 right-0 h-[280px] bg-gradient-to-t from-[#00C2A8]/10 via-[#0EA5E9]/8 to-transparent blur-[90px]" />

      {/* Subtle Caribbean sunrise amber warmth in far distance */}
      <div className="absolute top-[35%] left-[38%] w-[400px] h-[250px] rounded-full bg-[#F4AE45]/6 blur-[120px]" />

      {/* Deep twilight purple bloom on the right */}
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#8B5CF6]/8 blur-[160px]" />

      {/* ── 3. SVG Layer: Palm Framing, Archipelago Constellation & Wave Ribbons ── */}
      <svg
        viewBox="0 0 1600 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Bioluminescent glowing cyan gradient */}
          <linearGradient id="cyanGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5C9" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#00C2A8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.7" />
          </linearGradient>

          {/* Faint network connection line gradient */}
          <linearGradient id="networkLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E5C9" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#00C2A8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.5" />
          </linearGradient>

          {/* Bioluminescent wave ribbon gradient */}
          <linearGradient id="waveRibbonGrad1" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#00C2A8" stopOpacity="0.0" />
            <stop offset="25%" stopColor="#00E5C9" stopOpacity="0.65" />
            <stop offset="60%" stopColor="#0EA5E9" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#00C2A8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00C2A8" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="waveRibbonGrad2" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.0" />
            <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#00C2A8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
          </linearGradient>

          {/* Water reflection shimmer gradient */}
          <radialGradient id="waterReflectionGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00E5C9" stopOpacity="0.3" />
            <stop offset="40%" stopColor="#0EA5E9" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#071322" stopOpacity="0" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="intenseGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── ARCHIPELAGO NETWORK MAP (Glowing Caribbean Constellation) ── */}
        <g id="caribbean-network" filter="url(#softGlow)" opacity="0.95">
          {/* Faint archipelago contour landmass traces */}
          {/* Cuba */}
          <path
            d="M 230 200 C 270 190, 340 220, 390 230 C 420 236, 450 250, 480 255 C 470 265, 430 260, 390 250 C 330 240, 280 225, 230 200 Z"
            fill="none"
            stroke="#00E5C9"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            strokeDasharray="1 3"
          />
          {/* Hispaniola (Haiti / Dominican Republic) */}
          <path
            d="M 495 258 C 530 250, 580 255, 620 262 C 630 275, 590 285, 545 285 C 520 282, 495 272, 495 258 Z"
            fill="none"
            stroke="#00E5C9"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            strokeDasharray="1 3"
          />
          {/* Jamaica */}
          <path
            d="M 390 285 C 415 282, 435 288, 440 294 C 425 298, 400 297, 390 285 Z"
            fill="none"
            stroke="#00E5C9"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            strokeDasharray="1 3"
          />
          {/* Puerto Rico */}
          <path
            d="M 645 270 C 670 270, 685 274, 685 280 C 670 284, 650 283, 645 270 Z"
            fill="none"
            stroke="#00E5C9"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            strokeDasharray="1 3"
          />

          {/* Network constellation arcs linking islands */}
          <path
            d="M 230 200 Q 280 160 350 170"
            stroke="url(#networkLineGrad)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <path
            d="M 350 170 Q 420 180 495 258"
            stroke="url(#networkLineGrad)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <path
            d="M 230 200 Q 320 230 390 285"
            stroke="url(#networkLineGrad)"
            strokeWidth="1"
          />
          <path
            d="M 390 285 Q 450 275 495 258"
            stroke="url(#networkLineGrad)"
            strokeWidth="1.4"
          />
          <path
            d="M 495 258 Q 570 260 645 270"
            stroke="url(#networkLineGrad)"
            strokeWidth="1.5"
          />
          <path
            d="M 645 270 Q 690 270 715 285"
            stroke="url(#networkLineGrad)"
            strokeWidth="1.2"
          />
          {/* Leeward / Windward arc downward */}
          <path
            d="M 715 285 Q 740 310 750 340 Q 755 375 750 410 Q 745 445 755 480"
            stroke="url(#networkLineGrad)"
            strokeWidth="1.4"
            strokeDasharray="2 3"
          />
          {/* Connection to Barbados */}
          <path
            d="M 750 410 Q 785 415 805 425"
            stroke="url(#networkLineGrad)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          {/* Connection to Trinidad & Tobago */}
          <path
            d="M 755 480 Q 760 515 765 540"
            stroke="url(#networkLineGrad)"
            strokeWidth="1.3"
          />
          {/* Northern South America / ABC connection */}
          <path
            d="M 765 540 Q 660 535 560 520"
            stroke="url(#networkLineGrad)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />

          {/* ── Glowing Node Pulses ── */}
          {/* Bahamas / Nassau */}
          <circle cx="350" cy="170" r="4.5" fill="#00E5C9" filter="url(#intenseGlow)" />
          <circle cx="350" cy="170" r="1.8" fill="#FFFFFF" />

          {/* Havana, Cuba */}
          <circle cx="230" cy="200" r="5" fill="#00E5C9" filter="url(#intenseGlow)" />
          <circle cx="230" cy="200" r="2" fill="#FFFFFF" />

          {/* Kingston, Jamaica */}
          <circle cx="390" cy="285" r="5.5" fill="#00E5C9" filter="url(#intenseGlow)" />
          <circle cx="390" cy="285" r="2" fill="#FFFFFF" />

          {/* Port-au-Prince / Santo Domingo, Hispaniola */}
          <circle cx="495" cy="258" r="6" fill="#00E5C9" filter="url(#intenseGlow)" />
          <circle cx="495" cy="258" r="2.2" fill="#FFFFFF" />
          <circle cx="570" cy="265" r="5" fill="#00E5C9" filter="url(#intenseGlow)" />
          <circle cx="570" cy="265" r="1.8" fill="#FFFFFF" />

          {/* San Juan, Puerto Rico */}
          <circle cx="645" cy="270" r="5" fill="#00E5C9" filter="url(#intenseGlow)" />
          <circle cx="645" cy="270" r="2" fill="#FFFFFF" />

          {/* Virgin Islands / Leewards */}
          <circle cx="700" cy="278" r="3.5" fill="#00C2A8" />
          <circle cx="715" cy="285" r="4" fill="#00E5C9" />
          <circle cx="732" cy="305" r="3.5" fill="#00C2A8" />
          <circle cx="742" cy="330" r="4" fill="#00E5C9" />
          <circle cx="750" cy="360" r="3.5" fill="#00C2A8" />
          <circle cx="752" cy="390" r="4" fill="#00E5C9" />

          {/* Barbados */}
          <circle cx="805" cy="425" r="4.5" fill="#00E5C9" filter="url(#intenseGlow)" />
          <circle cx="805" cy="425" r="1.8" fill="#FFFFFF" />

          {/* St. Vincent & Grenada */}
          <circle cx="748" cy="430" r="3.5" fill="#00C2A8" />
          <circle cx="745" cy="460" r="4" fill="#00E5C9" />

          {/* Trinidad & Tobago */}
          <circle cx="765" cy="540" r="5.5" fill="#00E5C9" filter="url(#intenseGlow)" />
          <circle cx="765" cy="540" r="2" fill="#FFFFFF" />

          {/* Curaçao / Aruba */}
          <circle cx="560" cy="520" r="4" fill="#00C2A8" />
          <circle cx="525" cy="515" r="4" fill="#00C2A8" />
        </g>

        {/* ── DISTANT MOUNTAIN / ISLAND SILHOUETTE HORIZON ── */}
        <g id="horizon-mountains" opacity="0.6">
          {/* Far range */}
          <path
            d="M 0 680 Q 200 660 380 670 Q 550 655 720 675 Q 900 665 1100 680 Q 1350 670 1600 685 L 1600 740 L 0 740 Z"
            fill="#050C18"
          />
          {/* Closer ridge with moonlight contrast */}
          <path
            d="M 0 705 Q 180 685 340 700 Q 520 678 680 702 Q 850 690 1020 708 Q 1280 695 1600 710 L 1600 780 L 0 780 Z"
            fill="#030812"
          />
        </g>

        {/* ── MOONLIGHT WATER SHIMMER ── */}
        <ellipse
          cx="540"
          cy="735"
          rx="260"
          ry="30"
          fill="url(#waterReflectionGrad)"
          filter="url(#softGlow)"
        />

        {/* ── FLOWING BIOLUMINESCENT WAVE RIBBONS (Foreground & Midground) ── */}
        <g id="wave-ribbons" filter="url(#softGlow)">
          {/* Main glowing cyan ribbon */}
          <path
            d="M -50 820 C 300 870, 600 760, 950 850 C 1200 915, 1450 840, 1650 890"
            stroke="url(#waveRibbonGrad1)"
            strokeWidth="3.5"
            fill="none"
          />
          {/* Secondary softer wave trail */}
          <path
            d="M -20 860 C 350 800, 750 920, 1150 830 C 1380 770, 1550 850, 1650 840"
            stroke="url(#waveRibbonGrad2)"
            strokeWidth="2.5"
            fill="none"
          />
          {/* Deep ambient wave beam */}
          <path
            d="M 100 930 C 450 890, 850 950, 1250 880 C 1450 850, 1580 910, 1650 900"
            stroke="url(#waveRibbonGrad1)"
            strokeWidth="1.8"
            strokeOpacity="0.4"
            fill="none"
          />
        </g>

        {/* ── TROPICAL PALM FRONDS (Top-Left Silhouette Framing) ── */}
        <g id="palm-framing" opacity="0.9">
          {/* Palm Frond 1 (Main sweeping branch) */}
          <path
            d="M -20 -30 Q 120 40 220 140"
            stroke="#03070E"
            strokeWidth="5"
            fill="none"
          />
          {/* Leaflets for Frond 1 */}
          <path
            d="M 30 10 C 60 5, 80 25, 95 40 C 75 35, 50 25, 30 10 Z"
            fill="#030812"
          />
          <path
            d="M 60 30 C 95 20, 125 45, 145 65 C 120 58, 85 45, 60 30 Z"
            fill="#030812"
          />
          <path
            d="M 90 55 C 130 45, 165 75, 185 100 C 155 90, 120 75, 90 55 Z"
            fill="#030812"
          />
          <path
            d="M 120 85 C 165 75, 205 105, 225 135 C 190 125, 150 105, 120 85 Z"
            fill="#030812"
          />
          <path
            d="M 150 115 C 190 110, 225 140, 245 170 C 215 158, 180 140, 150 115 Z"
            fill="#030812"
          />

          {/* Palm Frond 2 (Higher hanging branch) */}
          <path
            d="M 40 -40 Q 180 10 310 80"
            stroke="#03070E"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M 90 -10 C 130 -25, 165 -5, 190 15 C 160 5, 120 0, 90 -10 Z"
            fill="#030812"
          />
          <path
            d="M 130 5 C 175 -10, 215 15, 245 40 C 210 28, 165 20, 130 5 Z"
            fill="#030812"
          />
          <path
            d="M 175 25 C 220 15, 260 45, 290 75 C 255 60, 210 48, 175 25 Z"
            fill="#030812"
          />
          <path
            d="M 220 45 C 265 40, 305 75, 335 110 C 295 95, 255 75, 220 45 Z"
            fill="#030812"
          />

          {/* Subtle cyan back-illumination on palm frond tips */}
          <path
            d="M 145 65 C 135 60, 110 50, 95 40"
            stroke="#00E5C9"
            strokeWidth="0.8"
            strokeOpacity="0.25"
            fill="none"
          />
          <path
            d="M 225 135 C 205 125, 175 110, 155 95"
            stroke="#00E5C9"
            strokeWidth="0.8"
            strokeOpacity="0.2"
            fill="none"
          />
          <path
            d="M 290 75 C 270 65, 235 50, 210 38"
            stroke="#00E5C9"
            strokeWidth="0.8"
            strokeOpacity="0.25"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
}
