import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AlertOctagon, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

interface DlqRecord {
  id: string;
  jobId?: string;
  channel: string;
  status: string;
  recipient: string;
  error?: string;
  attempts: number;
  payload?: any;
  createdAt: string;
}

interface DlqTabProps {
  projectId: string;
}

export const DlqTab: React.FC<DlqTabProps> = ({ projectId }) => {
  const [logs, setLogs] = useState<DlqRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchDlq = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/projects/${projectId}/dlq`);
      setLogs(data.logs);
    } catch (error) {
      console.error('Failed to fetch DLQ records', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchDlq();
  }, [projectId]);

  const handleRetry = async (id: string) => {
    try {
      setRetryingId(id);
      await api.post(`/dlq/${id}/retry`);
      fetchDlq();
    } catch (error) {
      console.error('Failed to retry job', error);
    } finally {
      setRetryingId(null);
    }
  };

  const handlePurge = async (id: string) => {
    if (!window.confirm('Are you sure you want to purge this record from DLQ?')) return;
    try {
      await api.delete(`/dlq/${id}`);
      fetchDlq();
    } catch (error) {
      console.error('Failed to purge DLQ record', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold tracking-tight flex items-center space-x-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <AlertOctagon size={22} className="text-rose-600" />
            <span>Dead-Letter Queue (DLQ)</span>
          </h3>
          <p className="text-sm opacity-70">Inspect failed notifications, view root-cause error messages, and retry dispatches after resolving issues.</p>
        </div>
        <button
          onClick={fetchDlq}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Refresh DLQ
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 opacity-50">Loading DLQ records...</div>
      ) : logs.length === 0 ? (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-12 text-center space-y-2">
          <ShieldAlert size={32} className="mx-auto text-emerald-600 opacity-60" />
          <h4 className="text-base font-semibold text-emerald-950">Dead-Letter Queue is Clean!</h4>
          <p className="text-sm text-emerald-700 max-w-sm mx-auto">No failed or dead-lettered dispatches in this workspace. All notifications are executing cleanly.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Recipient</th>
                <th className="px-6 py-3">Channel</th>
                <th className="px-6 py-3">Error Details</th>
                <th className="px-6 py-3 text-center">Attempts</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${log.status === 'dead_lettered' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-800'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-800 font-medium truncate max-w-[180px]">
                    {log.recipient}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold">{log.channel}</span>
                  </td>
                  <td className="px-6 py-4 text-rose-600 line-clamp-2 max-w-[280px]">
                    {log.error || 'Unknown error'}
                  </td>
                  <td className="px-6 py-4 text-center font-bold">
                    {log.attempts}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleRetry(log.id)}
                      disabled={retryingId === log.id}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={retryingId === log.id ? 'animate-spin' : ''} />
                      <span>Retry</span>
                    </button>
                    <button
                      onClick={() => handlePurge(log.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Purge record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
