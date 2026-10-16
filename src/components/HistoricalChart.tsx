import React, { useState } from 'react';
import { TrendingUp, Clock, Calendar, Eye, EyeOff } from 'lucide-react';
import { HistoricalDataPoint, RegionName } from '../types/psi';
import { AIR_QUALITY_BANDS } from '../services/psiApi';

interface HistoricalChartProps {
  data: HistoricalDataPoint[];
  selectedRegion: RegionName;
  thresholdPsi: number;
}

const REGION_COLORS: Record<RegionName, string> = {
  national: '#38bdf8', // Sky blue
  central: '#a855f7', // Purple
  east: '#ec4899', // Pink
  west: '#eab308', // Amber/Yellow
  north: '#10b981', // Emerald
  south: '#f97316', // Orange
};

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  data,
  selectedRegion,
  thresholdPsi,
}) => {
  const [activeRegions, setActiveRegions] = useState<Record<RegionName, boolean>>({
    national: true,
    central: true,
    east: true,
    west: true,
    north: true,
    south: true,
  });

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const toggleRegion = (r: RegionName) => {
    setActiveRegions((prev) => ({
      ...prev,
      [r]: !prev[r],
    }));
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        Loading 24-hour historical trend data...
      </div>
    );
  }

  // Calculate bounds
  const allValues = data.flatMap((d) => [
    d.national,
    d.central,
    d.east,
    d.west,
    d.north,
    d.south,
  ]);
  const maxVal = Math.max(220, Math.ceil(Math.max(...allValues) / 50) * 50 + 20);
  const minVal = 0;

  // SVG dimensions
  const width = 800;
  const height = 300;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
  };

  const getPath = (regionKey: RegionName) => {
    return data
      .map((d, i) => {
        const val = d[regionKey];
        const x = getX(i);
        const y = getY(val);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const hoveredItem = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">
              24-Hour Trend Analysis
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Singapore PSI Hourly Progression
          </h3>
          <p className="text-xs text-slate-400">
            Compare air pollution trends across all 5 NEA regions
          </p>
        </div>

        {/* Region toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['national', 'central', 'east', 'west', 'north', 'south'] as const).map((r) => {
            const isActive = activeRegions[r];
            const color = REGION_COLORS[r];
            const isCurSelected = selectedRegion === r;

            return (
              <button
                key={r}
                onClick={() => toggleRegion(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-800/90 text-white'
                    : 'bg-slate-950/40 text-slate-500 border-slate-800/60'
                }`}
                style={{
                  borderColor: isActive ? color : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isActive ? color : '#64748b' }}
                />
                <span className="capitalize">{r === 'national' ? 'Islandwide' : r}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[550px] overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Soft vertical gradient for hover marker */}
            <linearGradient id="hover-line" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {[0, 50, 100, 150, 200, 250, 300]
            .filter((val) => val <= maxVal)
            .map((val) => {
              const y = getY(val);
              const isThreshold = val === thresholdPsi;
              const isUnhealthy = val === 100;
              const isVeryUnhealthy = val === 200;

              return (
                <g key={val}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke={
                      isThreshold
                        ? '#f43f5e'
                        : isVeryUnhealthy
                        ? '#ef4444'
                        : isUnhealthy
                        ? '#f59e0b'
                        : '#1e293b'
                    }
                    strokeWidth={isThreshold ? '1.5' : '1'}
                    strokeDasharray={isThreshold || isUnhealthy || isVeryUnhealthy ? '4 4' : undefined}
                    opacity={isThreshold ? '0.8' : isUnhealthy || isVeryUnhealthy ? '0.5' : '0.4'}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    fill={
                      isThreshold
                        ? '#f43f5e'
                        : isVeryUnhealthy
                        ? '#ef4444'
                        : isUnhealthy
                        ? '#f59e0b'
                        : '#64748b'
                    }
                    fontSize="10"
                    textAnchor="end"
                    fontWeight="500"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                  {isThreshold && (
                    <text
                      x={width - paddingRight}
                      y={y - 6}
                      fill="#f43f5e"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      Threshold Alert ({thresholdPsi} PSI)
                    </text>
                  )}
                </g>
              );
            })}

          {/* X-axis time labels */}
          {data.map((d, i) => {
            if (i % Math.ceil(data.length / 8) !== 0 && i !== data.length - 1) return null;
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={height - 12}
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
                fontWeight="500"
                fontFamily="monospace"
              >
                {d.timeLabel}
              </text>
            );
          })}

          {/* Region Lines */}
          {(['north', 'south', 'east', 'west', 'central', 'national'] as const).map((r) => {
            if (!activeRegions[r]) return null;
            const color = REGION_COLORS[r];
            const isSelected = selectedRegion === r;
            const pathStr = getPath(r);

            return (
              <g key={r}>
                <path
                  d={pathStr}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? '3.5' : r === 'national' ? '2.5' : '1.8'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isSelected ? 1 : 0.75}
                />
              </g>
            );
          })}

          {/* Hover tracker line & invisible mouse detection bars */}
          {data.map((_, i) => {
            const x = getX(i);
            const colWidth = chartWidth / data.length;

            return (
              <rect
                key={i}
                x={x - colWidth / 2}
                y={paddingTop}
                width={colWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}

          {/* Active Hover Vertical Line & Dots */}
          {hoverIndex !== null && (
            <g className="pointer-events-none">
              <line
                x1={getX(hoverIndex)}
                y1={paddingTop}
                x2={getX(hoverIndex)}
                y2={paddingTop + chartHeight}
                stroke="url(#hover-line)"
                strokeWidth="2"
                strokeDasharray="3 3"
              />

              {(['national', 'central', 'east', 'west', 'north', 'south'] as const).map((r) => {
                if (!activeRegions[r]) return null;
                const val = data[hoverIndex][r];
                const x = getX(hoverIndex);
                const y = getY(val);
                const color = REGION_COLORS[r];

                return (
                  <circle
                    key={r}
                    cx={x}
                    cy={y}
                    r="4.5"
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth="2.5"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Tooltip Summary bar */}
      <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-slate-400">Snapshot Time:</span>
          <span className="font-mono font-bold text-white">{hoveredItem?.timeLabel || '--:--'} SGT</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(['national', 'central', 'east', 'west', 'north', 'south'] as const).map((r) => {
            if (!activeRegions[r]) return null;
            const val = hoveredItem ? hoveredItem[r] : 0;
            const color = REGION_COLORS[r];

            return (
              <div key={r} className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-slate-400 capitalize">{r === 'national' ? 'Island' : r}:</span>
                <span className="font-bold text-white">{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
