import React, { useState } from 'react';
import {
  Server,
  Code,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  X,
  FileJson,
  Terminal,
  AlertCircle,
} from 'lucide-react';
import { UserAlertSettings } from '../types/psi';
import { NotificationService } from '../services/notificationService';

interface ServerlessBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserAlertSettings;
  onUpdateSettings: (newSettings: UserAlertSettings) => void;
}

export const ServerlessBackendModal: React.FC<ServerlessBackendModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(settings.serverlessWebhookUrl || '');
  const [secret, setSecret] = useState(settings.serverlessSecret || '');
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'nodejs' | 'python' | 'payload'>('nodejs');

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings({
      ...settings,
      serverlessWebhookUrl: webhookUrl.trim(),
      serverlessSecret: secret.trim(),
    });
  };

  const handleTestDispatch = async () => {
    handleSave();
    setTestResult({ status: 'loading', message: 'Dispatching test payload to serverless endpoint...' });

    if (!webhookUrl.trim()) {
      setTestResult({
        status: 'error',
        message: 'Please enter a webhook endpoint URL first.',
      });
      return;
    }

    const res = await NotificationService.dispatchServerlessWebhook({
      eventType: 'TEST_ALERT',
      region: 'central',
      psi: 225,
      threshold: settings.thresholdPsi,
      severity: 'Very Unhealthy',
      timestamp: new Date().toISOString(),
      advisory: 'TEST: SG AirGuard serverless connection test. Central region PSI is 225.',
    });

    if (res.success) {
      setTestResult({ status: 'success', message: res.message });
    } else {
      setTestResult({ status: 'error', message: res.message });
    }
  };

  const samplePayload = {
    source: 'sg-airguard-app',
    eventType: 'AIR_QUALITY_ALERT',
    timestamp: '2026-10-16T11:00:00+08:00',
    region: 'central',
    psi: 225,
    threshold: 100,
    severity: 'Very Unhealthy',
    pm25_1h: 168,
    advisory: 'Avoid prolonged outdoor exertion. Wear N95 respirator.',
    affectedSectors: ['central', 'east', 'west'],
  };

  const nodeSnippet = `// AWS Lambda / Cloud Function / Vercel Serverless Function
export async function handler(event) {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  const authHeader = event.headers?.authorization || event.headers?.Authorization;

  console.log('Received Air Quality Alert:', body);

  if (body.psi >= body.threshold) {
    // 1. Dispatch Firebase Cloud Messaging (FCM) or Apple APNs push
    // 2. Dispatch Telegram bot message / WhatsApp / Twilio SMS
    // 3. Store event in database
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ received: true, psi: body.psi }),
  };
}`;

  const pythonSnippet = `# AWS Lambda / Google Cloud Run Python handler
import json

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
    
    psi = body.get('psi')
    region = body.get('region')
    print(f"Air Quality Alert: {region} at {psi} PSI")

    # Send push notification via FCM / Webhook / SMS
    return {
        'statusCode': 200,
        'body': json.dumps({'status': 'ok', 'processed_region': region})
    }`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Serverless Backend Integration
              </h2>
              <p className="text-xs text-slate-400">
                Connect your future AWS Lambda, Cloudflare Worker, or Cloud Function endpoint
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

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Note explaining front end architecture */}
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-xs text-blue-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
            <div>
              <strong className="text-white">Front-End Ready: </strong>
              The client monitors real-time NEA data and triggers browser push notifications locally. When you are ready to deploy your serverless backend, configure your endpoint below to receive automatic webhook alerts.
            </div>
          </div>

          {/* Webhook Configuration form */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div>
              <label className="text-xs font-bold text-white block mb-1.5">
                Serverless Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://api.example.com/alerts/psi-webhook"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1.5">
                Bearer Secret / API Key (Optional)
              </label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Bearer token or authorization header"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestDispatch}
                disabled={testResult.status === 'loading'}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Test Webhook Dispatch</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Save Settings
              </button>
            </div>

            {testResult.status !== 'idle' && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  testResult.status === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : testResult.status === 'error'
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    : 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Code Snippets & Schema */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-white">Serverless Starter Code &amp; Payload</span>
              </div>

              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                <button
                  onClick={() => setActiveSnippetTab('nodejs')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    activeSnippetTab === 'nodejs'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Node.js
                </button>
                <button
                  onClick={() => setActiveSnippetTab('python')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    activeSnippetTab === 'python'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setActiveSnippetTab('payload')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    activeSnippetTab === 'payload'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JSON Payload
                </button>
              </div>
            </div>

            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto">
              <button
                onClick={() =>
                  copyToClipboard(
                    activeSnippetTab === 'nodejs'
                      ? nodeSnippet
                      : activeSnippetTab === 'python'
                      ? pythonSnippet
                      : JSON.stringify(samplePayload, null, 2)
                  )
                }
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Copy snippet"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <pre>
                {activeSnippetTab === 'nodejs'
                  ? nodeSnippet
                  : activeSnippetTab === 'python'
                  ? pythonSnippet
                  : JSON.stringify(samplePayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
