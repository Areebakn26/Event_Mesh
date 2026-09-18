import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users, Search, Plus, Mail, Phone, ChevronLeft, ChevronRight,
  Sliders, Trash2, Tag, RefreshCw, X, CheckCircle
} from 'lucide-react';
import { SubscriberDrawer } from './SubscriberDrawer';

interface SubscribersTabProps {
  projectId: string;
}

export const SubscribersTab: React.FC<SubscribersTabProps> = ({ projectId }) => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1, limit: 15 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Drawer / Modal States
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState(false);

  // Form State for New Subscriber
  const [newSubId, setNewSubId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [creating, setCreating] = useState(false);

  // Topics State
  const [topics, setTopics] = useState<any[]>([]);
  const [newTopicKey, setNewTopicKey] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');

  useEffect(() => {
    fetchSubscribers(1);
    fetchTopics();
  }, [projectId]);

  const fetchSubscribers = async (page = 1, searchQuery = search) => {
    setLoading(true);
    try {
      const { data } = await api.get('/v1/subscribers', {
        headers: { 'x-project-id': projectId },
        params: { page, limit: 15, search: searchQuery },
      });
      setSubscribers(data.subscribers || []);
      setMeta(data.meta || { total: 0, page: 1, totalPages: 1, limit: 15 });
    } catch (error) {
      console.error('Failed to fetch subscribers', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const { data } = await api.get('/v1/topics', {
        headers: { 'x-project-id': projectId },
      });
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Failed to fetch topics', error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubscribers(1, search);
  };

  const handleCreateSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubId.trim()) return;
    setCreating(true);
    try {
      await api.post(
        '/v1/subscribers',
        {
          subscriberId: newSubId.trim(),
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
          firstName: newFirstName.trim() || undefined,
          lastName: newLastName.trim() || undefined,
        },
        { headers: { 'x-project-id': projectId } }
      );

      setNewSubId('');
      setNewEmail('');
      setNewPhone('');
      setNewFirstName('');
      setNewLastName('');
      setIsAddModalOpen(false);
      fetchSubscribers(1);
    } catch (error) {
      console.error('Failed to create subscriber', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicKey.trim() || !newTopicName.trim()) return;
    try {
      await api.post(
        '/v1/topics',
        {
          key: newTopicKey.trim(),
          name: newTopicName.trim(),
          description: newTopicDesc.trim() || undefined,
        },
        { headers: { 'x-project-id': projectId } }
      );
      setNewTopicKey('');
      setNewTopicName('');
      setNewTopicDesc('');
      fetchTopics();
    } catch (error) {
      console.error('Failed to create topic', error);
    }
  };

  const handleDeleteSubscriber = async (subscriberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete subscriber "${subscriberId}"?`)) return;

    try {
      await api.delete(`/v1/subscribers/${subscriberId}`, {
        headers: { 'x-project-id': projectId },
      });
      fetchSubscribers(meta.page);
    } catch (error) {
      console.error('Failed to delete subscriber', error);
    }
  };

  const openDrawer = (subId: string) => {
    setSelectedSubscriberId(subId);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Subscriber Directory & Preferences
          </h3>
          <p className="text-xs text-slate-500">
            Manage end-user profiles, channel opt-outs, and topic preferences across Email, SMS, and Webhooks.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsTopicsModalOpen(true)}
            className="inline-flex items-center space-x-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Tag size={14} className="text-violet-600" />
            <span>Manage Topics ({topics.length})</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 text-white bg-violet-600 hover:bg-violet-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Add Subscriber</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full sm:w-auto flex-1">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search subscribers by ID, Email, First Name, or Last Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-violet-500"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <button
          onClick={() => fetchSubscribers(meta.page)}
          className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center space-x-1"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Subscriber ID</th>
              <th className="px-6 py-3">Subscriber Name</th>
              <th className="px-6 py-3">Contact Details</th>
              <th className="px-6 py-3">Preferences Summary</th>
              <th className="px-6 py-3">Created Date</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && subscribers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading subscribers directory...
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                  <Users size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No subscribers found</p>
                  <p className="text-[11px] text-slate-400 mt-1">Add your first subscriber or update your search query.</p>
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => openDrawer(sub.subscriberId)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  {/* Subscriber ID */}
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900">
                    <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-violet-700">
                      {sub.subscriberId}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center">
                        {sub.firstName ? sub.firstName[0].toUpperCase() : sub.subscriberId[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-xs text-slate-900 block">
                          {sub.firstName || sub.lastName
                            ? `${sub.firstName || ''} ${sub.lastName || ''}`
                            : 'Unnamed Subscriber'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sub.locale || 'en'} / {sub.timeZone || 'UTC'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="px-6 py-4">
                    <div className="space-y-0.5 text-xs text-slate-600">
                      {sub.email && (
                        <div className="flex items-center space-x-1.5 truncate max-w-[200px]">
                          <Mail size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">{sub.email}</span>
                        </div>
                      )}
                      {sub.phone && (
                        <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                          <Phone size={12} className="text-slate-400 flex-shrink-0" />
                          <span>{sub.phone}</span>
                        </div>
                      )}
                      {!sub.email && !sub.phone && <span className="text-slate-400 text-xs italic">No contact details</span>}
                    </div>
                  </td>

                  {/* Preference Summary Badges */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center space-x-1">
                        <CheckCircle size={10} />
                        <span>Email</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center space-x-1">
                        <CheckCircle size={10} />
                        <span>SMS</span>
                      </span>
                      {sub.preferences && sub.preferences.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-violet-50 text-violet-700 border border-violet-100">
                          +{sub.preferences.length} rules
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Created Date */}
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDrawer(sub.subscriberId);
                        }}
                        className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Preferences"
                      >
                        <Sliders size={15} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSubscriber(sub.subscriberId, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Subscriber"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>
            Showing {subscribers.length} of {meta.total} subscribers
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchSubscribers(meta.page - 1)}
              className="p-1 rounded border hover:bg-white disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {meta.page} of {meta.totalPages || 1}
            </span>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchSubscribers(meta.page + 1)}
              className="p-1 rounded border hover:bg-white disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD SUBSCRIBER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Subscriber</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubscriber} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subscriber ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sub_usr_9921 or user_123"
                  value={newSubId}
                  onChange={(e) => setNewSubId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    placeholder="John"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+14155552671"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-violet-600 text-white font-medium text-xs rounded-lg hover:bg-violet-700"
                >
                  {creating ? 'Saving...' : 'Create Subscriber'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE NOTIFICATION TOPICS */}
      {isTopicsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Notification Topics Manager</h3>
                <p className="text-xs text-slate-500">Categories end-users can selectively opt-in or opt-out of.</p>
              </div>
              <button onClick={() => setIsTopicsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Create Topic Form */}
            <form onSubmit={handleCreateTopic} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Create New Topic</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Topic Key *</label>
                  <input
                    type="text"
                    required
                    placeholder="security_alerts"
                    value={newTopicKey}
                    onChange={(e) => setNewTopicKey(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Topic Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Security Alerts"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Critical login & password security notifications"
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-violet-600 text-white font-medium text-xs rounded-lg hover:bg-violet-700 transition-colors"
              >
                Save Topic Definition
              </button>
            </form>

            {/* Existing Topics List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Registered Topics</h4>
              {topics.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No custom notification topics registered yet.</p>
              ) : (
                <div className="space-y-2">
                  {topics.map((topic) => (
                    <div key={topic.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{topic.name}</span>
                          <code className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            {topic.key}
                          </code>
                        </div>
                        {topic.description && <p className="text-[11px] text-slate-500 mt-0.5">{topic.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER FOR EDITING PREFERENCES */}
      <SubscriberDrawer
        subscriberId={selectedSubscriberId}
        projectId={projectId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={() => fetchSubscribers(meta.page)}
      />
    </div>
  );
};
