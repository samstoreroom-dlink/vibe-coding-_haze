import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Heart,
  Baby,
  PersonStanding,
  Activity,
  Wind,
  Home,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { AirQualityBand, RegionDataSnapshot } from '../types/psi';
import { AIR_QUALITY_BANDS } from '../services/psiApi';

interface HealthAdvisoryProps {
  currentSnapshot: RegionDataSnapshot;
}

export const HealthAdvisory: React.FC<HealthAdvisoryProps> = ({ currentSnapshot }) => {
  const psi = currentSnapshot.psi24h;
  const pm25 = currentSnapshot.pm25OneHourly;
  const band = currentSnapshot.band;
  const [selectedPersona, setSelectedPersona] = useState<'healthy' | 'vulnerable' | 'chronic' | 'runner'>('healthy');

  // Compute N95 mask recommendation
  const getN95Recommendation = () => {
    if (psi > 200) {
      return {
        level: 'Strongly Recommended',
        color: 'text-red-400 bg-red-500/10 border-red-500/30',
        detail: 'N95 respirator required for all outdoor activities. Note: Surgical masks and cloth masks offer negligible protection against fine PM2.5 particles.',
      };
    }
    if (psi > 100) {
      return {
        level: 'Recommended for Outdoor Exertion',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        detail: 'Recommended for prolonged outdoor exposure or strenuous activity, especially for vulnerable individuals.',
      };
    }
    return {
      level: 'Not Required',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      detail: 'Ambient air quality does not necessitate protective respiratory equipment for general activities.',
    };
  };

  const n95 = getN95Recommendation();

  // Persona guidelines based on MOH Singapore
  const getPersonaGuidance = () => {
    if (psi > 200) {
      return {
        healthy: {
          outdoorActivity: 'Avoid prolonged or strenuous outdoor exertion.',
          running: 'Avoid outdoor running or high-intensity sports. Shift workouts indoors.',
          mask: 'Wear N95 mask if outdoors for prolonged periods.',
          windows: 'Keep windows and doors closed. Use air purifiers with HEPA filtration.',
        },
        vulnerable: {
          outdoorActivity: 'Avoid all outdoor activity. Remain in air-conditioned or filtered indoor rooms.',
          running: 'Do not exercise outdoors.',
          mask: 'Wear N95 mask if travel outdoors is unavoidable (take breaks if feeling breathless).',
          windows: 'Seal windows and doors. Avoid smoking or burning incense indoors.',
        },
        chronic: {
          outdoorActivity: 'Remain indoors at all times. Keep fast-acting rescue inhalers accessible.',
          running: 'Strictly avoid physical exertion.',
          mask: 'Consult physician regarding N95 mask use (N95 increases breathing resistance).',
          windows: 'Stay in room with active HEPA air cleaner. Seek immediate medical attention if wheezing or chest tightness occurs.',
        },
        runner: {
          outdoorActivity: 'Cancel all outdoor endurance runs, cycling, and bootcamps.',
          running: 'Exercise on indoor gym treadmill or stationary bike with filtered air.',
          mask: 'Do not wear N95 during strenuous running due to increased cardiac & respiratory resistance.',
          windows: 'Ensure indoor facility has commercial HVAC or portable HEPA filters.',
        },
      };
    } else if (psi > 100) {
      return {
        healthy: {
          outdoorActivity: 'Reduce prolonged or strenuous outdoor exertion (take frequent hydration breaks).',
          running: 'Lower intensity: switch from tempo run to light jog, or run indoors.',
          mask: 'Optional; recommended if experiencing throat or eye irritation.',
          windows: 'Close windows during peak haze hours. Run fans and air conditioning.',
        },
        vulnerable: {
          outdoorActivity: 'Avoid prolonged outdoor physical exertion. Elderly and children stay indoors.',
          running: 'Limit playground and PE activities. Schools move PE indoors.',
          mask: 'N95 advised if spending time outdoors.',
          windows: 'Close windows. Run air purifiers with genuine HEPA filter.',
        },
        chronic: {
          outdoorActivity: 'Avoid all outdoor exertion. Minimize exposure to outdoor air.',
          running: 'No strenuous outdoor sports. Monitor peak flow readings if asthmatic.',
          mask: 'Have reliever inhaler ready at all times.',
          windows: 'Keep indoor environment clean and well-filtered.',
        },
        runner: {
          outdoorActivity: 'Limit outdoor runs to under 30 minutes, or shift to early morning before haze builds up.',
          running: 'Indoor treadmill workouts strongly recommended.',
          mask: 'Avoid running with N95 mask. Rest if feeling breathlessness.',
          windows: 'Hydrate frequently to soothe airways.',
        },
      };
    } else {
      return {
        healthy: {
          outdoorActivity: 'Normal outdoor activities for everyone.',
          running: 'Safe for long-distance marathon training, cycling, and outdoor HIIT.',
          mask: 'No mask required.',
          windows: 'Safe to open windows for natural ventilation.',
        },
        vulnerable: {
          outdoorActivity: 'Safe for outdoor walks, park visits, and school sports.',
          running: 'Normal play and recreational activity.',
          mask: 'No mask needed.',
          windows: 'Good natural ventilation recommended.',
        },
        chronic: {
          outdoorActivity: 'Normal daily activities. Maintain routine maintenance medications.',
          running: 'Safe to exercise according to usual personal doctor recommendations.',
          mask: 'Standard routine care.',
          windows: 'Natural ventilation is safe.',
        },
        runner: {
          outdoorActivity: 'Ideal conditions for outdoor training across Singapore park connectors.',
          running: 'Optimal air quality for peak athletic performance.',
          mask: 'No restriction.',
          windows: 'Open air is clean.',
        },
      };
    }
  };

  const guidance = getPersonaGuidance()[selectedPersona];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-blue-500/10 text-blue-400">
              <Activity className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">
              MOH &amp; NEA Official Guidelines
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Health Advisory &amp; Outdoor Activity Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Tailored to {currentSnapshot.displayName} ({currentSnapshot.psi24h} PSI &bull; {band})
          </p>
        </div>

        {/* N95 Mask Status Badge */}
        <div className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 ${n95.color}`}>
          <div className="p-1.5 rounded-lg bg-black/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold opacity-80">N95 Mask Guidance</div>
            <div className="text-xs font-extrabold">{n95.level}</div>
          </div>
        </div>
      </div>

      {/* Persona Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <button
          onClick={() => setSelectedPersona('healthy')}
          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
            selectedPersona === 'healthy'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <PersonStanding className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <div className="text-xs font-bold">Healthy Persons</div>
            <div className="text-[10px] text-slate-400">General Public</div>
          </div>
        </button>

        <button
          onClick={() => setSelectedPersona('vulnerable')}
          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
            selectedPersona === 'vulnerable'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Baby className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <div className="text-xs font-bold">Elderly &amp; Children</div>
            <div className="text-[10px] text-slate-400">Seniors &amp; Pregnant</div>
          </div>
        </button>

        <button
          onClick={() => setSelectedPersona('chronic')}
          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
            selectedPersona === 'chronic'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <div className="text-xs font-bold">Chronic Conditions</div>
            <div className="text-[10px] text-slate-400">Asthma &amp; Cardiac</div>
          </div>
        </button>

        <button
          onClick={() => setSelectedPersona('runner')}
          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
            selectedPersona === 'runner'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-bold">Athletes &amp; Runners</div>
            <div className="text-[10px] text-slate-400">Outdoor Endurance</div>
          </div>
        </button>
      </div>

      {/* Advisory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Outdoor Activity */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 shrink-0">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Outdoor Exertion Guidance</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{guidance.outdoorActivity}</p>
          </div>
        </div>

        {/* Sports & Running */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Exercise &amp; Fitness Protocol</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{guidance.running}</p>
          </div>
        </div>

        {/* Respiratory Protection */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Mask &amp; Protection Strategy</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{guidance.mask}</p>
          </div>
        </div>

        {/* Indoor Air & Ventilation */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Home &amp; Workplace Ventilation</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{guidance.windows}</p>
          </div>
        </div>
      </div>

      {/* Note about surgical masks vs N95 */}
      <div className="mt-4 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Singapore MOH Medical Note: </span>
          Ordinary surgical masks and paper masks only protect against large droplets and do not filter fine PM2.5 smoke particles. Only genuine certified N95 respirators with tight facial seal filter 95% of fine particles.
        </div>
      </div>
    </div>
  );
};
