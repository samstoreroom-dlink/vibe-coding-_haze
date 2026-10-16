import { AlertNotification, UserAlertSettings } from '../types/psi';

const STORAGE_KEY_SETTINGS = 'sg_psi_alert_settings';
const STORAGE_KEY_LOGS = 'sg_psi_alert_logs';

export const DEFAULT_ALERT_SETTINGS: UserAlertSettings = {
  enabled: true,
  thresholdPsi: 100, // Unhealthy threshold as per NEA standard
  monitoredRegions: ['national', 'north', 'south', 'east', 'west', 'central'],
  soundEnabled: true,
  notifyOnRecovery: true,
  dailyBriefing: false,
  serverlessWebhookUrl: '',
  serverlessSecret: '',
};

export class NotificationService {
  private static audioCtx: AudioContext | null = null;

  static getSettings(): UserAlertSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        return { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse stored alert settings:', e);
    }
    return DEFAULT_ALERT_SETTINGS;
  }

  static saveSettings(settings: UserAlertSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save alert settings:', e);
    }
  }

  static getNotificationLogs(): AlertNotification[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse notification logs:', e);
    }
    return [];
  }

  static saveNotificationLogs(logs: AlertNotification[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to save notification logs:', e);
    }
  }

  static addNotificationLog(log: Omit<AlertNotification, 'id' | 'timestamp' | 'isRead'>): AlertNotification {
    const newLog: AlertNotification = {
      ...log,
      id: 'alert-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    const currentLogs = this.getNotificationLogs();
    const updated = [newLog, ...currentLogs];
    this.saveNotificationLogs(updated);
    return newLog;
  }

  static markAllAsRead(): void {
    const current = this.getNotificationLogs();
    const updated = current.map(item => ({ ...item, isRead: true }));
    this.saveNotificationLogs(updated);
  }

  static clearAllLogs(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_LOGS);
    } catch (e) {
      console.warn('Failed to clear logs:', e);
    }
  }

  static isPushSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  static getPermissionStatus(): NotificationPermission {
    if (!this.isPushSupported()) return 'denied';
    return Notification.permission;
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isPushSupported()) return 'denied';
    try {
      return await Notification.requestPermission();
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  static playAlertSound(severity: 'info' | 'warning' | 'alert' | 'danger' = 'alert'): void {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (severity === 'danger' || severity === 'alert') {
        // Two-tone urgent chime (880Hz -> 659Hz -> 880Hz)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(659, now + 0.12);
        osc.frequency.setValueAtTime(880, now + 0.24);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);
      } else {
        // Gentle informational chime (523Hz -> 659Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (err) {
      console.warn('Audio synthesis not permitted or failed:', err);
    }
  }

  static async sendPushNotification(title: string, options: {
    body: string;
    icon?: string;
    tag?: string;
    severity?: 'info' | 'warning' | 'alert' | 'danger';
    requireInteraction?: boolean;
  }): Promise<boolean> {
    const settings = this.getSettings();

    // Play sound if enabled
    if (settings.soundEnabled) {
      this.playAlertSound(options.severity || 'alert');
    }

    if (this.isPushSupported() && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          tag: options.tag || 'sg-airguard-alert',
          badge: options.icon || '/favicon.ico',
          requireInteraction: options.requireInteraction ?? (options.severity === 'danger' || options.severity === 'alert'),
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        return true;
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }

    return false;
  }

  static async dispatchServerlessWebhook(payload: {
    eventType: 'AIR_QUALITY_ALERT' | 'TEST_ALERT' | 'STATUS_RECOVERY';
    region: string;
    psi: number;
    threshold: number;
    severity: string;
    timestamp: string;
    advisory: string;
  }): Promise<{ success: boolean; message: string }> {
    const settings = this.getSettings();
    if (!settings.serverlessWebhookUrl) {
      return { success: false, message: 'No serverless webhook URL configured.' };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (settings.serverlessSecret) {
        headers['Authorization'] = `Bearer ${settings.serverlessSecret}`;
        headers['X-SG-AirGuard-Secret'] = settings.serverlessSecret;
      }

      const res = await fetch(settings.serverlessWebhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source: 'sg-airguard-app',
          ...payload,
        }),
      });

      if (res.ok) {
        return { success: true, message: `Dispatched to serverless backend (${res.status} OK)` };
      } else {
        return { success: false, message: `Serverless backend responded with ${res.status}: ${res.statusText}` };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Webhook dispatch failed: ${msg}` };
    }
  }
}
