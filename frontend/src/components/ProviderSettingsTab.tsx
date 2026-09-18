import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Sliders, ShieldCheck, Mail, MessageSquare, Key, Save } from 'lucide-react';

interface ProviderSettingsTabProps {
  projectId: string;
}

export const ProviderSettingsTab: React.FC<ProviderSettingsTabProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioPhone, setTwilioPhone] = useState('');

  const [webhookSecret, setWebhookSecret] = useState('');

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/projects/${projectId}/provider`);
      if (data.providerConfig) {
        const c = data.providerConfig;
        setSmtpHost(c.smtpHost || '');
        setSmtpPort(c.smtpPort ? c.smtpPort.toString() : '587');
        setSmtpUser(c.smtpUser || '');
        setSmtpPass(c.smtpPass || '');
        setTwilioSid(c.twilioSid || '');
        setTwilioToken(c.twilioToken || '');
        setTwilioPhone(c.twilioPhone || '');
        setWebhookSecret(c.webhookSecret || '');
      }
    } catch (error) {
      console.error('Failed to fetch provider config', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchConfig();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/provider`, {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        twilioSid,
        twilioToken,
        twilioPhone,
        webhookSecret,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update provider config', error);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-xl font-bold tracking-tight flex items-center space-x-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <Sliders size={22} />
          <span>Provider Credentials</span>
        </h3>
        <p className="text-sm opacity-70">Configure custom SendGrid/SMTP credentials, Twilio API keys, and Webhook HMAC secrets per workspace.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 opacity-50">Loading credentials...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SMTP Config */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 font-bold text-sm text-slate-800 border-b pb-3">
              <Mail size={18} className="text-indigo-600" />
              <span>Email Provider (SMTP / SendGrid / Mailgun)</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">SMTP Host</label>
                <input
                  type="text"
                  placeholder="smtp.sendgrid.net"
                  value={smtpHost}
                  onChange={e => setSmtpHost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">SMTP Port</label>
                <input
                  type="text"
                  placeholder="587"
                  value={smtpPort}
                  onChange={e => setSmtpPort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">SMTP Username</label>
                <input
                  type="text"
                  placeholder="apikey"
                  value={smtpUser}
                  onChange={e => setSmtpUser(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">SMTP Password / API Key</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={smtpPass}
                  onChange={e => setSmtpPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Twilio SMS Config */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 font-bold text-sm text-slate-800 border-b pb-3">
              <MessageSquare size={18} className="text-blue-600" />
              <span>SMS Provider (Twilio)</span>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Account SID</label>
                <input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxx"
                  value={twilioSid}
                  onChange={e => setTwilioSid(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Auth Token</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={twilioToken}
                  onChange={e => setTwilioToken(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">From Phone Number</label>
                <input
                  type="text"
                  placeholder="+1234567890"
                  value={twilioPhone}
                  onChange={e => setTwilioPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Webhook HMAC Security */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 font-bold text-sm text-slate-800 border-b pb-3">
              <Key size={18} className="text-emerald-600" />
              <span>Webhook Signing Secret (HMAC-SHA256)</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Project Webhook Signing Secret</label>
              <input
                type="text"
                readOnly
                value={webhookSecret || 'Auto-generated secret...'}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">Included in the <code className="font-mono bg-slate-100 px-1">X-EventMesh-Signature</code> header on all outgoing HTTP Webhook POST dispatches.</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className="inline-flex items-center space-x-2 text-white font-medium px-5 py-2.5 rounded-lg shadow transition-transform active:scale-95 text-sm"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <Save size={16} />
              <span>Save Credentials</span>
            </button>

            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1 animate-in fade-in">
                <ShieldCheck size={16} />
                <span>Credentials saved successfully!</span>
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
