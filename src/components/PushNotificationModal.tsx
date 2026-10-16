import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  X,
  Send,
  Trash2,
  Clock,
  Sparkles,
  Info,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AlertNotification, RegionName, UserAlertSettings } from '../types/psi';
import { NotificationService } from '../services/notificationService';
import { AIR_QUALITY_BANDS, getAirQualityBand } from '../services/psiApi';

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserAlertSettings;
  onUpdateSettings: (newSettings: UserAlertSettings) => void;
  logs: AlertNotification[];
  onClearLogs: () => void;
  onMarkAllRead: () => void;
  onTriggerTestPush: () => void;
}

export const PushNotificationModal: React.FC<PushNotificationModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  logs,
  onClearLogs,
  onMarkAllRead,
  onTriggerTestPush,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(NotificationService.getPermissionStatus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await NotificationService.requestPermission();
    setPermission(res);
    if (res === 'granted') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      NotificationService.sendPushNotification('SG AirGuard Alerts Activated', {
        body: 'Push notifications are now enabled! You will be alerted whenever Singapore PSI exceeds your threshold.',
        severity: 'info',
      });
    }
  };

  const handleSendTest = () => {
    onTriggerTestPush();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const toggleRegion = (region: RegionName) => {
    const current = [...settings.monitoredRegions];
    const index = current.indexOf(region);
    if (index > -1) {
      if (current.length === 1) return; // keep at least one
      current.splice(index, 1);
    } else {
      current.push(region);
    }
    onUpdateSettings({ ...settings, monitoredRegions: current });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Push Notifications &amp; PSI Alert Settings
              </h2>
              <p className="text-xs text-slate-400">
                Configure real-time browser push alerts for hazardous haze thresholds
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Alert Configuration
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              onMarkAllRead();
            }}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Alert Log History</span>
            {logs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                {logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'settings' ? (
            <>
              {/* Browser Permission Banner */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Browser Push Permission</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          permission === 'granted'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : permission === 'denied'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {permission}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {permission === 'granted'
                        ? 'Push notifications are authorized on this device. You will receive system notifications even when working in another tab.'
                        : permission === 'denied'
                        ? 'Push notifications are blocked in your browser settings. Please click the padlock or site settings icon in your URL address bar to enable.'
                        : 'Grant notification permission so the app can alert you when air quality reaches unhealthy levels.'}
                    </p>
                  </div>
                </div>

                {permission !== 'granted' && (
                  <button
                    onClick={handleRequestPermission}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shrink-0 transition-colors shadow-lg shadow-blue-600/30"
                  >
                    Enable Push
                  </button>
                )}
              </div>

              {/* Threshold Slider */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">
                      Alert Trigger Threshold
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Notify me when Singapore 24-Hr PSI reaches or exceeds:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black font-mono text-amber-400">
                      {settings.thresholdPsi}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">PSI</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="50"
                  max="250"
                  step="5"
                  value={settings.thresholdPsi}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, thresholdPsi: Number(e.target.value) })
                  }
                  className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1">
                  <span>50 (Good)</span>
                  <span className="text-sky-400">100 (Unhealthy - Recommended)</span>
                  <span className="text-red-400">200 (Very Unhealthy)</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Current trigger will fire when air quality enters{' '}
                    <strong className="text-white">
                      {getAirQualityBand(settings.thresholdPsi)}
                    </strong>{' '}
                    status.
                  </span>
                </div>
              </div>

              {/* Monitored Regions Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white block">
                  Monitored Singapore Regions
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'national', label: 'Islandwide (National)' },
                      { id: 'central', label: 'Central (Bishan, Novena)' },
                      { id: 'east', label: 'East (Tampines, Changi)' },
                      { id: 'west', label: 'West (Jurong, Tuas)' },
                      { id: 'north', label: 'North (Woodlands, Yishun)' },
                      { id: 'south', label: 'South (Marina Bay, Sentosa)' },
                    ] as const
                  ).map((item) => {
                    const isChecked = settings.monitoredRegions.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleRegion(item.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                          isChecked
                            ? 'bg-blue-600/15 border-blue-500/50 text-white font-medium'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                            isChecked
                              ? 'bg-blue-500 border-blue-400 text-white'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isChecked && '✓'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles (Sound, Recovery) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 text-blue-400">
                      {settings.soundEnabled ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Synthesized Audio Chime</div>
                      <div className="text-[11px] text-slate-400">
                        Plays a distinct non-intrusive sound tone when an alert triggers
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                      settings.soundEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Recovery Notifications</div>
                      <div className="text-[11px] text-slate-400">
                        Notify me when PSI drops back below unhealthy threshold
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, notifyOnRecovery: !settings.notifyOnRecovery })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                      settings.notifyOnRecovery ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
                  </button>
                </div>
              </div>

              {/* Instant Test Alert Button */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSendTest}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors border border-slate-700"
                >
                  <Send className="w-4 h-4 text-blue-400" />
                  <span>{testSent ? 'Test Alert Dispatched!' : 'Send Test Push Alert Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-lg shadow-blue-600/30"
                >
                  Save &amp; Close
                </button>
              </div>
            </>
          ) : (
            /* Alert Log History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Recent threshold crossings and alerts</span>
                {logs.length > 0 && (
                  <button
                    onClick={onClearLogs}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No alert records yet. Alerts will appear here when thresholds are breached.
                </div>
              ) : (
                logs.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                      item.severity === 'danger' || item.severity === 'alert'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                        : item.severity === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-slate-900 shrink-0 mt-0.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white">{item.title}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">{item.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
