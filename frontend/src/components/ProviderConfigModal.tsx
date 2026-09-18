import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Save, AlertCircle } from 'lucide-react';

interface ProviderConfigModalProps {
  isOpen: boolean;
  projectId: string;
  providerToEdit?: any | null;
  onClose: () => void;
  onSave: () => void;
}

export const ProviderConfigModal: React.FC<ProviderConfigModalProps> = ({
  isOpen,
  projectId,
  providerToEdit,
  onClose,
  onSave,
}) => {
  const [channel, setChannel] = useState<'email' | 'sms' | 'webhook' | 'in_app'>('email');
  const [providerIdentifier, setProviderIdentifier] = useState('sendgrid');
  const [rateLimitPerSecond, setRateLimitPerSecond] = useState(10);
  const [priority, setPriority] = useState(1);
  const [active, setActive] = useState(true);
  const [credentialsJson, setCredentialsJson] = useState('{\n  "apiKey": "SG.your_api_key_here"\n}');

  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (providerToEdit) {
      setChannel(providerToEdit.channel || 'email');
      setProviderIdentifier(providerToEdit.providerIdentifier || 'sendgrid');
      setRateLimitPerSecond(providerToEdit.rateLimitPerSecond || 10);
      setPriority(providerToEdit.priority || 1);
      setActive(providerToEdit.active ?? true);

      const creds =
        typeof providerToEdit.credentials === 'string'
          ? providerToEdit.credentials
          : JSON.stringify(providerToEdit.credentials || {}, null, 2);
      setCredentialsJson(creds);
    } else {
      // Default reset
      setChannel('email');
      setProviderIdentifier('sendgrid');
      setRateLimitPerSecond(10);
      setPriority(1);
      setActive(true);
      setCredentialsJson('{\n  "apiKey": "SG.your_api_key_here"\n}');
    }
  }, [providerToEdit, isOpen]);

  // Sample Preset Templates for convenient configuration
  const handlePresetSelect = (preset: string) => {
    setProviderIdentifier(preset);
    setJsonError(null);

    switch (preset) {
      case 'sendgrid':
        setChannel('email');
        setCredentialsJson('{\n  "apiKey": "SG.your_sendgrid_api_key"\n}');
        break;
      case 'ses':
        setChannel('email');
        setCredentialsJson('{\n  "accessKeyId": "AKIA...",\n  "secretAccessKey": "your_secret_key",\n  "region": "us-east-1"\n}');
        break;
      case 'smtp':
        setChannel('email');
        setCredentialsJson('{\n  "smtpHost": "smtp.mailtrap.io",\n  "smtpPort": 587,\n  "smtpUser": "user",\n  "smtpPass": "pass"\n}');
        break;
      case 'twilio':
        setChannel('sms');
        setCredentialsJson('{\n  "accountSid": "AC...",\n  "authToken": "your_auth_token",\n  "fromPhone": "+14155552671"\n}');
        break;
      case 'sns':
        setChannel('sms');
        setCredentialsJson('{\n  "accessKeyId": "AKIA...",\n  "secretAccessKey": "your_secret_key",\n  "region": "us-east-1"\n}');
        break;
      case 'custom_webhook':
        setChannel('webhook');
        setCredentialsJson('{\n  "webhookUrl": "https://api.example.com/webhooks",\n  "secret": "whsec_your_secret"\n}');
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError(null);

    let parsedCreds = {};
    try {
      parsedCreds = JSON.parse(credentialsJson);
    } catch {
      setJsonError('Invalid JSON format. Please ensure valid JSON syntax for provider credentials.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        channel,
        providerIdentifier,
        credentials: parsedCreds,
        rateLimitPerSecond: Number(rateLimitPerSecond),
        priority: Number(priority),
        active,
      };

      if (providerToEdit?.id) {
        await api.put(`/v1/providers/${providerToEdit.id}`, payload, {
          headers: { 'x-project-id': projectId },
        });
      } else {
        await api.post('/v1/providers', payload, {
          headers: { 'x-project-id': projectId },
        });
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Failed to save provider config', error);
      alert(error.response?.data?.error || 'Failed to save channel provider configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {providerToEdit ? 'Configure Channel Provider' : 'Add Channel Provider Integration'}
            </h3>
            <p className="text-xs text-slate-500">
              Configure delivery provider credentials, rate limits, and priority ranking for failover.
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Quick Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {['sendgrid', 'ses', 'smtp', 'twilio', 'sns', 'custom_webhook'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePresetSelect(p)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  providerIdentifier === p
                    ? 'bg-violet-100 border-violet-300 text-violet-700 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Channel *</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-violet-500"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="webhook">Webhook</option>
                <option value="in_app">In-App</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Provider Identifier *</label>
              <input
                type="text"
                required
                placeholder="sendgrid, twilio, ses, etc."
                value={providerIdentifier}
                onChange={(e) => setProviderIdentifier(e.target.value.toLowerCase().trim())}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-violet-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rate Limit (req/sec)</label>
              <input
                type="number"
                min="1"
                required
                value={rateLimitPerSecond}
                onChange={(e) => setRateLimitPerSecond(parseInt(e.target.value) || 10)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-violet-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Sliding 1s Redis window per provider</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Ranking</label>
              <input
                type="number"
                min="1"
                required
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-violet-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">1 = Primary, 2+ = Fallback providers</p>
            </div>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs font-bold text-slate-800">Enable Provider</span>
              <p className="text-[11px] text-slate-500">Active providers are included in automatic failover sequences.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>

          {/* Credentials JSON Payload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Provider Credentials Payload (JSON Format) *
            </label>
            <textarea
              rows={5}
              value={credentialsJson}
              onChange={(e) => setCredentialsJson(e.target.value)}
              required
              className="w-full bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs focus:outline-none"
            />
            {jsonError && (
              <p className="text-xs font-semibold text-rose-600 mt-1 flex items-center space-x-1">
                <AlertCircle size={14} />
                <span>{jsonError}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
