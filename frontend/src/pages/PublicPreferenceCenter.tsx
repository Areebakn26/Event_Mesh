import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Zap, Mail, Phone, Globe, ShieldCheck, ShieldAlert, Check, RefreshCw, AlertCircle
} from 'lucide-react';

export const PublicPreferenceCenter: React.FC = () => {
  const { subscriberId } = useParams<{ subscriberId: string }>();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subscriber, setSubscriber] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [subscriberId, projectId]);

  const fetchPreferences = async () => {
    if (!subscriberId) {
      setError('Invalid URL: Missing subscriber ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Subscriber info & Preferences Matrix
      const baseURL = 'http://localhost:4000';
      const [subRes, prefRes] = await Promise.all([
        axios.get(`${baseURL}/v1/subscribers/${subscriberId}`, {
          headers: { 'x-project-id': projectId },
        }).catch(() => null),
        axios.get(`${baseURL}/v1/subscribers/${subscriberId}/preferences`, {
          headers: { 'x-project-id': projectId },
        }),
      ]);

      if (subRes?.data?.subscriber) {
        setSubscriber(subRes.data.subscriber);
      }
      setTopics(prefRes.data.topics || []);
      setPreferences(prefRes.data.preferences || []);
    } catch (err: any) {
      console.error('Failed to load preference center', err);
      setError(err.response?.data?.error || 'Unable to load your notification preferences.');
    } finally {
      setLoading(false);
    }
  };

  const getChannelStatus = (channel: string, topicKey?: string): boolean => {
    const pref = preferences.find((p) => {
      if (topicKey) {
        return p.channel === channel && p.topic?.key === topicKey;
      }
      return p.channel === channel && (!p.topicId || p.topicId === '');
    });
    return pref ? pref.enabled : true;
  };

  const handleToggle = (channel: string, topicKey?: string) => {
    const currentStatus = getChannelStatus(channel, topicKey);
    const newStatus = !currentStatus;

    setPreferences((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((p) => {
        if (topicKey) {
          return p.channel === channel && p.topic?.key === topicKey;
        }
        return p.channel === channel && (!p.topicId || p.topicId === '');
      });

      if (index !== -1) {
        updated[index] = { ...updated[index], enabled: newStatus };
      } else {
        updated.push({
          channel,
          topicId: topicKey ? 'temp' : null,
          topic: topicKey ? { key: topicKey } : null,
          enabled: newStatus,
        });
      }
      return updated;
    });
  };

  const handleSaveAll = async () => {
    if (!subscriberId) return;
    setSaving(true);
    try {
      // Build preference payload for all channel & topic combinations
      const prefPayload: any[] = [
        { channel: 'email', enabled: getChannelStatus('email') },
        { channel: 'sms', enabled: getChannelStatus('sms') },
        { channel: 'webhook', enabled: getChannelStatus('webhook') },
      ];

      topics.forEach((t) => {
        ['email', 'sms', 'webhook'].forEach((ch) => {
          prefPayload.push({
            channel: ch,
            topicKey: t.key,
            enabled: getChannelStatus(ch, t.key),
          });
        });
      });

      const baseURL = 'http://localhost:4000';
      await axios.patch(
        `${baseURL}/v1/subscribers/${subscriberId}/preferences`,
        { preferences: prefPayload },
        { headers: { 'x-project-id': projectId } }
      );

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences', err);
      alert('Failed to save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans selection:bg-violet-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Notification Preference Center</h1>
              <p className="text-[11px] text-slate-400">Powered by EventMesh Infrastructure</p>
            </div>
          </div>

          <span className="text-xs px-2.5 py-1 bg-slate-800 rounded-full text-slate-300 border border-slate-700 font-mono">
            ID: {subscriberId}
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-3xl w-full mx-auto p-6 flex-1 my-8 space-y-6">
        
        {loading ? (
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-2xl">
            <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-400">Loading your notification preferences...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-8 text-center space-y-3">
            <AlertCircle size={36} className="mx-auto text-rose-400" />
            <h2 className="text-lg font-bold text-rose-200">Unable to Load Preferences</h2>
            <p className="text-xs text-rose-300 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchPreferences}
              className="mt-2 inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded-lg transition-colors border border-rose-700"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        ) : (
          <>
            {/* Subscriber Profile Greeting Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 font-bold text-lg flex items-center justify-center shadow-inner">
                  {subscriber?.firstName ? subscriber.firstName[0].toUpperCase() : subscriberId ? subscriberId[0].toUpperCase() : 'S'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Hello, {subscriber?.firstName || subscriber?.lastName ? `${subscriber?.firstName || ''} ${subscriber?.lastName || ''}`.trim() : subscriberId}!
                  </h2>
                  <p className="text-xs text-slate-400">
                    {subscriber?.email ? subscriber.email : 'Manage how and when you receive updates from our system.'}
                  </p>
                </div>
              </div>

              {savedSuccess && (
                <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                  <Check size={14} />
                  <span>Preferences Saved!</span>
                </div>
              )}
            </div>

            {/* Global Communication Channels */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Communication Channels</h3>
                <p className="text-xs text-slate-400">Turn channels on or off globally across all notifications.</p>
              </div>

              <div className="space-y-3 pt-2">
                {/* Email Channel */}
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Email Notifications</h4>
                      <p className="text-xs text-slate-400">Product updates, summaries, and activity digest emails.</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getChannelStatus('email')}
                      onChange={() => handleToggle('email')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {/* SMS Channel */}
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Phone size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">SMS & Text Messages</h4>
                      <p className="text-xs text-slate-400">Instant security alerts, OTPs, and urgent account SMS.</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getChannelStatus('sms')}
                      onChange={() => handleToggle('sms')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {/* Webhook Channel */}
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">In-App & Webhooks</h4>
                      <p className="text-xs text-slate-400">In-app notifications bell and custom webhook dispatches.</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getChannelStatus('webhook')}
                      onChange={() => handleToggle('webhook')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notification Topics Section */}
            {topics.length > 0 && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Specific Topics</h3>
                  <p className="text-xs text-slate-400">Fine-tune individual topics according to your interests.</p>
                </div>

                <div className="space-y-3">
                  {topics.map((t) => (
                    <div key={t.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{t.name}</h4>
                          {t.description && <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                        {['email', 'sms', 'webhook'].map((ch) => {
                          const active = getChannelStatus(ch, t.key);
                          return (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => handleToggle(ch, t.key)}
                              className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-between transition-all ${
                                active
                                  ? 'bg-violet-600/15 border-violet-500/40 text-violet-300'
                                  : 'bg-slate-800/50 border-slate-700/60 text-slate-500'
                              }`}
                            >
                              <span className="uppercase text-[10px] font-bold">{ch}</span>
                              {active ? (
                                <ShieldCheck size={14} className="text-violet-400" />
                              ) : (
                                <ShieldAlert size={14} className="text-slate-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button Bar */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving Preferences...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Save Preference Settings</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} EventMesh Infrastructure. Your privacy & preferences are always respected.</p>
      </footer>
    </div>
  );
};

export default PublicPreferenceCenter;
