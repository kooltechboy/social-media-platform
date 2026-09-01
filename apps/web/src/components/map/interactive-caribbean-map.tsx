'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Compass,
  MapPin,
  Globe,
  Users,
  Building2,
  Calendar,
  ShoppingBag,
  Tv,
  Flame,
  Sparkles,
  Search,
  Plus,
  Minus,
  RotateCcw,
  Maximize2,
  Minimize2,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  X,
  Share2,
  Check,
  Radio,
  ExternalLink,
  Tag,
  Coins,
  Clock,
  BookOpen,
} from 'lucide-react';
import {
  CARIBBEAN_GEO_ENTITIES,
  CARIBBEAN_GEO_BY_ISO,
  CLASSIFICATION_COLORS,
  type CaribbeanGeoEntity,
  type CaribbeanClassification,
} from '../../lib/constants/caribbean-geography';

const REGIONS = [
  'All Regions',
  'Greater Antilles',
  'Lesser Antilles (Leeward)',
  'Lesser Antilles (Windward)',
  'Southern Caribbean & ABC',
  'Guianas & Mainland Coast',
  'Diaspora Hub',
] as const;

const CLASSIFICATIONS: ('All Classifications' | CaribbeanClassification)[] = [
  'All Classifications',
  'Independent Country',
  'Constituent Country',
  'Dependent Territory',
  'Caribbean Netherlands',
  'Mainland Caribbean',
  'Diaspora Hub',
];

export default function InteractiveCaribbeanMap() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialIso = searchParams.get('selected') || 'JAM';
  const initialView = (searchParams.get('view') === 'grid' ? 'grid' : 'map') as 'map' | 'grid';

  const [selectedEntity, setSelectedEntity] = useState<CaribbeanGeoEntity>(
    CARIBBEAN_GEO_BY_ISO[initialIso] || CARIBBEAN_GEO_ENTITIES[3] // Default Jamaica
  );
  const [viewMode, setViewMode] = useState<'map' | 'grid'>(initialView);
  const [activeRegion, setActiveRegion] = useState<string>('All Regions');
  const [activeClassification, setActiveClassification] = useState<string>('All Classifications');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredEntity, setHoveredEntity] = useState<CaribbeanGeoEntity | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // SVG Map Canvas Pan & Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sync state with URL without full refresh
  const updateUrlState = useCallback((iso: string, view: 'map' | 'grid') => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('selected', iso);
    url.searchParams.set('view', view);
    window.history.pushState({}, '', url.toString());
  }, []);

  // Handle territory selection
  const handleSelectEntity = useCallback(
    (entity: CaribbeanGeoEntity, openMobileSheet: boolean = true) => {
      setSelectedEntity(entity);
      updateUrlState(entity.iso, viewMode);
      if (openMobileSheet) {
        setIsMobileSheetOpen(true);
      }
    },
    [viewMode, updateUrlState]
  );

  // Handle view mode change
  const handleViewModeChange = useCallback(
    (mode: 'map' | 'grid') => {
      setViewMode(mode);
      updateUrlState(selectedEntity.iso, mode);
    },
    [selectedEntity.iso, updateUrlState]
  );

  // Listen to browser Back/Forward popstate
  useEffect(() => {
    function handlePopState() {
      const currentUrl = new URL(window.location.href);
      const iso = currentUrl.searchParams.get('selected');
      const view = currentUrl.searchParams.get('view');
      if (iso && CARIBBEAN_GEO_BY_ISO[iso]) {
        setSelectedEntity(CARIBBEAN_GEO_BY_ISO[iso]);
      }
      if (view === 'map' || view === 'grid') {
        setViewMode(view);
      }
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [geoStats, setGeoStats] = useState<{
    creators: number;
    businesses: number;
    communities: number;
    live: number;
    loading: boolean;
  }>({ creators: 0, businesses: 0, communities: 0, live: 0, loading: true });

  // Query real dynamic counts for selected territory from Supabase
  useEffect(() => {
    let isMounted = true;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    async function loadTerritoryStats() {
      setGeoStats((prev) => ({ ...prev, loading: true }));
      try {
        const iso = selectedEntity.iso;
        const [creatorsRes, businessesRes, communitiesRes, liveRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('origin_country_iso', iso),
          supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('country_iso', iso),
          supabase.from('communities').select('id', { count: 'exact', head: true }).eq('country_iso', iso),
          supabase.from('livestreams').select('id', { count: 'exact', head: true }).eq('state', 'live'),
        ]);

        if (isMounted) {
          setGeoStats({
            creators: creatorsRes.count ?? 0,
            businesses: businessesRes.count ?? 0,
            communities: communitiesRes.count ?? 0,
            live: liveRes.count ?? 0,
            loading: false,
          });
        }
      } catch {
        if (isMounted) {
          setGeoStats({ creators: 0, businesses: 0, communities: 0, live: 0, loading: false });
        }
      }
    }

    void loadTerritoryStats();
    return () => {
      isMounted = false;
    };
  }, [selectedEntity.iso]);

  // Filtered entities based on region, classification, and search query
  const filteredEntities = useMemo(() => {
    return CARIBBEAN_GEO_ENTITIES.filter((entity) => {
      const matchesRegion = activeRegion === 'All Regions' || entity.region === activeRegion;
      const matchesClassification =
        activeClassification === 'All Classifications' || entity.classification === activeClassification;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        entity.name.toLowerCase().includes(q) ||
        entity.shortName.toLowerCase().includes(q) ||
        (entity.officialName && entity.officialName.toLowerCase().includes(q)) ||
        entity.capital.toLowerCase().includes(q) ||
        entity.iso.toLowerCase().includes(q) ||
        entity.trendingTag.toLowerCase().includes(q) ||
        entity.classification.toLowerCase().includes(q);
      return matchesRegion && matchesClassification && matchesSearch;
    });
  }, [activeRegion, activeClassification, searchQuery]);

  // Pan and Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary mouse button
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    // Bound panning range
    const maxPan = 450 * zoom;
    setPan({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY)),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prevZoom) => Math.min(3.5, Math.max(0.65, prevZoom * zoomFactor)));
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(3.5, z + 0.3));
  const handleZoomOut = () => setZoom((z) => Math.max(0.65, z - 0.3));
  const handleResetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleRecenterOnSelected = () => {
    setZoom(1.4);
    const targetX = (500 - selectedEntity.x) * 1.4;
    const targetY = (375 - selectedEntity.y) * 1.4;
    setPan({ x: targetX, y: targetY });
  };

  const handleShareEntity = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : `https://tukubi.com/map?selected=${selectedEntity.iso}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${selectedEntity.flag} ${selectedEntity.name} on Tukubi Caribbean Map`,
          text: `Explore ${selectedEntity.name} (${selectedEntity.classification}) on TUKUBI — Caribbean creators, businesses, events & diaspora.`,
          url,
        });
        return;
      } catch {
        // Fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignore
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const classificationStyle = CLASSIFICATION_COLORS[selectedEntity.classification] || {
    bg: 'bg-brand-caribbeanSea/20',
    text: 'text-brand-caribbeanSea',
    border: 'border-brand-caribbeanSea/40',
    glow: '#00B4D8',
    badge: selectedEntity.classification,
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-brand-twilight/90 backdrop-blur-md text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-5 select-none rounded-3xl ${
        isFullscreen ? 'fixed inset-0 z-50 p-6 bg-brand-twilight overflow-y-auto' : ''
      }`}
    >
      {/* ── Top Discovery Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-brand-caribbeanSea animate-ping" />
            <h1 className="text-2xl md:text-3xl font-black text-brand-sandstone flex items-center gap-3">
              <Compass className="w-8 h-8 text-brand-caribbeanSea shrink-0" /> Caribbean Discovery Map
            </h1>
          </div>
          <p className="text-xs md:text-sm text-brand-sandstone/60 mt-1">
            Geospatial discovery engine connecting {CARIBBEAN_GEO_ENTITIES.length} Caribbean nations, overseas territories, constituent countries, special municipalities, and global diaspora hubs.
          </p>
        </div>

        {/* Search & View Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sandstone/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search island, capital, status, ISO..."
              className="w-full bg-brand-dusk border border-slate-800 rounded-2xl pl-10 pr-8 py-2 text-xs text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-sandstone/40 hover:text-brand-sandstone"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-brand-dusk border border-slate-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => handleViewModeChange('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewMode === 'map'
                  ? 'bg-brand-caribbeanSea text-slate-950 shadow-md'
                  : 'text-brand-sandstone/60 hover:text-brand-sandstone'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewMode === 'grid'
                  ? 'bg-brand-caribbeanSea text-slate-950 shadow-md'
                  : 'text-brand-sandstone/60 hover:text-brand-sandstone'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Dual Filter System: Region Tabs & Political Status Badges ── */}
      <div className="space-y-2.5">
        {/* 1. Sub-Region Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Filter by geographic region">
          {REGIONS.map((reg) => (
            <button
              key={reg}
              role="tab"
              aria-selected={activeRegion === reg}
              onClick={() => setActiveRegion(reg)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
                activeRegion === reg
                  ? 'bg-brand-caribbeanSea text-slate-950 shadow-md shadow-brand-caribbeanSea/20 ring-1 ring-brand-caribbeanSea'
                  : 'bg-brand-dusk text-brand-sandstone/60 hover:text-brand-sandstone border border-slate-800'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        {/* 2. Political Classification Badges */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center" role="tablist" aria-label="Filter by political classification">
          <span className="text-[11px] font-bold text-brand-sandstone/40 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Status:
          </span>
          {CLASSIFICATIONS.map((cls) => {
            const isSelected = activeClassification === cls;
            const style = cls !== 'All Classifications' ? CLASSIFICATION_COLORS[cls] : null;

            return (
              <button
                key={cls}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveClassification(cls)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-brand-goldenHour text-slate-950 border-brand-goldenHour shadow-sm font-extrabold'
                    : style
                    ? `${style.bg} ${style.text} ${style.border} hover:brightness-125`
                    : 'bg-brand-dusk text-brand-sandstone/60 border-slate-800 hover:text-brand-sandstone'
                }`}
              >
                {cls}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Map Canvas & Territory Detail Drawer Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Map Canvas or Directory Grid (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          {viewMode === 'map' ? (
            <div className="relative w-full h-[580px] md:h-[620px] bg-[#060A13] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              {/* Atmospheric Gradient Backgrounds */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-sunriseCoral/10 via-transparent to-brand-sunsetPurple/10 pointer-events-none" />
              <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-brand-caribbeanSea/8 blur-[120px] pointer-events-none" />

              {/* Map Floating Control Overlay */}
              <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-brand-dusk/90 backdrop-blur-xl border border-slate-700/80 p-1.5 rounded-2xl shadow-xl">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  aria-label="Zoom in"
                  className="p-2 text-slate-200 hover:text-brand-caribbeanSea hover:bg-slate-800 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  aria-label="Zoom out"
                  className="p-2 text-slate-200 hover:text-brand-caribbeanSea hover:bg-slate-800 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetMap}
                  aria-label="Reset zoom and center"
                  className="p-2 text-slate-200 hover:text-brand-goldenHour hover:bg-slate-800 rounded-xl transition-colors border-t border-slate-700/50 min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Reset view"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRecenterOnSelected}
                  aria-label="Center on selected island"
                  className="p-2 text-slate-200 hover:text-brand-sunriseCoral hover:bg-slate-800 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Focus selected island"
                >
                  <MapPin className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label="Toggle fullscreen mode"
                  className="p-2 text-slate-200 hover:text-brand-caribbeanSea hover:bg-slate-800 rounded-xl transition-colors border-t border-slate-700/50 min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Live Dynamic Count Indicator Top-Left */}
              <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-1.5">
                <div className="px-3 py-1 rounded-xl bg-brand-dusk/90 backdrop-blur-md border border-slate-700/80 flex items-center gap-2 text-[11px] shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-extrabold text-white">{filteredEntities.length}</span>
                  <span className="text-brand-sandstone/60">Caribbean Places Active</span>
                </div>
                <div className="hidden sm:block text-[10px] text-brand-sandstone/40 bg-black/40 px-2.5 py-0.5 rounded-lg backdrop-blur-sm">
                  Drag to pan • Scroll / +/- to zoom • Tap to open hub
                </div>
              </div>

              {/* ── Interactive SVG Canvas ── */}
              <div
                className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <svg
                  ref={svgRef}
                  viewBox="0 0 1000 750"
                  className="w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '500px 375px',
                    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <defs>
                    <linearGradient id="mapFlightArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.7" />
                      <stop offset="50%" stopColor="#FFB347" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#FF7A59" stopOpacity="0.7" />
                    </linearGradient>

                    <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Flight & Cultural Connection Arcs */}
                  <g opacity="0.65">
                    {filteredEntities
                      .filter((e) => e.classification === 'Diaspora Hub' && e.diasporaLinks)
                      .flatMap((diaspora) =>
                        (diaspora.diasporaLinks || []).map((targetIso) => {
                          const targetIsland = CARIBBEAN_GEO_BY_ISO[targetIso];
                          if (!targetIsland) return null;
                          const midX = (diaspora.x + targetIsland.x) / 2;
                          const midY = (diaspora.y + targetIsland.y) / 2 - 60;
                          const isHighlighted =
                            selectedEntity.iso === diaspora.iso || selectedEntity.iso === targetIsland.iso;

                          return (
                            <path
                              key={`arc-${diaspora.iso}-${targetIsland.iso}`}
                              d={`M ${diaspora.x} ${diaspora.y} Q ${midX} ${midY} ${targetIsland.x} ${targetIsland.y}`}
                              fill="none"
                              stroke={isHighlighted ? '#FFB347' : 'url(#mapFlightArcGrad)'}
                              strokeWidth={isHighlighted ? 2.2 : 0.9}
                              strokeDasharray={isHighlighted ? 'none' : '4 6'}
                              className="transition-all duration-300 pointer-events-none"
                            />
                          );
                        })
                      )}
                  </g>

                  {/* Territory & Hub Node Markers */}
                  {filteredEntities.map((entity) => {
                    const isSelected = selectedEntity.iso === entity.iso;
                    const isHovered = hoveredEntity?.iso === entity.iso;
                    const isProminent = isSelected || isHovered;
                    const entityColors = CLASSIFICATION_COLORS[entity.classification] || CLASSIFICATION_COLORS['Independent Country'];

                    return (
                      <g
                        key={entity.iso}
                        className="cursor-pointer group focus:outline-none"
                        tabIndex={0}
                        role="button"
                        aria-label={`${entity.name} (${entity.iso}) — ${entity.classification}`}
                        onClick={() => handleSelectEntity(entity, true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectEntity(entity, true);
                          }
                        }}
                        onMouseEnter={() => setHoveredEntity(entity)}
                        onMouseLeave={() => setHoveredEntity(null)}
                      >
                        {/* Enlarged Transparent Touch/Click Hit Area (Minimum 44px hit radius) */}
                        <circle
                          cx={entity.x}
                          cy={entity.y}
                          r={Math.max(entity.r * 3, 24)}
                          fill="transparent"
                          className="pointer-events-auto"
                        />

                        {/* Outer Atmospheric Aura */}
                        <circle
                          cx={entity.x}
                          cy={entity.y}
                          r={entity.r * (isProminent ? 4.5 : 2.5)}
                          fill={entityColors.glow}
                          fillOpacity={isProminent ? 0.4 : 0.12}
                          className="transition-all duration-300"
                        />

                        {/* Pulsating Radar Beacon Ring */}
                        <circle
                          cx={entity.x}
                          cy={entity.y}
                          r={entity.r * (isProminent ? 2.8 : 1.7)}
                          fill={isSelected ? '#FF7A59' : entityColors.glow}
                          fillOpacity={isProminent ? 0.6 : 0.25}
                          className="animate-pulse"
                          style={{
                            animationDuration: `${2.2 + (entity.x % 3)}s`,
                          }}
                        />

                        {/* Solid Central Dot */}
                        <circle
                          cx={entity.x}
                          cy={entity.y}
                          r={entity.r * (isSelected ? 1.3 : 1)}
                          fill={isSelected ? '#FF7A59' : entityColors.glow}
                          stroke="#FFFFFF"
                          strokeWidth={isProminent ? 2.5 : 1}
                          filter="url(#nodeGlow)"
                          className="transition-all duration-200"
                        />

                        {/* Map Label */}
                        {(entity.r >= 6 || isProminent) && (
                          <text
                            x={entity.x}
                            y={entity.y + entity.r + 14}
                            textAnchor="middle"
                            fill={isSelected ? '#FFB347' : '#FDF2E9'}
                            fillOpacity={isProminent ? 1 : 0.9}
                            fontSize={isProminent ? '12' : '10.5'}
                            fontWeight={isProminent ? '800' : '600'}
                            letterSpacing="0.03em"
                            className="pointer-events-none select-none font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-all"
                          >
                            {entity.flag} {entity.shortName}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Floating Hover Tooltip */}
              {hoveredEntity && (
                <div
                  className="absolute z-30 pointer-events-none bg-brand-dusk/95 border border-brand-caribbeanSea/40 px-3.5 py-2 rounded-2xl text-xs shadow-2xl backdrop-blur-2xl animate-fadeIn"
                  style={{
                    left: `${Math.min(Math.max(hoveredEntity.x / 10, 10), 85)}%`,
                    top: `${Math.min(Math.max(hoveredEntity.y / 7.5, 12), 80)}%`,
                    transform: 'translate(-50%, -125%)',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{hoveredEntity.flag}</span>
                    <div>
                      <p className="font-extrabold text-white text-xs leading-tight">
                        {hoveredEntity.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-brand-sandstone/60">
                        <span className="text-brand-caribbeanSea font-bold uppercase">
                          {hoveredEntity.iso}
                        </span>
                        <span>•</span>
                        <span>{hoveredEntity.capital}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">{hoveredEntity.classification}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Directory Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[620px] overflow-y-auto pr-1">
              {filteredEntities.map((node) => {
                const isSelected = selectedEntity.iso === node.iso;
                const nodeColors = CLASSIFICATION_COLORS[node.classification] || CLASSIFICATION_COLORS['Independent Country'];

                return (
                  <div
                    key={node.iso}
                    onClick={() => handleSelectEntity(node, true)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-lg group ${
                      isSelected
                        ? 'bg-brand-caribbeanSea/15 border-brand-caribbeanSea ring-2 ring-brand-caribbeanSea/30'
                        : 'bg-brand-dusk/80 border-slate-800 hover:border-slate-700 hover:bg-brand-dusk'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl group-hover:scale-110 transition-transform">
                        {node.flag}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${nodeColors.bg} ${nodeColors.text} ${nodeColors.border}`}>
                          {node.classification}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-twilight text-brand-caribbeanSea border border-slate-800">
                          {node.iso}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-black text-sm text-brand-sandstone group-hover:text-brand-caribbeanSea transition-colors line-clamp-1">
                        {node.name}
                      </h3>
                      <p className="text-[11px] font-bold text-brand-goldenHour mt-0.5 line-clamp-1">
                        {node.trendingTag}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-brand-sandstone/60">
                      <span>Capital: {node.capital}</span>
                      <span className="text-slate-300 font-semibold">{node.region}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (Desktop Inspector Drawer): Col 4 */}
        <div className="hidden lg:block lg:col-span-4 space-y-5">
          <div className="bg-brand-dusk/95 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral" />

            <div className="flex items-center justify-between pt-1">
              <span className="text-5xl drop-shadow-md">{selectedEntity.flag}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareEntity}
                  aria-label="Share territory link"
                  className="p-2 rounded-xl bg-brand-twilight border border-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${classificationStyle.bg} ${classificationStyle.text} ${classificationStyle.border}`}>
                  {selectedEntity.classification}
                </span>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30 uppercase tracking-wider">
                  {selectedEntity.iso}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-brand-sandstone">{selectedEntity.name}</h2>
              </div>
              {selectedEntity.officialName && (
                <p className="text-[11px] text-brand-sandstone/50 italic mt-0.5">
                  {selectedEntity.officialName}
                </p>
              )}
              <p className="text-xs text-brand-sandstone/70 mt-1">
                Capital: <span className="text-slate-200 font-semibold">{selectedEntity.capital}</span> • {selectedEntity.region}
              </p>

              {/* Metadata chips */}
              <div className="flex flex-wrap gap-2 mt-2 pt-1">
                {selectedEntity.languages && selectedEntity.languages.length > 0 && (
                  <span className="text-[10.5px] px-2 py-0.5 rounded-lg bg-brand-twilight text-slate-300 border border-slate-800 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-brand-caribbeanSea" /> {selectedEntity.languages.join(', ')}
                  </span>
                )}
                {selectedEntity.currency && (
                  <span className="text-[10.5px] px-2 py-0.5 rounded-lg bg-brand-twilight text-slate-300 border border-slate-800 flex items-center gap-1">
                    <Coins className="w-3 h-3 text-brand-goldenHour" /> {selectedEntity.currency}
                  </span>
                )}
                {selectedEntity.timezone && (
                  <span className="text-[10.5px] px-2 py-0.5 rounded-lg bg-brand-twilight text-slate-300 border border-slate-800 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" /> {selectedEntity.timezone}
                  </span>
                )}
              </div>

              <span className="inline-block text-xs font-bold text-brand-goldenHour mt-2.5">
                {selectedEntity.trendingTag}
              </span>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                {selectedEntity.summary}
              </p>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-brand-twilight border border-slate-800 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-sandstone/60 flex items-center gap-1">
                  <Users className="w-3 h-3 text-brand-caribbeanSea" /> Members
                </span>
                <p className="text-base font-black text-brand-sandstone">
                  {geoStats.loading ? '…' : geoStats.creators.toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-brand-twilight border border-slate-800 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-sandstone/60 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-brand-sunriseCoral" /> Businesses
                </span>
                <p className="text-base font-black text-brand-sandstone">
                  {geoStats.loading ? '…' : geoStats.businesses.toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-brand-twilight border border-slate-800 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-sandstone/60 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-yellow-400" /> Guilds &amp; Hubs
                </span>
                <p className="text-base font-black text-brand-sandstone">
                  {geoStats.loading ? '…' : geoStats.communities.toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-brand-twilight border border-slate-800 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-sandstone/60 flex items-center gap-1">
                  <Tv className="w-3 h-3 text-red-400" /> Live Ingest
                </span>
                <p className="text-base font-black text-red-400">
                  {geoStats.loading ? '…' : `${geoStats.live} Active`}
                </p>
              </div>
            </div>

            {/* Deep-link Action Buttons (Discovery Architecture) */}
            <div className="space-y-2 pt-2">
              <Link
                href={`/explore?country=${selectedEntity.iso}`}
                className="w-full block bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black py-2.5 rounded-2xl text-xs text-center transition-all shadow-md shadow-brand-caribbeanSea/20 hover:brightness-110"
              >
                Explore {selectedEntity.shortName} Feed →
              </Link>
              <Link
                href={`/events?city=${encodeURIComponent(selectedEntity.shortName)}`}
                className="w-full block bg-brand-twilight hover:bg-slate-800 text-slate-200 font-bold py-2 rounded-2xl text-xs text-center border border-slate-700/80 transition-colors"
              >
                View Cultural Fetes &amp; Events
              </Link>
              <Link
                href={`/communities?country=${selectedEntity.iso}`}
                className="w-full block bg-brand-twilight hover:bg-slate-800 text-brand-caribbeanSea font-bold py-2 rounded-2xl text-xs text-center border border-slate-700/80 transition-colors"
              >
                Join {selectedEntity.shortName} Hubs &amp; Guilds
              </Link>
              <Link
                href="/marketplace?category=All%20Products"
                className="w-full block bg-brand-twilight hover:bg-slate-800 text-brand-goldenHour font-bold py-2 rounded-2xl text-xs text-center border border-slate-700/80 transition-colors"
              >
                Browse Marketplace Artisans
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile-First Slide-Up Bottom Sheet (< lg screens) ── */}
      {isMobileSheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedEntity.name} Discovery Hub`}
        >
          <div className="w-full max-h-[85vh] overflow-y-auto bg-[#0C1322] border-t border-slate-800 rounded-t-3xl p-5 space-y-4 shadow-2xl animate-slideUp">
            {/* Sheet Handle and Header */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-1.5 rounded-full bg-slate-700/80 mb-3" />
            </div>

            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedEntity.flag}</span>
                <div>
                  <h2 className="text-lg font-black text-white leading-tight">
                    {selectedEntity.name}
                  </h2>
                  <p className="text-xs text-brand-sandstone/60">
                    {selectedEntity.capital} • {selectedEntity.region}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareEntity}
                  aria-label="Share territory"
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileSheetOpen(false)}
                  aria-label="Close sheet"
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${classificationStyle.bg} ${classificationStyle.text} ${classificationStyle.border}`}>
                {selectedEntity.classification}
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-twilight text-brand-caribbeanSea border border-slate-800">
                {selectedEntity.iso}
              </span>
              <span className="text-[11px] font-bold text-brand-goldenHour ml-auto">
                {selectedEntity.trendingTag}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {selectedEntity.summary}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] font-bold text-brand-sandstone/60 flex items-center gap-1">
                  <Users className="w-3 h-3 text-brand-caribbeanSea" /> Members
                </span>
                <p className="text-sm font-black text-white">
                  {geoStats.loading ? '…' : geoStats.creators.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] font-bold text-brand-sandstone/60 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-brand-sunriseCoral" /> Businesses
                </span>
                <p className="text-sm font-black text-white">
                  {geoStats.loading ? '…' : geoStats.businesses.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="space-y-2 pt-2 pb-4">
              <Link
                href={`/explore?country=${selectedEntity.iso}`}
                onClick={() => setIsMobileSheetOpen(false)}
                className="w-full block bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black py-3 rounded-2xl text-xs text-center transition-all shadow-md min-h-[44px] flex items-center justify-center"
              >
                Explore {selectedEntity.shortName} Feed →
              </Link>
              <Link
                href={`/events?city=${encodeURIComponent(selectedEntity.shortName)}`}
                onClick={() => setIsMobileSheetOpen(false)}
                className="w-full block bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-2xl text-xs text-center border border-slate-700/80 transition-colors min-h-[44px] flex items-center justify-center"
              >
                View Cultural Fetes &amp; Events
              </Link>
              <Link
                href={`/communities?country=${selectedEntity.iso}`}
                onClick={() => setIsMobileSheetOpen(false)}
                className="w-full block bg-slate-800 hover:bg-slate-700 text-brand-caribbeanSea font-bold py-2.5 rounded-2xl text-xs text-center border border-slate-700/80 transition-colors min-h-[44px] flex items-center justify-center"
              >
                Join {selectedEntity.shortName} Hubs &amp; Guilds
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

