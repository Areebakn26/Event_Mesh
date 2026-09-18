import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ProviderConfigModal } from './ProviderConfigModal';
import {
  Sliders, Plus, ArrowUp, ArrowDown, Edit3, Trash2, ShieldCheck,
  Zap, Mail, MessageSquare, Globe, Bell
} from 'lucide-react';

interface ChannelProvider {
  id: string;
  projectId: string;
  channel: 'email' | 'sms' | 'webhook' | 'in_app' | string;
  providerIdentifier: string;
  credentials: any;
  priority: number;
  active: boolean;
  rateLimitPerSecond: number;
  createdAt: string;
  updatedAt: string;
}

interface ProvidersTabProps {
  projectId: string;
}

export const ProvidersTab: React.FC<ProvidersTabProps> = ({ projectId }) => {
  const [providers, setProviders] = useState<ChannelProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ChannelProvider | null>(null);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/v1/providers', {
        headers: { 'x-project-id': projectId },
      });
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to fetch channel providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProviders();
    }
  }, [projectId]);

  const handleOpenAddModal = () => {
    setSelectedProvider(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (provider: ChannelProvider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (provider: ChannelProvider) => {
    try {
      const updatedActive = !provider.active;
      await api.put(
        `/v1/providers/${provider.id}`,
        { active: updatedActive },
        { headers: { 'x-project-id': projectId } }
      );
      fetchProviders();
    } catch (error) {
      console.error('Failed to toggle provider active status:', error);
      alert('Failed to update provider status.');
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the provider '${name}'?`)) return;
    try {
      await api.delete(`/v1/providers/${id}`, {
        headers: { 'x-project-id': projectId },
      });
      fetchProviders();
    } catch (error) {
      console.error('Failed to delete provider:', error);
      alert('Failed to delete provider.');
    }
  };

  const handleReorder = async (channelProvidersList: ChannelProvider[], index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= channelProvidersList.length) return;

    // Swap priorities between index and targetIndex
    const itemA = channelProvidersList[index];
    const itemB = channelProvidersList[targetIndex];

    const providerOrder = [
      { id: itemA.id, priority: itemB.priority },
      { id: itemB.id, priority: itemA.priority },
    ];

    try {
      await api.patch(
        '/v1/providers/reorder',
        { providerOrder },
        { headers: { 'x-project-id': projectId } }
      );
      fetchProviders();
    } catch (error) {
      console.error('Failed to reorder providers:', error);
      alert('Failed to reorder provider priorities.');
    }
  };

  // Group providers by channel
  const channels = ['email', 'sms', 'webhook', 'in_app'];

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email':
        return <Mail size={18} className="text-violet-600" />;
      case 'sms':
        return <MessageSquare size={18} className="text-blue-600" />;
      case 'webhook':
        return <Globe size={18} className="text-emerald-600" />;
      case 'in_app':
        return <Bell size={18} className="text-amber-600" />;
      default:
        return <Sliders size={18} className="text-slate-600" />;
    }
  };

  const getChannelTitle = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email':
        return 'Email Delivery Providers';
      case 'sms':
        return 'SMS & Telephony Providers';
      case 'webhook':
        return 'HTTP Webhook Providers';
      case 'in_app':
        return 'In-App Notification Stream';
      default:
        return `${channel.toUpperCase()} Providers`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <Sliders size={22} className="text-violet-600" />
            <span>Channel Provider Failover Engine</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure delivery providers per channel with sequential priority failover. EventMesh automatically bypasses rate-limited or failing primary providers and routes to secondary fallbacks.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-150 active:scale-95 flex-shrink-0"
        >
          <Plus size={16} />
          <span>Add Channel Provider</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs font-semibold">
          Loading configured channel providers...
        </div>
      ) : (
        <div className="space-y-8">
          {channels.map((channelKey) => {
            const channelProvidersList = providers
              .filter((p) => p.channel.toLowerCase() === channelKey)
              .sort((a, b) => a.priority - b.priority);

            return (
              <div key={channelKey} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                {/* Channel Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {getChannelIcon(channelKey)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{getChannelTitle(channelKey)}</h4>
                      <p className="text-[11px] text-slate-400">
                        {channelProvidersList.length} provider{channelProvidersList.length === 1 ? '' : 's'} configured in failover sequence
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                    {channelKey}
                  </span>
                </div>

                {/* Provider List / Cards */}
                {channelProvidersList.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">No providers configured for {channelKey} channel.</p>
                    <button
                      onClick={handleOpenAddModal}
                      className="mt-2 text-xs text-violet-600 font-bold hover:underline inline-flex items-center space-x-1"
                    >
                      <Plus size={12} />
                      <span>Add {channelKey.toUpperCase()} Provider</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {channelProvidersList.map((provider, index) => (
                      <div
                        key={provider.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          provider.active
                            ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 opacity-60'
                        }`}
                      >
                        {/* Left Info */}
                        <div className="flex items-center space-x-4">
                          {/* Priority Badge */}
                          <div
                            className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl font-bold font-mono text-xs ${
                              index === 0
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-xs'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span className="text-[9px] uppercase tracking-tighter text-slate-400 font-sans font-normal">
                              {index === 0 ? 'PRI 1' : `PRI ${index + 1}`}
                            </span>
                            <span>#{provider.priority}</span>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-sm text-slate-900 capitalize font-mono">
                                {provider.providerIdentifier}
                              </span>
                              {index === 0 ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center space-x-1">
                                  <ShieldCheck size={11} />
                                  <span>Primary Provider</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                                  Fallback #{index}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                              <span className="flex items-center space-x-1 font-mono text-[11px]">
                                <Zap size={12} className="text-amber-500" />
                                <span>{provider.rateLimitPerSecond} req/sec limit</span>
                              </span>
                              <span>•</span>
                              <span className="text-[11px]">
                                Configured: {new Date(provider.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center space-x-3">
                          {/* Active Toggle */}
                          <div className="flex items-center space-x-2 border-r border-slate-200 pr-3">
                            <span className="text-[11px] font-semibold text-slate-500">
                              {provider.active ? 'Active' : 'Disabled'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(provider)}
                              className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors focus:outline-none ${
                                provider.active ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${
                                  provider.active ? 'translate-x-4' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Move Up / Down Buttons */}
                          <div className="flex items-center space-x-1 border-r border-slate-200 pr-3">
                            <button
                              disabled={index === 0}
                              onClick={() => handleReorder(channelProvidersList, index, 'up')}
                              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600"
                              title="Move Up in Priority"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              disabled={index === channelProvidersList.length - 1}
                              onClick={() => handleReorder(channelProvidersList, index, 'down')}
                              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600"
                              title="Move Down in Priority"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>

                          {/* Edit & Delete */}
                          <button
                            onClick={() => handleOpenEditModal(provider)}
                            className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            title="Edit Credentials & Config"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteProvider(provider.id, provider.providerIdentifier)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Provider"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Configuration Modal */}
      <ProviderConfigModal
        isOpen={isModalOpen}
        projectId={projectId}
        providerToEdit={selectedProvider}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          setIsModalOpen(false);
          fetchProviders();
        }}
      />
    </div>
  );
};
