import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import { RegionDataSnapshot, RegionName } from '../types/psi';
import { AIR_QUALITY_BANDS, getPm25Band } from '../services/psiApi';

interface RegionSummaryCardsProps {
  snapshots: Record<RegionName, RegionDataSnapshot>;
  selectedRegion: RegionName;
  onSelectRegion: (region: RegionName) => void;
  thresholdPsi: number;
}

const REGION_ORDER: RegionName[] = ['national', 'central', 'east', 'west', 'north', 'south'];

export const RegionSummaryCards: React.FC<RegionSummaryCardsProps> = ({
  snapshots,
  selectedRegion,
  onSelectRegion,
  thresholdPsi,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {REGION_ORDER.map((regionKey) => {
        const snap = snapshots[regionKey];
        if (!snap) return null;

        const isSelected = selectedRegion === regionKey;
        const bandInfo = AIR_QUALITY_BANDS[snap.band];
        const isThresholdExceeded = snap.psi24h >= thresholdPsi;
        const pm25Band = getPm25Band(snap.pm25OneHourly);

        return (
          <div
            key={regionKey}
            onClick={() => onSelectRegion(regionKey)}
            className={`cursor-pointer rounded-2xl p-3.5 transition-all duration-200 border relative overflow-hidden flex flex-col justify-between ${
              isSelected
                ? 'bg-slate-800/90 border-blue-500 shadow-lg shadow-blue-950/40 ring-2 ring-blue-500/20'
                : 'bg-slate-900/70 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Top Region Name & Tag */}
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-bold text-slate-200 truncate capitalize flex items-center gap-1">
                  {regionKey === 'national' ? (
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  ) : (
                    <MapPin className="w-3 h-3 text-slate-400" />
                  )}
                  {regionKey === 'national' ? 'Islandwide' : regionKey}
                </span>

                {isThresholdExceeded ? (
                  <span
                    className="p-1 rounded-md bg-amber-500/20 text-amber-400"
                    title={`Exceeds alert threshold (${thresholdPsi} PSI)`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* PSI Value Display */}
              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <div className="text-2xl font-black text-white font-mono tracking-tight">
                    {snap.psi24h}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">24-Hr PSI</div>
                </div>

                <div
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: bandInfo.color }}
                >
                  {snap.band}
                </div>
              </div>
            </div>

            {/* Bottom 1-Hr PM2.5 metric & Trend */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">1-Hr PM2.5</span>
                <span className="font-mono font-bold text-slate-200">
                  {snap.pm25OneHourly}{' '}
                  <span className="text-[9px] text-slate-400 font-normal">µg/m³</span>
                </span>
              </div>

              <div className="flex items-center gap-0.5 text-[10px] font-medium text-slate-400">
                {snap.trend === 'rising' ? (
                  <span className="text-rose-400 flex items-center">
                    <ArrowUpRight className="w-3 h-3" /> Up
                  </span>
                ) : snap.trend === 'falling' ? (
                  <span className="text-emerald-400 flex items-center">
                    <ArrowDownRight className="w-3 h-3" /> Down
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center">
                    <Minus className="w-3 h-3" /> Stable
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
