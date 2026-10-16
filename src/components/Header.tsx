import React from 'react';
import {
  Bell,
  BellRing,
  RefreshCw,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Server,
  Radio,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { UserAlertSettings } from '../types/psi';

interface HeaderProps {
  lastUpdated: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  nextRefreshSeconds: number;
  unreadAlertCount: number;
  onOpenNotifications: () => void;
  onOpenServerless: () => void;
  alertSettings: UserAlertSettings;
  onToggleSound: () => void;
  unhealthyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  isRefreshing,
  onRefresh,
  nextRefreshSeconds,
  unreadAlertCount,
  onOpenNotifications,
  onOpenServerless,
  alertSettings,
  onToggleSound,
  unhealthyCount,
}) => {
  // Format update time nicely
  const formattedTime = React.useMemo(() => {
    if (!lastUpdated) return 'Syncing...';
    try {
      const d = new Date(lastUpdated);
      return d.toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return lastUpdated;
    }
  }, [lastUpdated]);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Singapore Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-600 via-red-600 to-red-700 shadow-lg shadow-red-950/50 border border-rose-500/30">
              {/* Singapore Crescent & Stars representation */}
              <div className="relative flex items-center justify-center text-white">
                <Radio className="w-5 h-5 text-white animate-pulse" />
              </div>
              {unhealthyCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-slate-950"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  SG AirGuard
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    Singapore PSI
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                NEA Real-Time Air Quality &amp; Unhealthy Threshold Alert System
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Sync Status & Refresh */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">NEA SGT:</span>
              <span className="font-mono font-medium text-slate-200">{formattedTime}</span>
              <span className="text-slate-500 text-[11px]">({nextRefreshSeconds}s)</span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Sound alert toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 sm:p-2.5 rounded-xl border transition-colors ${
                alertSettings.soundEnabled
                  ? 'bg-slate-900 hover:bg-slate-800 text-blue-400 border-slate-800'
                  : 'bg-slate-900/50 hover:bg-slate-800 text-slate-500 border-slate-800'
              }`}
              title={alertSettings.soundEnabled ? 'Alert chime sound is ON' : 'Alert chime sound is MUTED'}
            >
              {alertSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Serverless Backend Bridge button */}
            <button
              onClick={onOpenServerless}
              className="relative p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Configure Serverless Backend Webhook"
            >
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Serverless</span>
              {alertSettings.serverlessWebhookUrl && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>

            {/* Push Notifications & Threshold Alerts Trigger */}
            <button
              onClick={onOpenNotifications}
              className={`relative p-2 sm:px-3 sm:py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm ${
                unreadAlertCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-blue-600/90 text-white border-blue-500 hover:bg-blue-500 shadow-blue-900/30'
              }`}
              title="Alert Settings & Push Notifications"
            >
              {unreadAlertCount > 0 ? (
                <BellRing className="w-4 h-4 animate-bounce text-amber-300" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Alerts</span>

              {unreadAlertCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-md">
                  {unreadAlertCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
