'use client';

import React, { useState } from 'react';
import { Sparkles, Globe, Wallet, ShieldCheck } from 'lucide-react';
import { CARIBBEAN_TERRITORIES } from '../../lib/constants/caribbean-territories';
import { DIASPORA_CITY_HUBS } from '../../lib/constants/diaspora-hubs';

export interface IslandNode {
  iso: string;
  name: string;
  flag: string;
  x: number;
  y: number;
  r: number;
  activeUsers?: string;
}

export const ISLAND_MAP_POINTS: IslandNode[] = [
  // Greater Antilles & Lucayan
  { iso: 'BHS', name: 'Bahamas (Nassau / Freeport)', flag: '🇧🇸', x: 270, y: 190, r: 6, activeUsers: '410k' },
  { iso: 'CUB', name: 'Cuba (Havana / Santiago)', flag: '🇨🇺', x: 250, y: 280, r: 10, activeUsers: '11.2M' },
  { iso: 'CYM', name: 'Cayman Islands (George Town)', flag: '🇰🇾', x: 195, y: 340, r: 4, activeUsers: '72k' },
  { iso: 'JAM', name: 'Jamaica (Kingston / Montego Bay)', flag: '🇯🇲', x: 285, y: 375, r: 8.5, activeUsers: '2.9M' },
  { iso: 'HTI', name: 'Haiti (Port-au-Prince / Cap-Haïtien)', flag: '🇭🇹', x: 375, y: 345, r: 8.5, activeUsers: '11.4M' },
  { iso: 'DOM', name: 'Dominican Republic (Santo Domingo)', flag: '🇩🇴', x: 440, y: 345, r: 9.5, activeUsers: '10.8M' },
  { iso: 'TCA', name: 'Turks & Caicos (Providenciales)', flag: '🇹🇨', x: 420, y: 260, r: 5, activeUsers: '45k' },
  { iso: 'PRI', name: 'Puerto Rico (San Juan / Ponce)', flag: '🇵🇷', x: 530, y: 360, r: 8.5, activeUsers: '3.2M' },

  // Leeward Islands
  { iso: 'VIR', name: 'US Virgin Islands (St. Thomas / St. Croix)', flag: '🇻🇮', x: 580, y: 360, r: 4, activeUsers: '105k' },
  { iso: 'VGB', name: 'British Virgin Islands (Tortola)', flag: '🇻🇬', x: 598, y: 355, r: 4, activeUsers: '31k' },
  { iso: 'AIA', name: 'Anguilla (The Valley)', flag: '🇦🇮', x: 625, y: 350, r: 3.5, activeUsers: '16k' },
  { iso: 'SXM', name: 'Sint Maarten / Saint-Martin', flag: '🇸🇽', x: 632, y: 362, r: 4, activeUsers: '78k' },
  { iso: 'KNA', name: 'Saint Kitts & Nevis (Basseterre)', flag: '🇰🇳', x: 628, y: 388, r: 4, activeUsers: '53k' },
  { iso: 'ATG', name: 'Antigua & Barbuda (St. John\'s)', flag: '🇦🇬', x: 660, y: 385, r: 5, activeUsers: '98k' },
  { iso: 'MSR', name: 'Montserrat (Brades)', flag: '🇲🇸', x: 638, y: 410, r: 3.5, activeUsers: '5k' },
  { iso: 'GLP', name: 'Guadeloupe (Pointe-à-Pitre)', flag: '🇬🇵', x: 665, y: 425, r: 6, activeUsers: '395k' },
  { iso: 'DMA', name: 'Dominica (Roseau)', flag: '🇩🇲', x: 660, y: 460, r: 5, activeUsers: '72k' },

  // Windward Islands & Southern Caribbean
  { iso: 'MTQ', name: 'Martinique (Fort-de-France)', flag: '🇲🇶', x: 668, y: 490, r: 6, activeUsers: '375k' },
  { iso: 'LCA', name: 'Saint Lucia (Castries)', flag: '🇱🇨', x: 665, y: 525, r: 5.5, activeUsers: '180k' },
  { iso: 'BRB', name: 'Barbados (Bridgetown)', flag: '🇧🇧', x: 720, y: 535, r: 6, activeUsers: '281k' },
  { iso: 'VCT', name: 'St. Vincent & Grenadines (Kingstown)', flag: '🇻🇨', x: 652, y: 555, r: 5, activeUsers: '110k' },
  { iso: 'GRD', name: 'Grenada (St. George\'s)', flag: '🇬🇩', x: 648, y: 585, r: 5, activeUsers: '125k' },
  { iso: 'TTO', name: 'Trinidad & Tobago (Port of Spain)', flag: '🇹🇹', x: 670, y: 625, r: 8.5, activeUsers: '1.5M' },

  // ABC Islands & Southern Coast
  { iso: 'ABW', name: 'Aruba (Oranjestad)', flag: '🇦🇼', x: 420, y: 535, r: 5, activeUsers: '107k' },
  { iso: 'CUW', name: 'Curaçao (Willemstad)', flag: '🇨🇼', x: 460, y: 545, r: 5, activeUsers: '155k' },
  { iso: 'BES', name: 'Bonaire (Kralendijk)', flag: '🇧🇶', x: 488, y: 545, r: 4.5, activeUsers: '22k' },
  { iso: 'BLZ', name: 'Belize (Belize City)', flag: '🇧🇿', x: 80, y: 320, r: 6, activeUsers: '412k' },
  { iso: 'PAN', name: 'Panama (Colón / Panama City)', flag: '🇵🇦', x: 230, y: 590, r: 6, activeUsers: '4.4M' },
  { iso: 'COL', name: 'Colombia (Cartagena / Barranquilla)', flag: '🇨🇴', x: 310, y: 560, r: 7, activeUsers: '5.8M' },
  { iso: 'GUY', name: 'Guyana (Georgetown)', flag: '🇬🇾', x: 800, y: 660, r: 7, activeUsers: '808k' },
  { iso: 'SUR', name: 'Suriname (Paramaribo)', flag: '🇸🇷', x: 860, y: 675, r: 6.5, activeUsers: '618k' },
  { iso: 'GUF', name: 'French Guiana (Cayenne)', flag: '🇬🇫', x: 910, y: 685, r: 6, activeUsers: '300k' },
];

export const DIASPORA_POINTS = [
  { id: 'mia', name: 'Miami, USA', flag: '🇺🇸', x: 190, y: 100, count: '1.8M' },
  { id: 'nyc', name: 'New York, USA', flag: '🇺🇸', x: 290, y: 50, count: '3.4M' },
  { id: 'tor', name: 'Toronto, Canada', flag: '🇨🇦', x: 220, y: 30, count: '890k' },
  { id: 'lon', name: 'London, UK', flag: '🇬🇧', x: 740, y: 60, count: '1.2M' },
  { id: 'ams', name: 'Amsterdam, NL', flag: '🇳🇱', x: 810, y: 70, count: '450k' },
  { id: 'par', name: 'Paris, France', flag: '🇫🇷', x: 780, y: 110, count: '780k' },
  { id: 'mad', name: 'Madrid, Spain', flag: '🇪🇸', x: 720, y: 150, count: '320k' },
  { id: 'pan', name: 'Panama City', flag: '🇵🇦', x: 180, y: 620, count: '280k' },
];

interface CaribbeanMapCanvasProps {
  highlightIso?: string;
  onSelectIsland?: (iso: string) => void;
}

export function CaribbeanMapCanvas({ highlightIso, onSelectIsland }: CaribbeanMapCanvasProps) {
  const [hoveredIsland, setHoveredIsland] = useState<IslandNode | null>(null);

  return (
    <div className="absolute inset-0 overflow-hidden select-none">
      {/* Deep Caribbean night background with multi-stop radial glows */}
      <div className="absolute inset-0 bg-[#060A13]" />

      {/* Atmospheric Sunrise & Sunset radial blooms */}
      <div className="absolute bottom-0 left-0 right-0 h-[480px] bg-gradient-to-t from-brand-sunriseCoral/20 via-brand-goldenHour/8 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-brand-caribbeanSea/12 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-brand-sunsetPurple/20 blur-[130px] pointer-events-none" />

      {/* ── Top HUD Metrics Overlay ── */}
      <div className="absolute top-24 left-10 z-10 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-2 text-xs shadow-lg shadow-black/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-extrabold text-white">59.4M</span>
            <span className="text-brand-sandstone/60">Global Diaspora Connected</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-2 text-xs shadow-lg shadow-black/40">
            <span className="font-extrabold text-brand-goldenHour">34</span>
            <span className="text-brand-sandstone/60">Island Hubs Live</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/25 text-[11px] font-semibold text-brand-caribbeanSea backdrop-blur-md">
          <Wallet className="w-3.5 h-3.5" />
          <span>Real-Time Multi-Currency Ledger</span>
        </div>
      </div>

      {/* ── SVG Canvas for Map and Diaspora Arcs ── */}
      <svg
        viewBox="0 0 1000 750"
        className="absolute inset-0 w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="arcGradTealGold" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#FFB347" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FF7A59" stopOpacity="0.6" />
          </linearGradient>

          <filter id="f100Glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Diaspora Curved Flight Paths */}
        <g opacity="0.75">
          {DIASPORA_POINTS.map((diaspora) =>
            [
              ISLAND_MAP_POINTS.find((i) => i.iso === 'JAM'),
              ISLAND_MAP_POINTS.find((i) => i.iso === 'DOM'),
              ISLAND_MAP_POINTS.find((i) => i.iso === 'TTO'),
              ISLAND_MAP_POINTS.find((i) => i.iso === 'BRB'),
              ISLAND_MAP_POINTS.find((i) => i.iso === 'HTI'),
              ISLAND_MAP_POINTS.find((i) => i.iso === 'BHS'),
            ]
              .filter(Boolean)
              .map((island, idx) => {
                if (!island) return null;
                const midX = (island.x + diaspora.x) / 2 + (idx % 2 === 0 ? -35 : 35);
                const midY = (island.y + diaspora.y) / 2 - 70;
                const isHighlight = highlightIso && (island.iso === highlightIso);

                return (
                  <g key={`arc-${diaspora.id}-${island.iso}`}>
                    <path
                      d={`M ${island.x} ${island.y} Q ${midX} ${midY} ${diaspora.x} ${diaspora.y}`}
                      fill="none"
                      stroke={isHighlight ? '#FFB347' : 'url(#arcGradTealGold)'}
                      strokeWidth={isHighlight ? 1.8 : 0.8}
                      strokeDasharray={isHighlight ? 'none' : '4 6'}
                      className="transition-all duration-500"
                    />
                  </g>
                );
              })
          )}
        </g>

        {/* Island Nodes & Glow Rings */}
        {ISLAND_MAP_POINTS.map((island) => {
          const isHovered = hoveredIsland?.iso === island.iso;
          const isTargeted = highlightIso === island.iso;
          const isHighlighted = isHovered || isTargeted;

          return (
            <g
              key={island.iso}
              className="cursor-pointer group"
              onClick={() => onSelectIsland?.(island.iso)}
              onMouseEnter={() => setHoveredIsland(island)}
              onMouseLeave={() => setHoveredIsland(null)}
            >
              {/* Outer atmospheric aura */}
              <circle
                cx={island.x}
                cy={island.y}
                r={island.r * (isHighlighted ? 5.5 : 3)}
                fill={isTargeted ? '#FFB347' : '#00B4D8'}
                fillOpacity={isHighlighted ? 0.35 : 0.08}
                className="transition-all duration-300"
              />

              {/* Glowing Pulse Ring */}
              <circle
                cx={island.x}
                cy={island.y}
                r={island.r * (isHighlighted ? 3 : 1.8)}
                fill={isHighlighted ? '#FF7A59' : '#FFB347'}
                fillOpacity={isHighlighted ? 0.6 : 0.2}
                className="animate-pulse"
                style={{
                  animationDuration: `${2.5 + (island.x % 3)}s`,
                  animationDelay: `${(island.y % 3) * 0.4}s`,
                }}
              />

              {/* Core Solid Island Hub Dot */}
              <circle
                cx={island.x}
                cy={island.y}
                r={island.r * (isTargeted ? 1.3 : 1)}
                fill={isTargeted ? '#FF7A59' : isHovered ? '#FFB347' : '#00B4D8'}
                stroke="#FFFFFF"
                strokeWidth={isHighlighted ? 2.5 : 1}
                filter="url(#f100Glow)"
                className="transition-all duration-200"
              />

              {/* Island Label for prominent hubs */}
              {(island.r >= 6 || isHighlighted) && (
                <text
                  x={island.x}
                  y={island.y + island.r + 14}
                  textAnchor="middle"
                  fill="#FDF2E9"
                  fillOpacity={isHighlighted ? 1 : 0.8}
                  fontSize={isHighlighted ? '12' : '11'}
                  fontWeight={isHighlighted ? '800' : '600'}
                  letterSpacing="0.03em"
                  className="pointer-events-none select-none font-sans drop-shadow-lg transition-all"
                >
                  {island.name.split(' (')[0]}
                </text>
              )}
            </g>
          );
        })}

        {/* Diaspora Hub Points */}
        {DIASPORA_POINTS.map((hub) => (
          <g key={hub.id} className="cursor-pointer">
            <circle cx={hub.x} cy={hub.y} r="10" fill="#FFB347" fillOpacity="0.25" />
            <circle cx={hub.x} cy={hub.y} r="4.5" fill="#FFB347" stroke="#FFF" strokeWidth="2" filter="url(#f100Glow)" />
            <text
              x={hub.x}
              y={hub.y - 12}
              textAnchor="middle"
              fill="#FFB347"
              fontSize="11"
              fontWeight="800"
              letterSpacing="0.04em"
              className="pointer-events-none drop-shadow-md"
            >
              {hub.flag} {hub.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Floating Interactive Hover Card */}
      {hoveredIsland && (
        <div
          className="absolute z-30 pointer-events-none glass px-4 py-2.5 rounded-2xl text-xs shadow-2xl border border-white/20 animate-fadeIn backdrop-blur-2xl"
          style={{
            left: `${Math.min(Math.max(hoveredIsland.x / 10, 10), 85)}%`,
            top: `${Math.min(Math.max(hoveredIsland.y / 7.5, 15), 75)}%`,
            transform: 'translate(-50%, -125%)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{hoveredIsland.flag}</span>
            <div>
              <p className="font-extrabold text-white text-sm leading-tight">{hoveredIsland.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-brand-caribbeanSea font-bold uppercase tracking-wider">
                  ISO: {hoveredIsland.iso}
                </span>
                <span className="text-white/40">•</span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {hoveredIsland.activeUsers} Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
