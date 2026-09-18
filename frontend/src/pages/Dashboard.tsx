import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  Key, Folder, Activity, Zap, CheckCircle2, Clock, AlertCircle,
  FileText, AlertOctagon, BarChart2, Sliders, Send, Search, ChevronLeft, ChevronRight,
  Radio, X, Copy, Check, Users, GitFork, Plus
} from 'lucide-react';
import { TemplatesTab } from '../components/TemplatesTab';
import { DlqTab } from '../components/DlqTab';
import { AnalyticsTab } from '../components/AnalyticsTab';
import { ProvidersTab } from '../components/ProvidersTab';
import { SubscribersTab } from '../components/SubscribersTab';
import { WorkflowsTab } from '../components/WorkflowsTab';
import { NotificationBell } from '../components/NotificationBell';
import { SandboxModal } from '../components/SandboxModal';

type ActiveTab = 'keys' | 'subscribers' | 'workflows' | 'templates' | 'logs' | 'dlq' | 'analytics' | 'provider';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Logs state with Pagination & Filters
  const [logs, setLogs] = useState<any[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // UI State
  const [activeTab, setActiveTab] = useState<ActiveTab>('logs');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showSandbox, setShowSandbox] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // New project modal
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateProjectInput, setShowCreateProjectInput] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchApiKeys(selectedProject.id);
      fetchLogs(selectedProject.id, 1, statusFilter, channelFilter, searchQuery);
    }
  }, [selectedProject]);

  // Real-Time SSE EventSource Listener
  useEffect(() => {
    if (!selectedProject) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const baseURL = (api.defaults.baseURL || 'http://localhost:4000').replace(/\/$/, '');
    const sseUrl = `${baseURL}/projects/${selectedProject.id}/events/stream?token=${encodeURIComponent(token)}`;

    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'connected') return;

        // Prepend or update log entry in real time!
        setLogs(prevLogs => {
          const index = prevLogs.findIndex(l => l.id === payload.id);
          if (index !== -1) {
            const updated = [...prevLogs];
            updated[index] = { ...updated[index], ...payload };
            return updated;
          } else {
            return [payload, ...prevLogs.slice(0, 14)];
          }
        });
      } catch (err) {
        console.error('Failed to parse SSE payload', err);
      }
    };

    eventSource.onerror = () => {
      setSseConnected(false);
      eventSource.close();
    };

    return () => {
      setSseConnected(false);
      eventSource.close();
    };
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
      if (data.projects.length > 0 && !selectedProject) {
        setSelectedProject(data.projects[0]);
      }
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  };

  const fetchApiKeys = async (projectId: string) => {
    try {
      const { data } = await api.get(`/api-keys/project/${projectId}`);
      setApiKeys(data.keys);
    } catch (error) {
      console.error('Failed to fetch keys', error);
    }
  };

  const fetchLogs = async (
    projectId: string,
    page = 1,
    status = statusFilter,
    channel = channelFilter,
    search = searchQuery
  ) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/logs`, {
        params: { page, limit: 15, status, channel, search },
      });
      setLogs(data.logs);
      setLogsTotal(data.total);
      setLogsPage(data.page);
      setLogsTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProject) fetchLogs(selectedProject.id, 1, statusFilter, channelFilter, searchQuery);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const { data } = await api.post('/projects', { name: newProjectName });
      setProjects([...projects, data.project]);
      setSelectedProject(data.project);
      setNewProjectName('');
      setShowCreateProjectInput(false);
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newKeyName.trim()) return;
    try {
      const { data } = await api.post('/api-keys', { name: newKeyName, projectId: selectedProject.id });
      setGeneratedKey(data.apiKey);
      setNewKeyName('');
      fetchApiKeys(selectedProject.id);
    } catch (error) {
      console.error('Failed to generate key', error);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await api.delete(`/api-keys/${keyId}`);
      fetchApiKeys(selectedProject.id);
    } catch (error) {
      console.error('Failed to revoke key', error);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
      case 'sent':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle2 size={12} /><span>Sent</span></span>;
      case 'queued':
      case 'processing':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"><Clock size={12} /><span>{status}</span></span>;
      case 'failed':
      case 'dead_lettered':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100"><AlertCircle size={12} /><span>{status}</span></span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen flex font-sans selection:bg-[#7342E2]/30" style={{ backgroundColor: 'var(--color-login-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}>
      
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col relative overflow-hidden shadow-xl" style={{ backgroundColor: 'var(--color-text)', color: 'white' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" style={{ backgroundColor: 'var(--color-accent)', opacity: 0.15 }}></div>

        <div className="p-6 relative z-10 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg shadow-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent)' }}>
            <Zap size={16} className="text-white fill-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>EventMesh</h1>
        </div>
        <div className="px-6 mb-3 flex items-center justify-between">
          <p className="text-[11px] font-medium tracking-widest uppercase opacity-60">Workspaces</p>
          <button
            onClick={() => setShowCreateProjectInput(!showCreateProjectInput)}
            className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"
            title="Create New Workspace"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="px-3 flex-1 overflow-y-auto space-y-6">
          {showCreateProjectInput && (
            <form onSubmit={handleCreateProject} className="p-2 bg-white/10 rounded-lg space-y-2 border border-white/20 animate-in fade-in duration-150">
              <input
                type="text"
                required
                placeholder="Workspace Name..."
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/20 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-400"
              />
              <div className="flex justify-end space-x-1.5">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectInput(false)}
                  className="px-2 py-1 text-[11px] text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 text-[11px] bg-violet-600 hover:bg-violet-700 text-white font-bold rounded shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          <div className="space-y-1">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                  selectedProject?.id === p.id 
                  ? 'bg-white/10 text-white font-medium shadow-inner' 
                  : 'hover:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                <Folder size={16} className={selectedProject?.id === p.id ? 'text-white' : 'opacity-50'} />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>

          {/* Navigation Tabs */}
          {selectedProject && (
            <div className="pt-4 border-t border-white/10 space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2">Platform Navigation</p>
              
              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'logs' ? 'bg-white/15 text-white' : 'opacity-70 hover:opacity-100 hover:bg-white/5'}`}
              >
                <Activity size={15} />
                <span>Live Logs</span>
              </button>

              <button
                onClick={() => setActiveTab('subscribers')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'subscribers' ? 'bg-white/15 text-white' : 'opacity-70 hover:opacity-100 hover:bg-white/5'}`}
              >
                <Users size={15} />
                <span>Subscribers & Preferences</span>
              </button>

              <button
                onClick={() => setActiveTab('workflows')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'workflows' ? 'bg-white/15 text-white' : 'opacity-70 hover:opacity-100 hover:bg-white/5'}`}
              >
                <GitFork size={15} />
                <span>Workflows Builder</span>
              </button>

              <button
                onClick={() => setActiveTab('templates')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'templates' ? 'bg-white/15 text-white' : 'opacity-70 hover:opacity-100 hover:bg-white/5'}`}
              >
                <FileText size={15} />
                <span>Templates</span>
              </button>

              <button
                onClick={() => setActiveTab('dlq')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'dlq' ? 'bg-white/15 text-white' : 'opacity-70 hover:opacity-100 hover:bg-white/5'}`}
              >
                <AlertOctagon size={15} />
                <span>Dead-Letter Queue</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'analytics' ? 'bg-white/15 text-white' : 'opacity-70 hover:opacity-100 hover:bg-white/5'}`}
              >
                <BarChart2 size={15} />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab('keys')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'keys' ? 'bg-white/15 text-white' : 'opacity-70 hover:opacity-100 hover:bg-white/5'}`}
              >
                <Key size={15} />
                <span>API Keys</span>
              </button>

              <button
                onClick={() => setActiveTab('provider')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'provider' ? 'bg-white/15 text-white' : 'opacity-70 hover:opacity-100 hover:bg-white/5'}`}
              >
                <Sliders size={15} />
                <span>Provider Credentials</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs opacity-70 truncate">{user?.email}</span>
          <button onClick={logout} className="text-xs font-medium hover:underline opacity-80 hover:opacity-100">
            Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-bold tracking-tight">{selectedProject ? selectedProject.name : 'Select Project'}</h2>
            
            {/* Real-time SSE indicator */}
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 border border-slate-200">
              <Radio size={12} className={sseConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'} />
              <span className="text-[11px] text-slate-600">{sseConnected ? 'SSE Live Stream Active' : 'Connecting SSE...'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {selectedProject && (
              <>
                <NotificationBell subscriberId={user?.email || 'admin'} projectId={selectedProject.id} />

                <button
                  onClick={() => setShowSandbox(true)}
                  className="inline-flex items-center space-x-2 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-transform active:scale-95 shadow-sm"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  <Send size={14} />
                  <span>Test Sandbox</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Workspace Content View */}
        <main className="p-8 max-w-7xl w-full mx-auto flex-1">
          {selectedProject ? (
            <>
              {/* TAB 1: API KEYS */}
              {activeTab === 'keys' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>API Keys</h3>
                      <p className="text-sm opacity-70">Authenticates public POST `/v1/notify` requests. Keys are SHA-256 hashed on storage.</p>
                    </div>
                  </div>

                  {/* Create Key Form */}
                  <form onSubmit={handleGenerateKey} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center space-x-3">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Production Server Key"
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none"
                    />
                    <button type="submit" className="text-white font-medium px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-accent)' }}>
                      Generate Key
                    </button>
                  </form>

                  {/* New Key Banner */}
                  {generatedKey && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-emerald-800">
                        <span>Save your new API Key (only shown once):</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedKey);
                            setCopiedKey(true);
                            setTimeout(() => setCopiedKey(false), 2000);
                          }}
                          className="flex items-center space-x-1 text-emerald-700 hover:underline"
                        >
                          {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                        </button>
                      </div>
                      <code className="block bg-white p-3 rounded border border-emerald-200 font-mono text-xs text-slate-800 break-all">
                        {generatedKey}
                      </code>
                    </div>
                  )}

                  {/* Keys Table */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3">Name</th>
                          <th className="px-6 py-3">Key Hash</th>
                          <th className="px-6 py-3">Created</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-xs">
                        {apiKeys.map(k => (
                          <tr key={k.id}>
                            <td className="px-6 py-4 font-sans font-medium text-slate-900">{k.name}</td>
                            <td className="px-6 py-4 text-slate-400 font-mono text-xs">{(k.hash || k.id).slice(0, 12)}...</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => handleRevokeKey(k.id)} className="text-rose-600 hover:underline">Revoke</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: SUBSCRIBERS */}
              {activeTab === 'subscribers' && <SubscribersTab projectId={selectedProject.id} />}

              {/* TAB: WORKFLOWS BUILDER */}
              {activeTab === 'workflows' && <WorkflowsTab projectId={selectedProject.id} />}

              {/* TAB 2: TEMPLATES */}
              {activeTab === 'templates' && <TemplatesTab projectId={selectedProject.id} />}

              {/* TAB 3: LIVE LOGS (WITH SEARCH, FILTERS & PAGINATION) */}
              {activeTab === 'logs' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Notification Logs</h3>
                      <p className="text-sm opacity-70">Real-time audit log of all queued, processed, sent, and failed dispatches.</p>
                    </div>
                    <button
                      onClick={() => fetchLogs(selectedProject.id, logsPage)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      Refresh Logs
                    </button>
                  </div>

                  {/* Filter & Search Toolbar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full sm:w-auto flex-1">
                      <div className="relative w-full">
                        <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by recipient email, phone, or Job ID..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                    </form>

                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div className="flex items-center space-x-1.5 text-xs">
                        <span className="text-slate-500 font-semibold">Status:</span>
                        <select
                          value={statusFilter}
                          onChange={e => {
                            setStatusFilter(e.target.value);
                            fetchLogs(selectedProject.id, 1, e.target.value, channelFilter, searchQuery);
                          }}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                        >
                          <option value="all">All</option>
                          <option value="sent">Sent</option>
                          <option value="queued">Queued</option>
                          <option value="processing">Processing</option>
                          <option value="failed">Failed</option>
                          <option value="dead_lettered">Dead-Lettered</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-1.5 text-xs">
                        <span className="text-slate-500 font-semibold">Channel:</span>
                        <select
                          value={channelFilter}
                          onChange={e => {
                            setChannelFilter(e.target.value);
                            fetchLogs(selectedProject.id, 1, statusFilter, e.target.value, searchQuery);
                          }}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                        >
                          <option value="all">All</option>
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="webhook">Webhook</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Logs Table */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Recipient</th>
                          <th className="px-6 py-3">Channel</th>
                          <th className="px-6 py-3">Job ID</th>
                          <th className="px-6 py-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {logs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                              No log records found matching your filters.
                            </td>
                          </tr>
                        ) : (
                          logs.map(log => (
                            <tr
                              key={log.id}
                              onClick={() => setSelectedLog(log)}
                              className="hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <td className="px-6 py-4">{renderStatusBadge(log.status)}</td>
                              <td className="px-6 py-4 font-mono text-xs text-slate-800 truncate max-w-[200px]">
                                {log.recipient}
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-wider">
                                  {log.channel}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                {log.jobId || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* Pagination Bar */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                      <span>Showing {logs.length} of {logsTotal} records</span>
                      <div className="flex items-center space-x-2">
                        <button
                          disabled={logsPage <= 1}
                          onClick={() => fetchLogs(selectedProject.id, logsPage - 1)}
                          className="p-1 rounded border hover:bg-white disabled:opacity-30"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span>Page {logsPage} of {logsTotalPages}</span>
                        <button
                          disabled={logsPage >= logsTotalPages}
                          onClick={() => fetchLogs(selectedProject.id, logsPage + 1)}
                          className="p-1 rounded border hover:bg-white disabled:opacity-30"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DEAD-LETTER QUEUE (DLQ) */}
              {activeTab === 'dlq' && <DlqTab projectId={selectedProject.id} />}

              {/* TAB 5: ANALYTICS */}
              {activeTab === 'analytics' && <AnalyticsTab projectId={selectedProject.id} />}

              {/* TAB 6: PROVIDER CREDENTIALS & FAILOVER */}
              {activeTab === 'provider' && <ProvidersTab projectId={selectedProject.id} />}
            </>
          ) : (
            <div className="text-center py-24 space-y-4">
              <h3 className="text-xl font-bold">No Workspace Selected</h3>
              <p className="text-sm opacity-70">Create a project workspace on the left to get started.</p>
              
              <form onSubmit={handleCreateProject} className="max-w-md mx-auto flex space-x-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. My SaaS App"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
                <button type="submit" className="text-white px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--color-accent)' }}>
                  Create Project
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Log Detail Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-end p-4">
          <div className="bg-white h-full max-w-lg w-full rounded-2xl p-6 shadow-2xl overflow-y-auto space-y-6 border border-slate-200 animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-base font-bold">Log Execution Inspector</h3>
              <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Log ID</span>
                <p className="p-2 bg-slate-50 border rounded font-semibold text-slate-800">{selectedLog.id}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status & Attempts</span>
                <div className="flex items-center space-x-3">
                  {renderStatusBadge(selectedLog.status)}
                  <span className="text-slate-500 font-sans">Attempts: {selectedLog.attempts || 1}</span>
                </div>
              </div>

              {selectedLog.error && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Root Cause Error</span>
                  <pre className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs whitespace-pre-wrap">
                    {selectedLog.error}
                  </pre>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Raw JSON Payload</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded text-[11px] overflow-x-auto">
                  {JSON.stringify(typeof selectedLog.payload === 'string' ? JSON.parse(selectedLog.payload) : selectedLog.payload || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Sandbox Modal */}
      {selectedProject && (
        <SandboxModal
          projectId={selectedProject.id}
          isOpen={showSandbox}
          onClose={() => setShowSandbox(false)}
          onSuccess={() => {
            fetchLogs(selectedProject.id, 1);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
