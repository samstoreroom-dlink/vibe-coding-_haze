/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  AlertNotification,
  HistoricalDataPoint,
  RegionDataSnapshot,
  RegionName,
  UserAlertSettings,
} from './types/psi';
import {
  fetchHistoricalPsi,
  fetchLiveSingaporePsi,
  AIR_QUALITY_BANDS,
  REGION_DETAILS,
} from './services/psiApi';
import {
  DEFAULT_ALERT_SETTINGS,
  NotificationService,
} from './services/notificationService';
import { Header } from './components/Header';
import { UnhealthyAlertBanner } from './components/UnhealthyAlertBanner';
import { RegionSummaryCards } from './components/RegionSummaryCards';
import { InteractiveMap } from './components/InteractiveMap';
import { HealthAdvisory } from './components/HealthAdvisory';
import { HistoricalChart } from './components/HistoricalChart';
import { PollutantGrid } from './components/PollutantGrid';
import { PushNotificationModal } from './components/PushNotificationModal';
import { ServerlessBackendModal } from './components/ServerlessBackendModal';
import {
  ShieldAlert,
  Radio,
  ExternalLink,
  Flame,
  Info,
  Clock,
  Sparkles,
  PhoneCall,
  Wind,
} from 'lucide-react';

export default function App() {
  const [snapshots, setSnapshots] = useState<Record<RegionName, RegionDataSnapshot> | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<RegionName>('national');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [nextRefreshSeconds, setNextRefreshSeconds] = useState<number>(60);
  const [unhealthyCount, setUnhealthyCount] = useState<number>(0);

  // Settings & Notifications
  const [alertSettings, setAlertSettings] = useState<UserAlertSettings>(DEFAULT_ALERT_SETTINGS);
  const [alertLogs, setAlertLogs] = useState<AlertNotification[]>([]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isServerlessModalOpen, setIsServerlessModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Track previous breaches to avoid spamming alerts every refresh
  const alertedRegionsRef = useRef<Set<string>>(new Set());

  // Load initial settings and notification logs from localStorage
  useEffect(() => {
    setAlertSettings(NotificationService.getSettings());
    setAlertLogs(NotificationService.getNotificationLogs());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Check thresholds against live readings
  const evaluateAlerts = useCallback(
    (
      currentSnapshots: Record<RegionName, RegionDataSnapshot>,
      settings: UserAlertSettings
    ) => {
      if (!settings.enabled) return;

      const breached: RegionDataSnapshot[] = [];

      (['national', 'central', 'east', 'west', 'north', 'south'] as const).forEach((r) => {
        const snap = currentSnapshots[r];
        if (!snap) return;

        // Check if user is monitoring this region
        if (!settings.monitoredRegions.includes(r)) return;

        if (snap.psi24h >= settings.thresholdPsi) {
          breached.push(snap);

          // If not already alerted for this region during this session
          if (!alertedRegionsRef.current.has(r)) {
            alertedRegionsRef.current.add(r);

            const title = `⚠️ Air Quality Alert: ${snap.displayName}`;
            const body = `${snap.displayName} 24-Hr PSI has reached ${snap.psi24h} (${snap.band}), exceeding your alert threshold of ${settings.thresholdPsi}.`;

            // Dispatch browser push notification
            NotificationService.sendPushNotification(title, {
              body,
              severity: snap.psi24h >= 200 ? 'danger' : 'alert',
            });

            // Add to persistent logs
            const newLog = NotificationService.addNotificationLog({
              title,
              message: body,
              severity: snap.psi24h >= 200 ? 'danger' : 'alert',
              region: r,
              psiValue: snap.psi24h,
            });
            setAlertLogs(NotificationService.getNotificationLogs());

            // Dispatch to serverless webhook if configured
            if (settings.serverlessWebhookUrl) {
              NotificationService.dispatchServerlessWebhook({
                eventType: 'AIR_QUALITY_ALERT',
                region: r,
                psi: snap.psi24h,
                threshold: settings.thresholdPsi,
                severity: snap.band,
                timestamp: new Date().toISOString(),
                advisory: `${snap.band} haze conditions detected in Singapore ${snap.displayName}.`,
              });
            }
          }
        } else {
          // If recovered below threshold and was previously alerted
          if (alertedRegionsRef.current.has(r)) {
            alertedRegionsRef.current.delete(r);

            if (settings.notifyOnRecovery) {
              const recTitle = `🍃 Air Quality Recovery: ${snap.displayName}`;
              const recBody = `${snap.displayName} PSI improved to ${snap.psi24h} (${snap.band}), below alert threshold.`;

              NotificationService.sendPushNotification(recTitle, {
                body: recBody,
                severity: 'info',
              });

              NotificationService.addNotificationLog({
                title: recTitle,
                message: recBody,
                severity: 'info',
                region: r,
                psiValue: snap.psi24h,
              });
              setAlertLogs(NotificationService.getNotificationLogs());
            }
          }
        }
      });
    },
    []
  );

  // Main data fetch function
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [liveRes, histRes] = await Promise.all([
        fetchLiveSingaporePsi(),
        fetchHistoricalPsi(),
      ]);

      setSnapshots(liveRes.snapshots);
      setLastUpdated(liveRes.updateTimestamp);
      setUnhealthyCount(liveRes.unhealthyCount);
      setHistoricalData(histRes);
      setNextRefreshSeconds(60);

      // Run threshold evaluation
      evaluateAlerts(liveRes.snapshots, alertSettings);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [evaluateAlerts, alertSettings]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh ticker every 1s
  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefreshSeconds((prev) => {
        if (prev <= 1) {
          loadData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadData]);

  // Handle setting updates
  const handleUpdateSettings = (newSettings: UserAlertSettings) => {
    setAlertSettings(newSettings);
    NotificationService.saveSettings(newSettings);
    showToast('Alert preferences updated successfully');
  };

  const handleClearLogs = () => {
    NotificationService.clearAllLogs();
    setAlertLogs([]);
    showToast('Notification logs cleared');
  };

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead();
    setAlertLogs(NotificationService.getNotificationLogs());
  };

  const handleTriggerTestPush = () => {
    const activeSnap = snapshots ? snapshots[selectedRegion] : null;
    const testPsi = activeSnap ? activeSnap.psi24h : 185;

    NotificationService.sendPushNotification('⚠️ SG AirGuard Test Alert', {
      body: `TEST ALERT: Air quality in Singapore ${selectedRegion.toUpperCase()} is currently ${testPsi} PSI (Unhealthy). Wear N95 respirator outdoors.`,
      severity: 'alert',
    });

    NotificationService.addNotificationLog({
      title: '⚠️ Test Air Quality Alert',
      message: `Triggered test alert for ${selectedRegion.toUpperCase()} (${testPsi} PSI). Push notifications and sound verification successful.`,
      severity: 'warning',
      region: selectedRegion,
      psiValue: testPsi,
    });

    setAlertLogs(NotificationService.getNotificationLogs());
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
    });
    showToast('Test push notification dispatched!');
  };

  const unreadCount = alertLogs.filter((l) => !l.isRead).length;

  if (!snapshots) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-white p-4">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 mb-4">
          <Radio className="w-8 h-8 text-red-400 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Connecting to Singapore NEA Sensors...</h2>
        <p className="text-xs text-slate-400 mt-2 font-mono">
          Querying https://api.data.gov.sg/v1/environment/psi
        </p>
      </div>
    );
  }

  const currentSnapshot = snapshots[selectedRegion] || snapshots.national;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation & Status Bar */}
      <Header
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={loadData}
        nextRefreshSeconds={nextRefreshSeconds}
        unreadAlertCount={unreadCount}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenServerless={() => setIsServerlessModalOpen(true)}
        alertSettings={alertSettings}
        onToggleSound={() =>
          handleUpdateSettings({ ...alertSettings, soundEnabled: !alertSettings.soundEnabled })
        }
        unhealthyCount={unhealthyCount}
      />

      {/* Unhealthy / High PSI Alert Banner */}
      <UnhealthyAlertBanner
        snapshots={snapshots}
        thresholdPsi={alertSettings.thresholdPsi}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onSelectRegion={(r) => setSelectedRegion(r)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* District Quick Selectors */}
        <RegionSummaryCards
          snapshots={snapshots}
          selectedRegion={selectedRegion}
          onSelectRegion={(r) => setSelectedRegion(r)}
          thresholdPsi={alertSettings.thresholdPsi}
        />

        {/* Interactive Singapore Air Quality Map */}
        <InteractiveMap
          snapshots={snapshots}
          selectedRegion={selectedRegion}
          onSelectRegion={(r) => setSelectedRegion(r)}
          thresholdPsi={alertSettings.thresholdPsi}
        />

        {/* Health Advisory & MOH Matrix */}
        <HealthAdvisory currentSnapshot={currentSnapshot} />

        {/* Historical 24-Hour Trend Chart */}
        <HistoricalChart
          data={historicalData}
          selectedRegion={selectedRegion}
          thresholdPsi={alertSettings.thresholdPsi}
        />

        {/* Comprehensive 6-Pollutant Breakdown */}
        <PollutantGrid snapshot={currentSnapshot} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/70 text-slate-400 text-xs py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-xs">
              SG
            </div>
            <div>
              <p className="font-semibold text-slate-200">
                SG AirGuard &bull; Singapore Air Quality Monitor
              </p>
              <p className="text-[11px] text-slate-500">
                Powered by open environmental data from National Environment Agency (NEA) and Data.gov.sg
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <a
              href="https://www.nea.gov.sg/our-services/pollution-control/air-pollution/faqs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <span>NEA Haze FAQ</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.moh.gov.sg"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <span>MOH Health Advisory</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setIsServerlessModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Connect Serverless Backend
            </button>
          </div>
        </div>
      </footer>

      {/* Push Notification & Threshold Settings Modal */}
      <PushNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        settings={alertSettings}
        onUpdateSettings={handleUpdateSettings}
        logs={alertLogs}
        onClearLogs={handleClearLogs}
        onMarkAllRead={handleMarkAllRead}
        onTriggerTestPush={handleTriggerTestPush}
      />

      {/* Serverless Integration Modal */}
      <ServerlessBackendModal
        isOpen={isServerlessModalOpen}
        onClose={() => setIsServerlessModalOpen(false)}
        settings={alertSettings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
