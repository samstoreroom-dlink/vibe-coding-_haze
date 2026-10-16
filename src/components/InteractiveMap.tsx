import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Wind,
  MapPin,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { RegionDataSnapshot, RegionName } from '../types/psi';
import { AIR_QUALITY_BANDS, getAirQualityBand, getPm25Band } from '../services/psiApi';

interface InteractiveMapProps {
  snapshots: Record<RegionName, RegionDataSnapshot>;
  selectedRegion: RegionName;
  onSelectRegion: (region: RegionName) => void;
  thresholdPsi: number;
}

type MetricType = 'psi24h' | 'pm25_1h' | 'pm25_24h';
type MapTheme = 'radar' | 'slate' | 'clean';

// Regional SVG paths representing Singapore sectors
// Normalized coordinates within viewBox="0 0 920 540"
const REGION_PATHS: Record<
  'north' | 'south' | 'east' | 'west' | 'central',
  { path: string; center: [number, number]; labelOffset: [number, number] }
> = {
  north: {
    // Woodlands, Sembawang, Yishun, Mandai, Kranji, Seletar
    path: `M 340 70 
           L 460 40 
           L 570 65 
           L 590 120 
           L 530 180 
           L 430 180 
           L 350 160 
           L 300 130 
           Z`,
    center: [445, 115],
    labelOffset: [0, -10],
  },
  central: {
    // Bishan, Ang Mo Kio, Toa Payoh, Bukit Timah, Novena, Kallang
    path: `M 350 160 
           L 430 180 
           L 530 180 
           L 560 250 
           L 520 310 
           L 440 315 
           L 360 270 
           L 330 210 
           Z`,
    center: [445, 245],
    labelOffset: [0, 0],
  },
  east: {
    // Tampines, Pasir Ris, Changi, Bedok, Marine Parade, Punggol
    path: `M 570 65 
           L 690 90 
           L 840 180 
           L 870 230 
           L 750 310 
           L 630 330 
           L 560 250 
           L 530 180 
           L 590 120 
           Z`,
    center: [680, 205],
    labelOffset: [15, 0],
  },
  west: {
    // Jurong East/West, Tuas, Pioneer, Clementi, Bukit Batok, CCK, Lim Chu Kang
    path: `M 300 130 
           L 350 160 
           L 330 210 
           L 360 270 
           L 330 330 
           L 260 350 
           L 150 420 
           L 60 440 
           L 70 370 
           L 160 260 
           L 210 170 
           Z`,
    center: [230, 280],
    labelOffset: [-20, 0],
  },
  south: {
    // Marina South, Tanjong Pagar, Sentosa, Telok Blangah, Pasir Panjang, CBD
    path: `M 360 270 
           L 440 315 
           L 520 310 
           L 630 330 
           L 590 410 
           L 480 430 
           L 380 400 
           L 330 330 
           Z`,
    center: [475, 365],
    labelOffset: [0, 15],
  },
};

// Singapore Offshore Islands: Sentosa, Jurong Island, Pulau Ubin, Pulau Tekong
const ISLAND_PATHS = [
  // Sentosa
  { id: 'sentosa', path: 'M 450 445 C 470 440, 510 445, 520 460 C 510 475, 470 475, 440 460 Z', name: 'Sentosa' },
  // Jurong Island
  { id: 'jurong_island', path: 'M 220 420 C 270 410, 310 435, 300 465 C 260 480, 200 460, 220 420 Z', name: 'Jurong Island' },
  // Pulau Ubin
  { id: 'ubin', path: 'M 710 80 C 740 75, 770 90, 750 110 C 720 115, 695 95, 710 80 Z', name: 'Pulau Ubin' },
  // Pulau Tekong
  { id: 'tekong', path: 'M 790 90 C 840 85, 875 120, 850 150 C 810 160, 775 125, 790 90 Z', name: 'Pulau Tekong' },
];

// Key Landmarks for Singapore context
const LANDMARKS = [
  { name: 'Woodlands Crossing', x: 395, y: 65 },
  { name: 'Changi Airport', x: 825, y: 220 },
  { name: 'Marina Bay', x: 535, y: 360 },
  { name: 'Tuas Port', x: 85, y: 430 },
  { name: 'MacRitchie Reservoir', x: 440, y: 230 },
];

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  snapshots,
  selectedRegion,
  onSelectRegion,
  thresholdPsi,
}) => {
  const [metric, setMetric] = useState<MetricType>('psi24h');
  const [theme, setTheme] = useState<MapTheme>('radar');
  const [showWind, setShowWind] = useState<boolean>(true);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showLandmarks, setShowLandmarks] = useState<boolean>(false);
  const [hoveredRegion, setHoveredRegion] = useState<RegionName | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const getMetricValue = (region: RegionName): number => {
    const snap = snapshots[region];
    if (!snap) return 0;
    if (metric === 'psi24h') return snap.psi24h;
    if (metric === 'pm25_1h') return snap.pm25OneHourly;
    return snap.pm25TwentyFourHourly;
  };

  const getRegionFill = (region: 'north' | 'south' | 'east' | 'west' | 'central'): string => {
    const val = getMetricValue(region);
    let color = '#10b981';
    let opacity = 0.35;

    if (metric === 'psi24h' || metric === 'pm25_24h') {
      const band = getAirQualityBand(val);
      color = AIR_QUALITY_BANDS[band].color;
      if (band === 'Unhealthy') opacity = 0.5;
      if (band === 'Very Unhealthy') opacity = 0.65;
      if (band === 'Hazardous') opacity = 0.8;
    } else {
      const pmBand = getPm25Band(val);
      color = pmBand.color;
      opacity = val > 150 ? 0.65 : val > 55 ? 0.45 : 0.3;
    }

    if (selectedRegion === region) {
      opacity = Math.min(0.9, opacity + 0.25);
    } else if (hoveredRegion === region) {
      opacity = Math.min(0.8, opacity + 0.15);
    }

    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  const getRegionStroke = (region: 'north' | 'south' | 'east' | 'west' | 'central'): string => {
    const isSelected = selectedRegion === region;
    const isHovered = hoveredRegion === region;
    if (isSelected) return '#ffffff';
    if (isHovered) return '#38bdf8';

    const val = getMetricValue(region);
    if (val >= thresholdPsi) return '#f43f5e';
    return '#475569';
  };

  const activeRegionData = snapshots[selectedRegion] || snapshots.national;

  return (
    <div className="relative flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Top Map Header / Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Sensor Radar
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Republic of Singapore (5 NEA Regional Sectors)
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
            Air Quality Distribution Map
          </h2>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setMetric('psi24h')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              metric === 'psi24h'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            24-Hr PSI
          </button>
          <button
            onClick={() => setMetric('pm25_1h')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              metric === 'pm25_1h'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            1-Hr PM2.5 (µg/m³)
          </button>
          <button
            onClick={() => setMetric('pm25_24h')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              metric === 'pm25_24h'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            24-Hr PM2.5
          </button>
        </div>

        {/* Map Toggles (Wind, Stations, Theme) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWind(!showWind)}
            title="Toggle Monsoon Wind & Haze Drift Stream"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showWind
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Monsoon Drift</span>
          </button>

          <button
            onClick={() => setShowStations(!showStations)}
            title="Toggle Station Markers"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showStations
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Stations</span>
          </button>

          <button
            onClick={() => setShowLandmarks(!showLandmarks)}
            title="Toggle Landmarks"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showLandmarks
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Landmarks</span>
          </button>

          {/* Theme Selector */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            {(['radar', 'slate', 'clean'] as MapTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-2 py-1 text-[11px] capitalize rounded font-medium transition-colors ${
                  theme === t ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Interactive Map Canvas */}
      <div
        className={`relative w-full aspect-[16/9] min-h-[380px] sm:min-h-[460px] flex items-center justify-center select-none overflow-hidden transition-colors duration-500 ${
          theme === 'radar'
            ? 'bg-gradient-to-b from-[#070b14] via-[#0b1324] to-[#070d18]'
            : theme === 'slate'
            ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
            : 'bg-gradient-to-b from-slate-900 via-slate-800/90 to-slate-900'
        }`}
      >
        {/* Subtle Map Grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {/* Animated Monsoon Wind & Haze Drift Overlay */}
        {showWind && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-full h-full relative">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-0.5 w-48 sm:w-72 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent rounded-full animate-wind"
                  style={{
                    top: `${15 + i * 16}%`,
                    left: `${-10 + i * 8}%`,
                    animationDelay: `${i * 1.2}s`,
                    animationDuration: `${5 + (i % 3)}s`,
                  }}
                />
              ))}
            </div>
            {/* Wind Indicator Tag */}
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur border border-cyan-500/30 text-cyan-300 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg">
              <Wind className="w-3.5 h-3.5 animate-pulse" />
              <span>SW Monsoon: 12 km/h (Drifting NE)</span>
            </div>
          </div>
        )}

        {/* Zoom & View Controls Overlay */}
        <div className="absolute right-4 top-4 flex flex-col gap-1.5 z-20">
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.15))}
            className="p-2 bg-slate-950/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/80 backdrop-blur transition-colors shadow-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
            className="p-2 bg-slate-950/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/80 backdrop-blur transition-colors shadow-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              onSelectRegion('national');
            }}
            className="p-2 bg-slate-950/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/80 backdrop-blur transition-colors shadow-lg"
            title="Reset Map View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* SVG Container with Zoom scale */}
        <div
          className="w-full h-full flex items-center justify-center p-2 sm:p-6 transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox="0 0 920 540"
            className="w-full h-full max-h-[500px] drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
          >
            <defs>
              <filter id="glow-danger" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id="radar-sweep" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Singapore Maritime Surrounding Water Outline */}
            <path
              d="M 20 200 Q 250 140 450 140 T 900 180"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity="0.4"
            />
            <path
              d="M 20 480 Q 450 490 900 440"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity="0.4"
            />

            {/* Offshore Islands */}
            {ISLAND_PATHS.map((island) => (
              <path
                key={island.id}
                d={island.path}
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.5"
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <title>{island.name}</title>
              </path>
            ))}

            {/* Regional Sector Polygons (North, South, East, West, Central) */}
            {(['north', 'south', 'east', 'west', 'central'] as const).map((r) => {
              const info = REGION_PATHS[r];
              const isSelected = selectedRegion === r;
              const isHovered = hoveredRegion === r;
              const fill = getRegionFill(r);
              const stroke = getRegionStroke(r);
              const snap = snapshots[r];
              const value = getMetricValue(r);
              const isUnhealthy = (snap?.psi24h ?? 0) >= thresholdPsi;

              return (
                <g key={r} className="cursor-pointer transition-all duration-300">
                  <path
                    d={info.path}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSelected ? '3.5' : isHovered ? '2.5' : '1.5'}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    onMouseEnter={() => setHoveredRegion(r)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => onSelectRegion(r)}
                    className="transition-all duration-200"
                    style={{
                      filter: isUnhealthy && isSelected ? 'url(#glow-danger)' : undefined,
                    }}
                  />

                  {/* Regional Centroid Label */}
                  <g
                    transform={`translate(${info.center[0] + info.labelOffset[0]}, ${
                      info.center[1] + info.labelOffset[1]
                    })`}
                    className="pointer-events-none"
                  >
                    <rect
                      x="-55"
                      y="-22"
                      width="110"
                      height="44"
                      rx="8"
                      fill="#090d16"
                      fillOpacity={isSelected ? '0.92' : '0.8'}
                      stroke={isSelected ? '#38bdf8' : '#334155'}
                      strokeWidth={isSelected ? '2' : '1'}
                    />
                    <text
                      x="0"
                      y="-4"
                      textAnchor="middle"
                      fill="#cbd5e1"
                      fontSize="11"
                      fontWeight="600"
                      letterSpacing="0.5"
                    >
                      {r.toUpperCase()}
                    </text>
                    <text
                      x="0"
                      y="14"
                      textAnchor="middle"
                      fill={AIR_QUALITY_BANDS[getAirQualityBand(snap?.psi24h ?? 0)].color}
                      fontSize="14"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      {value} {metric === 'pm25_1h' ? 'µg' : 'PSI'}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Monitoring Stations Rings & Markers */}
            {showStations &&
              (['north', 'south', 'east', 'west', 'central'] as const).map((r) => {
                const info = REGION_PATHS[r];
                const snap = snapshots[r];
                const isUnhealthy = (snap?.psi24h ?? 0) >= thresholdPsi;
                const bandColor = AIR_QUALITY_BANDS[getAirQualityBand(snap?.psi24h ?? 0)].color;
                const isSelected = selectedRegion === r;

                // Adjust station anchor position slightly off center for realism
                const stationX = info.center[0] + (r === 'east' ? 35 : r === 'west' ? -30 : r === 'north' ? 0 : r === 'south' ? 10 : 0);
                const stationY = info.center[1] + (r === 'north' ? -25 : r === 'south' ? 35 : r === 'west' ? 30 : -25);

                return (
                  <g
                    key={`station-${r}`}
                    transform={`translate(${stationX}, ${stationY})`}
                    className="cursor-pointer"
                    onClick={() => onSelectRegion(r)}
                  >
                    {/* Pulsing ring if unhealthy or selected */}
                    {(isUnhealthy || isSelected) && (
                      <circle
                        r={isSelected ? '22' : '16'}
                        fill="none"
                        stroke={bandColor}
                        strokeWidth="2"
                        className="animate-pulse-ring"
                      />
                    )}

                    {/* Sensor Pin Base */}
                    <circle r="7" fill="#090d16" stroke={bandColor} strokeWidth="2.5" />
                    <circle r="3" fill={bandColor} />

                    {/* Station Tag */}
                    <text
                      x="10"
                      y="4"
                      fill="#94a3b8"
                      fontSize="9"
                      fontWeight="500"
                      className="hidden sm:inline"
                    >
                      {r === 'north'
                        ? 'Woodlands Stn'
                        : r === 'south'
                        ? 'Marina Stn'
                        : r === 'east'
                        ? 'Tampines Stn'
                        : r === 'west'
                        ? 'Jurong Stn'
                        : 'Central Stn'}
                    </text>
                  </g>
                );
              })}

            {/* Landmarks Overlay */}
            {showLandmarks &&
              LANDMARKS.map((lm, idx) => (
                <g key={idx} transform={`translate(${lm.x}, ${lm.y})`} className="pointer-events-none">
                  <circle r="3.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                  <text
                    x="6"
                    y="3"
                    fill="#cbd5e1"
                    fontSize="9"
                    fontWeight="500"
                    filter="drop-shadow(0 1px 2px #000)"
                  >
                    {lm.name}
                  </text>
                </g>
              ))}
          </svg>
        </div>

        {/* Floating Active Region Quick Inspector (Bottom Left) */}
        <div className="absolute left-4 bottom-4 max-w-[280px] sm:max-w-[320px] bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-3 sm:p-4 text-xs shadow-xl z-20">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Focused Station
              </span>
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                {activeRegionData.displayName}
              </h3>
            </div>
            <div
              className="px-2 py-1 rounded-md text-xs font-bold text-white"
              style={{
                backgroundColor: AIR_QUALITY_BANDS[activeRegionData.band].color,
              }}
            >
              {activeRegionData.band}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-medium">24-Hr PSI</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">
                {activeRegionData.psi24h}
              </div>
              <div className="text-[10px] text-slate-400">
                {activeRegionData.psi24h > thresholdPsi ? '⚠️ Exceeds Alert' : 'Within normal'}
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-medium">1-Hr PM2.5</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">
                {activeRegionData.pm25OneHourly}{' '}
                <span className="text-xs font-normal text-slate-400">µg/m³</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {getPm25Band(activeRegionData.pm25OneHourly).label}
              </div>
            </div>
          </div>

          {activeRegionData.psi24h >= 100 && (
            <div className="mt-2.5 flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] leading-tight">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>N95 mask recommended for prolonged outdoor activities in this sector.</span>
            </div>
          )}
        </div>

        {/* Legend Overlay (Bottom Right) */}
        <div className="absolute right-4 bottom-4 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 sm:p-3 text-[11px] shadow-xl hidden sm:block z-20">
          <div className="font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>NEA PSI Index</span>
            <span className="text-[10px] text-slate-500">24-Hr Standard</span>
          </div>
          <div className="flex flex-col gap-1">
            {Object.entries(AIR_QUALITY_BANDS).map(([name, band]) => (
              <div key={name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: band.color }}
                  />
                  <span className="text-slate-300">{name}</span>
                </div>
                <span className="font-mono text-slate-400 text-[10px]">{band.rangeText}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
