import React, { useState } from 'react';
import api from '../services/api';
import { Send, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface SandboxModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SandboxModal: React.FC<SandboxModalProps> = ({ projectId: _projectId, isOpen, onClose, onSuccess }) => {
  const [templateId, setTemplateId] = useState('');
  const [email, setEmail] = useState('test@example.com');
  const [phone, setPhone] = useState('+1234567890');
  const [webhookUrl, setWebhookUrl] = useState('https://webhook.site/sample');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['email', 'sms']);
  const [jsonPayload, setJsonPayload] = useState('{\n  "name": "Faizan",\n  "orderId": "#1049"\n}');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);



  if (!isOpen) return null;

  const toggleChannel = (ch: string) => {
    setSelectedChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let parsedData = {};
      try {
        parsedData = JSON.parse(jsonPayload);
      } catch {
        setError('Invalid JSON payload formatting');
        setLoading(false);
        return;
      }

      // Fetch temporary Bearer Key or create temporary dispatch via backend API
      const { data } = await api.post(`/v1/notify`, {
        templateId: templateId || undefined,
        channels: selectedChannels,
        recipient: {
          email: selectedChannels.includes('email') ? email : undefined,
          phone: selectedChannels.includes('sms') ? phone : undefined,
          webhookUrl: selectedChannels.includes('webhook') ? webhookUrl : undefined,
        },
        data: parsedData,
      }, {
        headers: {
          'x-project-id': _projectId,
        },
      });

      setResult(data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Dispatch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center space-x-2">
              <Send size={18} className="text-indigo-600" />
              <span>Interactive Test Sandbox</span>
            </h3>
            <p className="text-xs text-slate-500">Trigger a live notification dispatch directly to the queue.</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4 text-xs font-sans">
          {/* Target Channels */}
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-600 block mb-2">Target Channels</label>
            <div className="flex space-x-3">
              {['email', 'sms', 'webhook'].map(ch => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className={`px-3 py-1.5 rounded-lg border font-bold uppercase tracking-wider text-[11px] transition-colors ${
                    selectedChannels.includes(ch)
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Data */}
          <div className="grid grid-cols-2 gap-3">
            {selectedChannels.includes('email') && (
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Email Recipient</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                />
              </div>
            )}
            {selectedChannels.includes('sms') && (
              <div>
                <label className="font-semibold text-slate-600 block mb-1">SMS Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                />
              </div>
            )}
            {selectedChannels.includes('webhook') && (
              <div className="col-span-2">
                <label className="font-semibold text-slate-600 block mb-1">Webhook Target URL</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                />
              </div>
            )}
          </div>

          {/* Template ID Optional */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Template Name / ID (Optional)</label>
            <input
              type="text"
              placeholder="welcome"
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono"
            />
          </div>

          {/* Data Payload JSON */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Context Data Payload (JSON)</label>
            <textarea
              rows={3}
              value={jsonPayload}
              onChange={e => setJsonPayload(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-xs"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center space-x-2 font-medium">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 space-y-1 font-mono text-[11px]">
              <div className="flex items-center space-x-1 font-bold">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>{result.message}</span>
              </div>
              <p>Job ID: {result.jobId} | Log ID: {result.logId}</p>
            </div>
          )}

          <div className="pt-3 border-t flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Close</button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-white font-semibold rounded-lg shadow transition-transform active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              {loading ? 'Queueing...' : 'Dispatch Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
