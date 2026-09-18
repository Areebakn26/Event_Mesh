import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  X, Mail, Phone, User, Globe, Clock, ShieldCheck, ShieldAlert,
  Save, Trash2, ExternalLink, Copy, Check, Plus, Tag
} from 'lucide-react';

interface SubscriberDrawerProps {
  subscriberId: string | null;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export const SubscriberDrawer: React.FC<SubscriberDrawerProps> = ({
  subscriberId,
  projectId,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [subscriber, setSubscriber] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any[]>([]);

  // Form State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [locale, setLocale] = useState('en');
  const [timeZone, setTimeZone] = useState('UTC');
  
  // UI State
  const [activeTab, setActiveTab] = useState<'details' | 'preferences'>('details');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [newTopicKey, setNewTopicKey] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [showAddTopic, setShowAddTopic] = useState(false);

  useEffect(() => {
    if (isOpen && subscriberId) {
      fetchSubscriberData();
    }
  }, [isOpen, subscriberId, projectId]);

  const fetchSubscriberData = async () => {
    if (!subscriberId) return;
    setLoading(true);
    try {
      // 1. Fetch Subscriber Details
      const { data: subData } = await api.get(`/v1/subscribers/${subscriberId}`, {
        headers: { 'x-project-id': projectId },
      });
      const sub = subData.subscriber;
      setSubscriber(sub);
      setEmail(sub.email || '');
      setPhone(sub.phone || '');
      setFirstName(sub.firstName || '');
      setLastName(sub.lastName || '');
      setLocale(sub.locale || 'en');
      setTimeZone(sub.timeZone || 'UTC');

      // 2. Fetch Preferences Matrix & Topics
      const { data: prefData } = await api.get(`/v1/subscribers/${subscriberId}/preferences`, {
        headers: { 'x-project-id': projectId },
      });
      setTopics(prefData.topics || []);
      setPreferences(prefData.preferences || []);
    } catch (error) {
      console.error('Failed to fetch subscriber details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberId) return;
    setIsSaving(true);
    try {
      await api.post(
        '/v1/subscribers',
        {
          subscriberId,
          email,
          phone,
          firstName,
          lastName,
          locale,
          timeZone,
        },
        { headers: { 'x-project-id': projectId } }
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update subscriber profile', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePreference = async (channel: string, topicKey?: string, currentEnabled?: boolean) => {
    if (!subscriberId) return;
    const newEnabled = !currentEnabled;

    // Optimistic UI update
    setPreferences((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((p) => {
        if (topicKey) {
          return p.channel === channel && p.topic?.key === topicKey;
        }
        return p.channel === channel && (!p.topicId || p.topicId === '');
      });

      if (index !== -1) {
        updated[index] = { ...updated[index], enabled: newEnabled };
      } else {
        updated.push({
          channel,
          topicId: topicKey ? 'temp' : null,
          topic: topicKey ? { key: topicKey } : null,
          enabled: newEnabled,
        });
      }
      return updated;
    });

    try {
      await api.patch(
        `/v1/subscribers/${subscriberId}/preferences`,
        {
          preferences: [{ channel, topicKey, enabled: newEnabled }],
        },
        { headers: { 'x-project-id': projectId } }
      );
      fetchSubscriberData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update preference', error);
      fetchSubscriberData();
    }
  };

  const handleDeleteSubscriber = async () => {
    if (!subscriberId) return;
    if (!window.confirm(`Are you sure you want to delete subscriber ${subscriberId}?`)) return;

    try {
      await api.delete(`/v1/subscribers/${subscriberId}`, {
        headers: { 'x-project-id': projectId },
      });
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to delete subscriber', error);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicKey.trim() || !newTopicName.trim()) return;

    try {
      await api.post(
        '/v1/topics',
        { key: newTopicKey, name: newTopicName },
        { headers: { 'x-project-id': projectId } }
      );
      setNewTopicKey('');
      setNewTopicName('');
      setShowAddTopic(false);
      fetchSubscriberData();
    } catch (error) {
      console.error('Failed to create topic', error);
    }
  };

  const getChannelStatus = (channel: string, topicKey?: string): boolean => {
    const pref = preferences.find((p) => {
      if (topicKey) {
        return p.channel === channel && p.topic?.key === topicKey;
      }
      return p.channel === channel && (!p.topicId || p.topicId === '');
    });
    // Default is true (enabled) if no preference record exists
    return pref ? pref.enabled : true;
  };

  const publicPrefUrl = `${window.location.origin}/preferences/${subscriberId}?projectId=${projectId}`;

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicPrefUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="bg-white h-full w-full max-w-xl shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-base shadow-inner">
              {subscriber?.firstName ? subscriber.firstName[0].toUpperCase() : (subscriberId ? subscriberId[0].toUpperCase() : 'S')}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  {subscriber?.firstName || subscriber?.lastName
                    ? `${subscriber?.firstName || ''} ${subscriber?.lastName || ''}`
                    : subscriberId}
                </h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-medium">
                  {subscriberId}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-xs">{subscriber?.email || 'No email associated'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'details'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User size={14} />
            <span>Profile & Info</span>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'preferences'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Channel & Topic Preferences</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Fetching subscriber details...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: PROFILE & INFO */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Public Preference Link Banner */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                        <ExternalLink size={14} className="text-violet-600" />
                        <span>Public Preference Center Link</span>
                      </span>
                      <button
                        onClick={copyPublicLink}
                        className="text-xs font-medium text-violet-600 hover:text-violet-700 flex items-center space-x-1"
                      >
                        {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedLink ? 'Copied' : 'Copy URL'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Send this standalone URL to end-users so they can self-manage their opt-outs:
                    </p>
                    <code className="block bg-white p-2 rounded border border-slate-200 text-[11px] font-mono text-slate-700 truncate">
                      {publicPrefUrl}
                    </code>
                  </div>

                  {/* Profile Edit Form */}
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="e.g. Alex"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="e.g. Morgan"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alex@example.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (E.164 format)</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+14155552671"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Locale</label>
                        <div className="relative">
                          <Globe size={14} className="absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            value={locale}
                            onChange={(e) => setLocale(e.target.value)}
                            placeholder="en"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Time Zone</label>
                        <div className="relative">
                          <Clock size={14} className="absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            value={timeZone}
                            onChange={(e) => setTimeZone(e.target.value)}
                            placeholder="America/New_York"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-between">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center space-x-2 text-white bg-violet-600 hover:bg-violet-700 font-medium text-xs px-4 py-2 rounded-lg transition-colors shadow-sm"
                      >
                        <Save size={14} />
                        <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                      </button>

                      {saveSuccess && (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                          <Check size={14} />
                          <span>Profile Updated!</span>
                        </span>
                      )}
                    </div>
                  </form>

                  {/* Danger Zone */}
                  <div className="pt-6 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">Danger Zone</h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Deleting this subscriber removes their profile and custom topic preferences permanently.
                    </p>
                    <button
                      type="button"
                      onClick={handleDeleteSubscriber}
                      className="inline-flex items-center space-x-2 text-rose-600 hover:text-white border border-rose-200 hover:bg-rose-600 font-medium text-xs px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Delete Subscriber</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: CHANNEL & TOPIC PREFERENCES */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  {/* Global Channel Preferences */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Global Channel Defaults</h4>
                      <p className="text-[11px] text-slate-500">
                        Controls whether notifications can be sent across each channel globally for this subscriber.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      {/* Email Global */}
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-md bg-blue-50 text-blue-600">
                            <Mail size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900">Email Channel</p>
                            <p className="text-[11px] text-slate-500">Deliver email notifications</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getChannelStatus('email')}
                            onChange={() => handleTogglePreference('email', undefined, getChannelStatus('email'))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                        </label>
                      </div>

                      {/* SMS Global */}
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-md bg-emerald-50 text-emerald-600">
                            <Phone size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900">SMS Channel</p>
                            <p className="text-[11px] text-slate-500">Deliver SMS alerts & verification codes</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getChannelStatus('sms')}
                            onChange={() => handleTogglePreference('sms', undefined, getChannelStatus('sms'))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                        </label>
                      </div>

                      {/* Webhook / In-App Global */}
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-md bg-purple-50 text-purple-600">
                            <Globe size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900">Webhook / In-App Channel</p>
                            <p className="text-[11px] text-slate-500">Deliver webhooks & live bell notifications</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getChannelStatus('webhook')}
                            onChange={() => handleTogglePreference('webhook', undefined, getChannelStatus('webhook'))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Topic-Based Preferences */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Topic Specific Rules</h4>
                        <p className="text-[11px] text-slate-500">Enable or disable specific topics for this subscriber.</p>
                      </div>
                      <button
                        onClick={() => setShowAddTopic(!showAddTopic)}
                        className="text-xs font-medium text-violet-600 hover:text-violet-700 flex items-center space-x-1"
                      >
                        <Plus size={14} />
                        <span>Add Topic</span>
                      </button>
                    </div>

                    {/* Inline Create Topic Form */}
                    {showAddTopic && (
                      <form onSubmit={handleCreateTopic} className="p-3 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
                        <p className="text-xs font-bold text-violet-900">Create New Notification Topic</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Topic Key (e.g. security_alerts)"
                            value={newTopicKey}
                            onChange={(e) => setNewTopicKey(e.target.value)}
                            required
                            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Topic Name (e.g. Security Alerts)"
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            required
                            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddTopic(false)}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-violet-600 text-white rounded text-xs font-medium"
                          >
                            Save Topic
                          </button>
                        </div>
                      </form>
                    )}

                    {topics.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl">
                        <Tag size={20} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-medium text-slate-600">No Notification Topics Created Yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Create topics like "marketing_news", "billing_receipts", or "security_alerts".
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {topics.map((t) => (
                          <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-xs text-slate-900">{t.name}</span>
                                <code className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                  {t.key}
                                </code>
                              </div>
                              {t.description && <p className="text-[11px] text-slate-400">{t.description}</p>}
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                              {['email', 'sms', 'webhook'].map((ch) => {
                                const isEnabled = getChannelStatus(ch, t.key);
                                return (
                                  <button
                                    key={ch}
                                    type="button"
                                    onClick={() => handleTogglePreference(ch, t.key, isEnabled)}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs border transition-colors ${
                                      isEnabled
                                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                                        : 'bg-rose-50 border-rose-200 text-rose-700 opacity-80'
                                    }`}
                                  >
                                    <span className="uppercase text-[10px] font-bold tracking-wider">{ch}</span>
                                    {isEnabled ? (
                                      <ShieldCheck size={14} className="text-emerald-600" />
                                    ) : (
                                      <ShieldAlert size={14} className="text-rose-600" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
