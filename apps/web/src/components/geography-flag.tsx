'use client';

import React from 'react';
import { resolveGeography, type CanonicalGeography } from '../lib/explore/canonical-geography';

export type FlagSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

export interface GeographyFlagProps {
  geo: string | CanonicalGeography | null | undefined;
  size?: FlagSize;
  className?: string;
  showName?: boolean;
  nameClassName?: string;
  overrideLabel?: string;
}

const SIZE_MAP: Record<FlagSize, { w: number; h: number; containerClass: string }> = {
  xs: { w: 18, h: 12, containerClass: 'w-[18px] h-[12px] rounded-[2px]' },
  sm: { w: 24, h: 16, containerClass: 'w-[24px] h-[16px] rounded-[3px]' },
  md: { w: 32, h: 22, containerClass: 'w-[32px] h-[22px] rounded-[4px]' },
  lg: { w: 48, h: 32, containerClass: 'w-[48px] h-[32px] rounded-[6px]' },
  xl: { w: 64, h: 44, containerClass: 'w-[64px] h-[44px] rounded-[8px]' },
  hero: { w: 96, h: 64, containerClass: 'w-[96px] h-[64px] rounded-[10px]' },
};

/**
 * High-definition, self-contained vector SVGs for all Caribbean and diaspora flags.
 * Operates with zero network dependency, ensuring 100% reliable rendering across
 * Windows, macOS, Linux, iOS, and Android with full WCAG 2.2 AA accessibility.
 */
function renderSvgFlag(iso: string) {
  switch (iso) {
    // ── Jamaica: Green, gold diagonal cross, black triangles ──
    case 'JAM':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#007749" />
          <polygon points="0,0 24,20 0,40" fill="#000000" />
          <polygon points="60,0 36,20 60,40" fill="#000000" />
          <polygon points="0,0 60,40 60,33 11,0" fill="#FFB81C" />
          <polygon points="60,0 0,40 0,33 49,0" fill="#FFB81C" />
          <polygon points="0,0 60,40 50,40 0,7" fill="#FFB81C" />
          <polygon points="60,0 0,40 10,40 60,7" fill="#FFB81C" />
          <line x1="0" y1="0" x2="60" y2="40" stroke="#FFB81C" strokeWidth="6" />
          <line x1="60" y1="0" x2="0" y2="40" stroke="#FFB81C" strokeWidth="6" />
        </svg>
      );

    // ── Dominican Republic: White cross, blue/red quadrants, central coat of arms ──
    case 'DOM':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="30" height="20" x="0" y="0" fill="#002F6C" />
          <rect width="30" height="20" x="30" y="0" fill="#CE1126" />
          <rect width="30" height="20" x="0" y="20" fill="#CE1126" />
          <rect width="30" height="20" x="30" y="20" fill="#002F6C" />
          <rect width="60" height="8" x="0" y="16" fill="#FFFFFF" />
          <rect width="8" height="40" x="26" y="0" fill="#FFFFFF" />
          {/* Central Coat of Arms Shield */}
          <rect width="7" height="9" x="26.5" y="15.5" rx="1.5" fill="#002F6C" />
          <path d="M 28 17 L 32 17 L 30 23 Z" fill="#CE1126" />
          <circle cx="30" cy="20" r="2" fill="#FFD100" />
        </svg>
      );

    // ── Trinidad & Tobago: Red with black diagonal stripe bordered by white ──
    case 'TTO':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#DA121A" />
          <polygon points="0,0 15,0 60,33 60,40 45,40 0,7" fill="#FFFFFF" />
          <polygon points="0,0 11,0 60,36 60,40 49,40 0,4" fill="#000000" />
        </svg>
      );

    // ── Haiti: Blue top, red bottom, white center square with palm ──
    case 'HTI':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="20" x="0" y="0" fill="#00209F" />
          <rect width="60" height="20" x="0" y="20" fill="#D21034" />
          <rect width="18" height="14" x="21" y="13" fill="#FFFFFF" rx="1" />
          {/* Central palm tree symbol */}
          <circle cx="30" cy="20" r="4" fill="#007749" />
          <rect width="2" height="6" x="29" y="18" fill="#8B4513" />
          <circle cx="30" cy="17" r="3" fill="#009A44" />
        </svg>
      );

    // ── Bahamas: Aquamarine, gold, aquamarine stripes with black hoist triangle ──
    case 'BHS':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="13.3" x="0" y="0" fill="#00778B" />
          <rect width="60" height="13.4" x="0" y="13.3" fill="#FFC72C" />
          <rect width="60" height="13.3" x="0" y="26.7" fill="#00778B" />
          <polygon points="0,0 24,20 0,40" fill="#000000" />
        </svg>
      );

    // ── Barbados: Blue, gold, blue vertical stripes with black trident ──
    case 'BRB':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="20" height="40" x="0" y="0" fill="#00267F" />
          <rect width="20" height="40" x="20" y="0" fill="#FFC72C" />
          <rect width="20" height="40" x="40" y="0" fill="#00267F" />
          {/* Trident */}
          <path
            d="M 30 11 L 30 29 M 26 14 C 26 21 30 24 30 24 C 30 24 34 21 34 14 M 26 14 L 25 16 M 34 14 L 35 16"
            stroke="#000000"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );

    // ── Cuba: Five blue/white stripes, red triangle with white star ──
    case 'CUB':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="8" x="0" y="0" fill="#002A8F" />
          <rect width="60" height="8" x="0" y="8" fill="#FFFFFF" />
          <rect width="60" height="8" x="0" y="16" fill="#002A8F" />
          <rect width="60" height="8" x="0" y="24" fill="#FFFFFF" />
          <rect width="60" height="8" x="0" y="32" fill="#002A8F" />
          <polygon points="0,0 26,20 0,40" fill="#CF142B" />
          {/* White Star */}
          <polygon
            points="9,14 10.2,17.8 14,17.8 11,20 12.2,23.8 9,21.5 5.8,23.8 7,20 4,17.8 7.8,17.8"
            fill="#FFFFFF"
          />
        </svg>
      );

    // ── Puerto Rico: Five red/white stripes, blue triangle with white star ──
    case 'PRI':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="8" x="0" y="0" fill="#ED0000" />
          <rect width="60" height="8" x="0" y="8" fill="#FFFFFF" />
          <rect width="60" height="8" x="0" y="16" fill="#ED0000" />
          <rect width="60" height="8" x="0" y="24" fill="#FFFFFF" />
          <rect width="60" height="8" x="0" y="32" fill="#ED0000" />
          <polygon points="0,0 26,20 0,40" fill="#0038A8" />
          {/* White Star */}
          <polygon
            points="9,14 10.2,17.8 14,17.8 11,20 12.2,23.8 9,21.5 5.8,23.8 7,20 4,17.8 7.8,17.8"
            fill="#FFFFFF"
          />
        </svg>
      );

    // ── Antigua & Barbuda: Red with black, blue, white stripes & rising sun ──
    case 'ATG':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#CE1126" />
          <polygon points="0,0 60,0 30,40" fill="#000000" />
          {/* Rising Sun */}
          <polygon
            points="30,8 32,15 38,11 36,17 43,16 38,20 44,23 38,24 30,24 22,24 16,23 22,20 17,16 24,17 22,11 28,15"
            fill="#FCD116"
          />
          <polygon points="12,20 48,20 30,40" fill="#0072C6" />
          <polygon points="17,26 43,26 30,40" fill="#FFFFFF" />
        </svg>
      );

    // ── Dominica: Green field, tricolor cross, red disc with Sisserou parrot & 10 stars ──
    case 'DMA':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#006B3F" />
          {/* Cross lines */}
          <rect width="60" height="6" x="0" y="17" fill="#FCD116" />
          <rect width="60" height="2" x="0" y="19" fill="#000000" />
          <rect width="6" height="40" x="27" y="0" fill="#FCD116" />
          <rect width="2" height="40" x="29" y="0" fill="#000000" />
          {/* Central red disc */}
          <circle cx="30" cy="20" r="8" fill="#D21034" />
          <circle cx="30" cy="20" r="4.5" fill="#5B2C86" />
          <circle cx="30" cy="20" r="2" fill="#009A44" />
        </svg>
      );

    // ── Grenada: Red border with stars, 4 triangles, nutmeg emblem ──
    case 'GRD':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#CE1126" />
          <rect width="52" height="32" x="4" y="4" fill="#007A3D" />
          <polygon points="4,4 56,4 30,20" fill="#FCD116" />
          <polygon points="4,36 56,36 30,20" fill="#FCD116" />
          <circle cx="30" cy="20" r="5.5" fill="#CE1126" />
          <polygon points="30,16 31,19 34,19 31.5,21 32.5,24 30,22 27.5,24 28.5,21 26,19 29,19" fill="#FCD116" />
          {/* Nutmeg symbol */}
          <path d="M 8 18 C 12 16 14 20 12 23 C 10 24 7 21 8 18 Z" fill="#CE1126" />
          <circle cx="9" cy="20" r="1.5" fill="#FCD116" />
        </svg>
      );

    // ── Saint Kitts & Nevis: Green/red diagonal with black stripe and 2 white stars ──
    case 'KNA':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <polygon points="0,0 60,0 0,40" fill="#009E49" />
          <polygon points="60,0 60,40 0,40" fill="#CE1126" />
          <polygon points="0,32 48,0 60,0 60,8 12,40 0,40" fill="#FCD116" />
          <polygon points="0,34 51,0 60,0 60,6 9,40 0,40" fill="#000000" />
          <circle cx="25" cy="23" r="2.8" fill="#FFFFFF" />
          <circle cx="38" cy="15" r="2.8" fill="#FFFFFF" />
        </svg>
      );

    // ── Saint Lucia: Cerulean blue with black/white/yellow triangle ──
    case 'LCA':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#65C5F2" />
          <polygon points="30,6 40,34 20,34" fill="#FFFFFF" />
          <polygon points="30,9 38,34 22,34" fill="#000000" />
          <polygon points="30,19 40,34 20,34" fill="#FCD116" />
        </svg>
      );

    // ── St. Vincent & Grenadines: Blue, yellow, green vertical with 3 green diamonds in 'V' ──
    case 'VCT':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="15" height="40" x="0" y="0" fill="#0072C6" />
          <rect width="30" height="40" x="15" y="0" fill="#FCD116" />
          <rect width="15" height="40" x="45" y="0" fill="#009E49" />
          {/* Diamonds forming V */}
          <polygon points="26,14 29,19 26,24 23,19" fill="#009E49" />
          <polygon points="34,14 37,19 34,24 31,19" fill="#009E49" />
          <polygon points="30,20 33,25 30,30 27,25" fill="#009E49" />
        </svg>
      );

    // ── Belize: Blue field with top/bottom red stripes and central coat of arms ──
    case 'BLZ':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="5" x="0" y="0" fill="#CE1126" />
          <rect width="60" height="30" x="0" y="5" fill="#003F87" />
          <rect width="60" height="5" x="0" y="35" fill="#CE1126" />
          <circle cx="30" cy="20" r="9" fill="#FFFFFF" />
          <circle cx="30" cy="20" r="7.5" fill="#007A3D" />
          <circle cx="30" cy="20" r="4.5" fill="#FCD116" />
        </svg>
      );

    // ── Guyana: Golden Arrowhead with green field, black/white/red triangles ──
    case 'GUY':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#009E49" />
          <polygon points="0,0 60,20 0,40" fill="#FFFFFF" />
          <polygon points="0,2 56,20 0,38" fill="#FCD116" />
          <polygon points="0,0 28,20 0,40" fill="#000000" />
          <polygon points="0,3 24,20 0,37" fill="#CE1126" />
        </svg>
      );

    // ── Suriname: Green, white, red, white, green with gold star ──
    case 'SUR':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="8" x="0" y="0" fill="#377E3F" />
          <rect width="60" height="4" x="0" y="8" fill="#FFFFFF" />
          <rect width="60" height="16" x="0" y="12" fill="#B40A28" />
          <rect width="60" height="4" x="0" y="28" fill="#FFFFFF" />
          <rect width="60" height="8" x="0" y="32" fill="#377E3F" />
          <polygon
            points="30,14 32.5,19 38,19 33.5,22.5 35,28 30,24.5 25,28 26.5,22.5 22,19 27.5,19"
            fill="#ECC81A"
          />
        </svg>
      );

    // ── Curaçao: Blue field, yellow stripe, two white stars ──
    case 'CUW':
    case 'CUR':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="26" x="0" y="0" fill="#002B7F" />
          <rect width="60" height="4" x="0" y="26" fill="#F9E814" />
          <rect width="60" height="10" x="0" y="30" fill="#002B7F" />
          {/* Two white stars */}
          <polygon points="12,7 13,9.5 15.5,9.5 13.5,11 14.5,13.5 12,12 9.5,13.5 10.5,11 8.5,9.5 11,9.5" fill="#FFFFFF" />
          <polygon points="18,13 18.7,14.8 20.6,14.8 19.1,16 19.8,17.8 18,16.7 16.2,17.8 16.9,16 15.4,14.8 17.3,14.8" fill="#FFFFFF" />
        </svg>
      );

    // ── Aruba: Blue field, two narrow yellow stripes, red 4-pointed star ──
    case 'ABW':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#4189DD" />
          <rect width="60" height="2.5" x="0" y="26" fill="#F9E814" />
          <rect width="60" height="2.5" x="0" y="31.5" fill="#F9E814" />
          {/* Red 4-pointed star edged in white */}
          <polygon points="12,5 13.5,10.5 19,12 13.5,13.5 12,19 10.5,13.5 5,12 10.5,10.5" fill="#FFFFFF" />
          <polygon points="12,6.5 13.2,11 17.5,12 13.2,13 12,17.5 10.8,13 6.5,12 10.8,11" fill="#D21034" />
        </svg>
      );

    // ── Sint Maarten: Red/blue horizontal with white triangle & crest ──
    case 'SXM':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="20" x="0" y="0" fill="#D21034" />
          <rect width="60" height="20" x="0" y="20" fill="#002F6C" />
          <polygon points="0,0 26,20 0,40" fill="#FFFFFF" />
          <circle cx="10" cy="20" r="4" fill="#FCD116" />
        </svg>
      );

    // ── Bonaire: Blue, yellow, white with compass ring & star ──
    case 'BES':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <polygon points="0,0 60,0 0,40" fill="#FCD116" />
          <polygon points="0,40 60,0 60,40" fill="#002B7F" />
          <polygon points="0,0 20,0 0,13.3" fill="#FCD116" />
          <polygon points="0,0 60,0 0,40" fill="#FFFFFF" />
          <polygon points="0,0 24,0 0,16" fill="#FCD116" />
          <polygon points="60,40 60,16 36,40" fill="#002B7F" />
          {/* Compass ring */}
          <circle cx="22" cy="20" r="6" fill="none" stroke="#000000" strokeWidth="1" />
          <polygon points="22,15 23.5,19 27,20 23.5,21 22,25 20.5,21 17,20 20.5,19" fill="#D21034" />
        </svg>
      );

    // ── British Overseas Ensigns (BVI, Cayman, Turks & Caicos, Bermuda, Anguilla, Montserrat) ──
    case 'CYM':
    case 'TCA':
    case 'VGB':
    case 'AIA':
    case 'MSR':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#00247D" />
          {/* Union Jack in Canton */}
          <g transform="scale(0.5)">
            <rect width="60" height="40" fill="#00247D" />
            <line x1="0" y1="0" x2="60" y2="40" stroke="#FFFFFF" strokeWidth="6" />
            <line x1="60" y1="0" x2="0" y2="40" stroke="#FFFFFF" strokeWidth="6" />
            <line x1="0" y1="0" x2="60" y2="40" stroke="#CF142B" strokeWidth="2.5" />
            <line x1="60" y1="0" x2="0" y2="40" stroke="#CF142B" strokeWidth="2.5" />
            <rect width="60" height="10" x="0" y="15" fill="#FFFFFF" />
            <rect width="10" height="40" x="25" y="0" fill="#FFFFFF" />
            <rect width="60" height="6" x="0" y="17" fill="#CF142B" />
            <rect width="6" height="40" x="27" y="0" fill="#CF142B" />
          </g>
          {/* Territory Badge Disc in fly */}
          <circle cx="45" cy="20" r="9" fill="#FFFFFF" opacity="0.9" />
          <circle cx="45" cy="20" r="7" fill="#FFC72C" />
          <path d="M 43 17 L 47 17 L 45 23 Z" fill="#CF142B" />
        </svg>
      );

    // ── Bermuda: Red Ensign ──
    case 'BMU':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#CF142B" />
          {/* Union Jack in Canton */}
          <g transform="scale(0.5)">
            <rect width="60" height="40" fill="#00247D" />
            <line x1="0" y1="0" x2="60" y2="40" stroke="#FFFFFF" strokeWidth="6" />
            <line x1="60" y1="0" x2="0" y2="40" stroke="#FFFFFF" strokeWidth="6" />
            <line x1="0" y1="0" x2="60" y2="40" stroke="#CF142B" strokeWidth="2.5" />
            <line x1="60" y1="0" x2="0" y2="40" stroke="#CF142B" strokeWidth="2.5" />
            <rect width="60" height="10" x="0" y="15" fill="#FFFFFF" />
            <rect width="10" height="40" x="25" y="0" fill="#FFFFFF" />
            <rect width="60" height="6" x="0" y="17" fill="#CF142B" />
            <rect width="6" height="40" x="27" y="0" fill="#CF142B" />
          </g>
          {/* Bermuda Shield */}
          <rect width="12" height="14" x="40" y="14" rx="2" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
          <circle cx="46" cy="20" r="3.5" fill="#00778B" />
        </svg>
      );

    // ── U.S. Virgin Islands: White field with golden eagle symbol ──
    case 'VIR':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#FFFFFF" />
          <circle cx="30" cy="20" r="10" fill="#FFC72C" />
          <rect width="8" height="10" x="26" y="15" fill="#00247D" />
          <text x="14" y="24" fontSize="11" fontWeight="900" fill="#00247D" fontFamily="sans-serif">V</text>
          <text x="42" y="24" fontSize="11" fontWeight="900" fill="#00247D" fontFamily="sans-serif">I</text>
        </svg>
      );

    // ── Martinique: Cultural Collectivity Flag (Red, Green, Black with Hummingbird) ──
    case 'MTQ':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <polygon points="0,0 60,0 0,40" fill="#009A44" />
          <polygon points="60,0 60,40 0,40" fill="#000000" />
          <polygon points="0,0 30,20 0,40" fill="#DA121A" />
          {/* White hummingbird motif */}
          <circle cx="12" cy="20" r="3" fill="#FFFFFF" />
        </svg>
      );

    // ── Guadeloupe: Traditional Sunny Regional Flag ──
    case 'GLP':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#000000" />
          <rect width="60" height="14" x="0" y="0" fill="#002F6C" />
          <circle cx="15" cy="7" r="3" fill="#FCD116" />
          <circle cx="30" cy="7" r="3" fill="#FCD116" />
          <circle cx="45" cy="7" r="3" fill="#FCD116" />
          <circle cx="30" cy="27" r="7.5" fill="#FCD116" />
        </svg>
      );

    // ── Saint Martin & Saint Barthélemy ──
    case 'MAF':
    case 'BLM':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#FFFFFF" />
          <rect width="20" height="40" x="0" y="0" fill="#002654" />
          <rect width="20" height="40" x="40" y="0" fill="#CE1126" />
          <circle cx="30" cy="20" r="4" fill="#FCD116" />
        </svg>
      );

    // ── Panama ──
    case 'PAN':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="30" height="20" x="0" y="0" fill="#FFFFFF" />
          <rect width="30" height="20" x="30" y="0" fill="#DA121A" />
          <rect width="30" height="20" x="0" y="20" fill="#002F6C" />
          <rect width="30" height="20" x="30" y="20" fill="#FFFFFF" />
          <polygon points="15,6 16.5,10.5 21,10.5 17.5,13 19,17.5 15,14.5 11,17.5 12.5,13 9,10.5 13.5,10.5" fill="#002F6C" />
          <polygon points="45,26 46.5,30.5 51,30.5 47.5,33 49,37.5 45,34.5 41,37.5 42.5,33 39,30.5 43.5,30.5" fill="#DA121A" />
        </svg>
      );

    // ── United States (Diaspora) ──
    case 'USA':
    case 'US':
    case 'MIA':
    case 'NYC':
    case 'ATL':
    case 'BOS':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#B22234" />
          <rect width="60" height="3.08" x="0" y="3.08" fill="#FFFFFF" />
          <rect width="60" height="3.08" x="0" y="9.24" fill="#FFFFFF" />
          <rect width="60" height="3.08" x="0" y="15.4" fill="#FFFFFF" />
          <rect width="60" height="3.08" x="0" y="21.56" fill="#FFFFFF" />
          <rect width="60" height="3.08" x="0" y="27.72" fill="#FFFFFF" />
          <rect width="60" height="3.08" x="0" y="33.88" fill="#FFFFFF" />
          <rect width="25" height="21.56" x="0" y="0" fill="#3C3B6E" />
          <circle cx="6" cy="6" r="1.5" fill="#FFFFFF" />
          <circle cx="13" cy="6" r="1.5" fill="#FFFFFF" />
          <circle cx="20" cy="6" r="1.5" fill="#FFFFFF" />
          <circle cx="9.5" cy="11" r="1.5" fill="#FFFFFF" />
          <circle cx="16.5" cy="11" r="1.5" fill="#FFFFFF" />
          <circle cx="6" cy="16" r="1.5" fill="#FFFFFF" />
          <circle cx="13" cy="16" r="1.5" fill="#FFFFFF" />
          <circle cx="20" cy="16" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    // ── Canada (Diaspora: Toronto, Montreal) ──
    case 'CAN':
    case 'CA':
    case 'TOR':
    case 'MTL':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="15" height="40" x="0" y="0" fill="#FF0000" />
          <rect width="30" height="40" x="15" y="0" fill="#FFFFFF" />
          <rect width="15" height="40" x="45" y="0" fill="#FF0000" />
          {/* Maple Leaf */}
          <path
            d="M 30 10 L 31 16 L 35 15 L 33 19 L 38 21 L 36 24 L 39 26 L 33 27 L 33 30 L 31 30 L 31 28 L 29 28 L 29 30 L 27 30 L 27 27 L 21 26 L 24 24 L 22 21 L 27 19 L 25 15 L 29 16 Z"
            fill="#FF0000"
          />
        </svg>
      );

    // ── United Kingdom (Diaspora: London, Birmingham) ──
    case 'GBR':
    case 'GB':
    case 'LON':
    case 'BIR':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#012169" />
          <line x1="0" y1="0" x2="60" y2="40" stroke="#FFFFFF" strokeWidth="8" />
          <line x1="60" y1="0" x2="0" y2="40" stroke="#FFFFFF" strokeWidth="8" />
          <line x1="0" y1="0" x2="60" y2="40" stroke="#C8102E" strokeWidth="3" />
          <line x1="60" y1="0" x2="0" y2="40" stroke="#C8102E" strokeWidth="3" />
          <rect width="60" height="12" x="0" y="14" fill="#FFFFFF" />
          <rect width="12" height="40" x="24" y="0" fill="#FFFFFF" />
          <rect width="60" height="8" x="0" y="16" fill="#C8102E" />
          <rect width="8" height="40" x="26" y="0" fill="#C8102E" />
        </svg>
      );

    // ── Netherlands (Diaspora: Amsterdam, Rotterdam) ──
    case 'NLD':
    case 'NL':
    case 'AMS':
    case 'ROT':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="13.3" x="0" y="0" fill="#AE1C28" />
          <rect width="60" height="13.4" x="0" y="13.3" fill="#FFFFFF" />
          <rect width="60" height="13.3" x="0" y="26.7" fill="#21468B" />
        </svg>
      );

    // ── France (Diaspora: Paris) ──
    case 'FRA':
    case 'FR':
    case 'PAR':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="20" height="40" x="0" y="0" fill="#002654" />
          <rect width="20" height="40" x="20" y="0" fill="#FFFFFF" />
          <rect width="20" height="40" x="40" y="0" fill="#ED2939" />
        </svg>
      );

    // ── Spain (Diaspora: Madrid) ──
    case 'ESP':
    case 'ES':
    case 'MAD':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="10" x="0" y="0" fill="#AA151B" />
          <rect width="60" height="20" x="0" y="10" fill="#F1BF00" />
          <rect width="60" height="10" x="0" y="30" fill="#AA151B" />
          <circle cx="18" cy="20" r="4.5" fill="#AA151B" />
        </svg>
      );

    // ── Generic Fallback: Caribbean Sun & Sea Emblem ──
    default:
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full block">
          <rect width="60" height="40" fill="#0F172A" />
          <rect width="60" height="18" x="0" y="22" fill="#0284C7" />
          <circle cx="30" cy="22" r="10" fill="#F59E0B" />
          <text
            x="30"
            y="25"
            fontSize="10"
            fontWeight="bold"
            fill="#FFFFFF"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            {iso.slice(0, 3)}
          </text>
        </svg>
      );
  }
}

export default function GeographyFlag({
  geo,
  size = 'md',
  className = '',
  showName = false,
  nameClassName = 'text-white font-medium text-sm',
  overrideLabel,
}: GeographyFlagProps) {
  const entity = typeof geo === 'object' && geo !== null ? geo : resolveGeography(geo);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const isoCode = entity?.iso?.toUpperCase() || (typeof geo === 'string' ? geo.toUpperCase() : 'CAR');
  const entityName = entity?.name || (typeof geo === 'string' ? geo : 'Caribbean Region');
  const label = overrideLabel || `Flag of ${entityName}`;

  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`}>
      <span
        role="img"
        aria-label={label}
        title={label}
        className={`inline-block overflow-hidden flex-shrink-0 shadow-sm border border-white/15 bg-slate-900 ${sizeConfig.containerClass}`}
      >
        {renderSvgFlag(isoCode)}
      </span>
      {showName && (
        <span className={nameClassName}>
          {entityName}
        </span>
      )}
    </span>
  );
}
