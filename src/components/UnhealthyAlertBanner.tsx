import React from 'react';
import { AlertTriangle, Bell, ShieldAlert, X, ChevronRight, Wind } from 'lucide-react';
import { RegionDataSnapshot, RegionName } from '../types/psi';
import { AIR_QUALITY_BANDS, getAirQualityBand } from '../services/psiApi';

interface UnhealthyAlertBannerProps {
  snapshots: Record<RegionName, RegionDataSnapshot>;
  thresholdPsi: number;
  onOpenNotifications: () => void;
  onSelectRegion: (region: RegionName) => void;
}

export const UnhealthyAlertBanner: React.FC<UnhealthyAlertBannerProps> = ({
  snapshots,
  thresholdPsi,
  onOpenNotifications,
  onSelectRegion,
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  // Find all regions that cross threshold or are Unhealthy (> 100)
  const regionsExceeding = (['central', 'east', 'west', 'north', 'south'] as const).filter((r) => {
    const snap = snapshots[r];
    return snap && (snap.psi24h >= thresholdPsi || snap.psi24h > 100);
  });

  if (dismissed || regionsExceeding.length === 0) {
    return null;
  }

  // Get the most severely affected region
  const worstRegion = regionsExceeding.reduce((worst, cur) => {
    const worstVal = snapshots[worst]?.psi24h ?? 0;
    const curVal = snapshots[cur]?.psi24h ?? 0;
    return curVal > worstVal ? cur : worst;
  }, regionsExceeding[0]);

  const maxPsi = snapshots[worstRegion]?.psi24h ?? 0;
  const band = getAirQualityBand(maxPsi);
  const isVeryUnhealthy = maxPsi > 200;

  return (
    <div
      className={`border-b transition-colors relative z-30 ${
        isVeryUnhealthy
          ? 'bg-gradient-to-r from-red-950 via-red-900/90 to-rose-950 border-red-700/60 text-red-100 shadow-xl shadow-red-950/40'
          : 'bg-gradient-to-r from-amber-950 via-amber-900/90 to-yellow-950 border-amber-700/60 text-amber-100 shadow-xl shadow-amber-950/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Alert Message */}
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                isVeryUnhealthy ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isVeryUnhealthy ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {band} Alert (Peak {maxPsi} PSI)
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {regionsExceeding.length} Singapore {regionsExceeding.length === 1 ? 'Region' : 'Regions'} Exceeding Alert Threshold ({thresholdPsi} PSI)
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 mt-1">
                {isVeryUnhealthy
                  ? 'High pollution levels detected. Healthy persons should avoid prolonged strenuous outdoor activity. Vulnerable persons (elderly, children, respiratory patients) stay indoors.'
                  : 'Air quality in affected regions is elevated. Reduce strenuous outdoor exertion. N95 masks advised if spending extended time outdoors.'}
              </p>

              {/* Quick region tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Affected Sectors:</span>
                {regionsExceeding.map((r) => {
                  const snap = snapshots[r];
                  return (
                    <button
                      key={r}
                      onClick={() => onSelectRegion(r)}
                      className="px-2 py-0.5 rounded text-xs font-medium bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors flex items-center gap-1"
                    >
                      <span className="capitalize">{r}</span>
                      <span className="font-mono font-bold text-amber-300">
                        {snap?.psi24h} PSI
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={onOpenNotifications}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-950 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow"
            >
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              <span>Configure Push Alerts</span>
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg hover:bg-black/20 text-slate-400 hover:text-white transition-colors"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
