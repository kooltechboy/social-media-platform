'use client';

import React, { useState } from 'react';
import { CARIBBEAN_TERRITORIES } from '../../lib/constants/caribbean-territories';
import { DIASPORA_CITY_HUBS } from '../../lib/constants/diaspora-hubs';

// Coordinate placement percentage on 1000x700 viewBox canvas
interface IslandNode {
  iso: string;
  name: string;
  flag: string;
  x: number;
  y: number;
  r: number;
  glowColor?: string;
}

const ISLAND_MAP_POINTS: IslandNode[] = [
  // Greater Antilles & Lucayan
  { iso: 'BHS', name: 'Bahamas (Nassau / Freeport)', flag: '🇧🇸', x: 270, y: 190, r: 6 },
  { iso: 'CUB', name: 'Cuba (Havana / Santiago)', flag: '🇨🇺', x: 250, y: 280, r: 10 },
  { iso: 'CYM', name: 'Cayman Islands (George Town)', flag: '🇰🇾', x: 195, y: 340, r: 4 },
  { iso: 'JAM', name: 'Jamaica (Kingston / Montego Bay)', flag: '🇯🇲', x: 285, y: 375, r: 8 },
  { iso: 'HTI', name: 'Haiti (Port-au-Prince / Cap-Haïtien)', flag: '🇭🇹', x: 375, y: 345, r: 8 },
  { iso: 'DOM', name: 'Dominican Republic (Santo Domingo)', flag: '🇩🇴', x: 440, y: 345, r: 9 },
  { iso: 'TCA', name: 'Turks & Caicos (Providenciales)', flag: '🇹🇨', x: 420, y: 260, r: 5 },
  { iso: 'PRI', name: 'Puerto Rico (San Juan / Ponce)', flag: '🇵🇷', x: 530, y: 360, r: 8 },

  // Leeward Islands
  { iso: 'VIR', name: 'US Virgin Islands (St. Thomas / St. Croix)', flag: '🇻🇮', x: 580, y: 360, r: 4 },
  { iso: 'VGB', name: 'British Virgin Islands (Tortola)', flag: '🇻🇬', x: 598, y: 355, r: 4 },
  { iso: 'AIA', name: 'Anguilla (The Valley)', flag: '🇦🇮', x: 625, y: 350, r: 3.5 },
  { iso: 'SXM', name: 'Sint Maarten / Saint-Martin', flag: '🇸🇽', x: 632, y: 362, r: 4 },
  { iso: 'KNA', name: 'Saint Kitts & Nevis (Basseterre)', flag: '🇰🇳', x: 628, y: 388, r: 4 },
  { iso: 'ATG', name: 'Antigua & Barbuda (St. John\'s)', flag: '🇦🇬', x: 660, y: 385, r: 5 },
  { iso: 'MSR', name: 'Montserrat (Brades)', flag: '🇲🇸', x: 638, y: 410, r: 3.5 },
  { iso: 'GLP', name: 'Guadeloupe (Pointe-à-Pitre)', flag: '🇬🇵', x: 665, y: 425, r: 6 },
  { iso: 'DMA', name: 'Dominica (Roseau)', flag: '🇩🇲', x: 660, y: 460, r: 5 },

  // Windward Islands & Southern Caribbean
  { iso: 'MTQ', name: 'Martinique (Fort-de-France)', flag: '🇲🇶', x: 668, y: 490, r: 6 },
  { iso: 'LCA', name: 'Saint Lucia (Castries)', flag: '🇱🇨', x: 665, y: 525, r: 5.5 },
  { iso: 'BRB', name: 'Barbados (Bridgetown)', flag: '🇧🇧', x: 720, y: 535, r: 6 },
  { iso: 'VCT', name: 'St. Vincent & Grenadines (Kingstown)', flag: '🇻🇨', x: 652, y: 555, r: 5 },
  { iso: 'GRD', name: 'Grenada (St. George\'s)', flag: '🇬🇩', x: 648, y: 585, r: 5 },
  { iso: 'TTO', name: 'Trinidad & Tobago (Port of Spain)', flag: '🇹🇹', x: 670, y: 625, r: 8 },

  // ABC Islands & Southern Coast
  { iso: 'ABW', name: 'Aruba (Oranjestad)', flag: '🇦🇼', x: 420, y: 535, r: 5 },
  { iso: 'CUW', name: 'Curaçao (Willemstad)', flag: '🇨🇼', x: 460, y: 545, r: 5 },
  { iso: 'BES', name: 'Bonaire (Kralendijk)', flag: '🇧🇶', x: 488, y: 545, r: 4.5 },
  { iso: 'BLZ', name: 'Belize (Belize City)', flag: '🇧🇿', x: 80, y: 320, r: 6 },
  { iso: 'PAN', name: 'Panama (Colón / Panama City)', flag: '🇵🇦', x: 230, y: 590, r: 6 },
  { iso: 'COL', name: 'Colombia (Cartagena / Barranquilla)', flag: '🇨🇴', x: 310, y: 560, r: 7 },
  { iso: 'GUY', name: 'Guyana (Georgetown)', flag: '🇬🇾', x: 800, y: 660, r: 7 },
  { iso: 'SUR', name: 'Suriname (Paramaribo)', flag: '🇸🇷', x: 860, y: 675, r: 6.5 },
  { iso: 'GUF', name: 'French Guiana (Cayenne)', flag: '🇬🇫', x: 910, y: 685, r: 6 },
];

const DIASPORA_POINTS = [
  { id: 'mia', name: 'Miami, USA', flag: '🇺🇸', x: 190, y: 100 },
  { id: 'nyc', name: 'New York, USA', flag: '🇺🇸', x: 290, y: 50 },
  { id: 'tor', name: 'Toronto, Canada', flag: '🇨🇦', x: 220, y: 30 },
  { id: 'lon', name: 'London, UK', flag: '🇬🇧', x: 740, y: 60 },
  { id: 'ams', name: 'Amsterdam, NL', flag: '🇳🇱', x: 810, y: 70 },
  { id: 'par', name: 'Paris, France', flag: '🇫🇷', x: 780, y: 110 },
  { id: 'mad', name: 'Madrid, Spain', flag: '🇪🇸', x: 720, y: 150 },
  { id: 'pan', name: 'Panama City', flag: '🇵🇦', x: 180, y: 620 },
];

export function CaribbeanMapCanvas() {
  const [hoveredIsland, setHoveredIsland] = useState<IslandNode | null>(null);

  return (
    <div className="absolute inset-0 overflow-hidden select-none">
      {/* Deep Caribbean night background with multi-stop radial glows */}
      <div className="absolute inset-0 bg-[#070B14]" />
      
      {/* Sunset & Coral ambient light gradient radiating from bottom-center */}
      <div className="absolute bottom-0 left-0 right-0 h-[450px] bg-gradient-to-t from-brand-sunriseCoral/15 via-brand-goldenHour/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-caribbeanSea/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] rounded-full bg-brand-sunsetPurple/15 blur-[100px] pointer-events-none" />

      {/* SVG Canvas for Map and Diaspora arcs */}
      <svg
        viewBox="0 0 1000 750"
        className="absolute inset-0 w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="arcGradTealGold" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FFB347" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF7A59" stopOpacity="0.4" />
          </linearGradient>

          <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Diaspora Connection Arcs (Curved Bezier Paths) */}
        <g opacity="0.6">
          {DIASPORA_POINTS.map((diaspora) =>
            // Connect to top regional anchors
            [
              ISLAND_MAP_POINTS.find((i) => i.iso === 'JAM'),
              ISLAND_MAP_POINTS.find((i) => i.iso === 'DOM'),
              ISLAND_MAP_POINTS.find((i) => i.iso === 'TTO'),
              ISLAND_MAP_POINTS.find((i) => i.iso === 'BRB'),
              ISLAND_MAP_POINTS.find((i) => i.iso === 'HTI'),
            ]
              .filter(Boolean)
              .map((island, idx) => {
                if (!island) return null;
                const midX = (island.x + diaspora.x) / 2 + (idx % 2 === 0 ? -30 : 30);
                const midY = (island.y + diaspora.y) / 2 - 60;
                return (
                  <path
                    key={`arc-${diaspora.id}-${island.iso}`}
                    d={`M ${island.x} ${island.y} Q ${midX} ${midY} ${diaspora.x} ${diaspora.y}`}
                    fill="none"
                    stroke="url(#arcGradTealGold)"
                    strokeWidth="0.8"
                    strokeDasharray="4 6"
                    className="transition-opacity duration-300"
                  />
                );
              })
          )}
        </g>

        {/* Island Nodes & Glow Circles */}
        {ISLAND_MAP_POINTS.map((island) => {
          const isHovered = hoveredIsland?.iso === island.iso;
          return (
            <g
              key={island.iso}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredIsland(island)}
              onMouseLeave={() => setHoveredIsland(null)}
            >
              {/* Outer atmospheric aura */}
              <circle
                cx={island.x}
                cy={island.y}
                r={island.r * (isHovered ? 4.5 : 3)}
                fill="#00B4D8"
                fillOpacity={isHovered ? 0.25 : 0.08}
                className="transition-all duration-300"
              />

              {/* Glowing Pulse Ring */}
              <circle
                cx={island.x}
                cy={island.y}
                r={island.r * (isHovered ? 2.5 : 1.8)}
                fill="#FFB347"
                fillOpacity={isHovered ? 0.4 : 0.15}
                className="animate-pulse"
                style={{
                  animationDuration: `${3 + (island.x % 4)}s`,
                  animationDelay: `${(island.y % 3) * 0.5}s`,
                }}
              />

              {/* Core Solid Island Hub Dot */}
              <circle
                cx={island.x}
                cy={island.y}
                r={island.r}
                fill={isHovered ? '#FF7A59' : '#00B4D8'}
                stroke="#FFFFFF"
                strokeWidth={isHovered ? 2 : 1}
                filter="url(#glowFilter)"
                className="transition-colors duration-200"
              />

              {/* Island Label for prominent islands */}
              {island.r >= 6 && (
                <text
                  x={island.x}
                  y={island.y + island.r + 14}
                  textAnchor="middle"
                  fill="#FDF2E9"
                  fillOpacity={isHovered ? 1 : 0.75}
                  fontSize="11"
                  fontWeight="600"
                  letterSpacing="0.03em"
                  className="pointer-events-none select-none font-sans drop-shadow-md"
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
            <circle cx={hub.x} cy={hub.y} r="8" fill="#FFB347" fillOpacity="0.2" />
            <circle cx={hub.x} cy={hub.y} r="4" fill="#FFB347" stroke="#FFF" strokeWidth="1.5" />
            <text
              x={hub.x}
              y={hub.y - 10}
              textAnchor="middle"
              fill="#FFB347"
              fontSize="11"
              fontWeight="700"
              letterSpacing="0.04em"
              className="pointer-events-none drop-shadow"
            >
              {hub.flag} {hub.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Floating Interactive Hover Card */}
      {hoveredIsland && (
        <div
          className="absolute z-20 pointer-events-none glass px-3.5 py-2 rounded-xl text-xs shadow-2xl border border-white/20 animate-fadeIn"
          style={{
            left: `${Math.min(Math.max(hoveredIsland.x / 10, 10), 85)}%`,
            top: `${Math.min(Math.max(hoveredIsland.y / 7.5, 15), 75)}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{hoveredIsland.flag}</span>
            <div>
              <p className="font-bold text-white leading-tight">{hoveredIsland.name}</p>
              <p className="text-[10px] text-brand-caribbeanSea font-semibold uppercase tracking-wider">
                Caribbean Hub • ISO: {hoveredIsland.iso}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
