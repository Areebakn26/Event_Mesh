import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart2, CheckCircle2, AlertTriangle, Clock, Activity } from 'lucide-react';

interface AnalyticsData {
  total: number;
  sent: number;
  failed: number;
  queued: number;
  successRate: number;
  channels: {
    email: number;
    sms: number;
    webhook: number;
  };
}

interface AnalyticsTabProps {
  projectId: string;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ projectId }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${projectId}/analytics`);
      setData(res.data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchAnalytics();
  }, [projectId]);

  if (loading) {
    return <div className="text-center py-12 opacity-50">Calculating analytics...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Delivery Analytics</h3>
        <p className="text-sm opacity-70">Real-time delivery performance metrics, success rates, and channel volume distribution.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Total Volume</span>
            <Activity size={16} className="text-slate-400" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight tabular-nums">{data.total}</p>
          <p className="text-[11px] text-slate-400">Total API dispatches</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            <span>Success Rate</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight tabular-nums text-emerald-600">{data.successRate}%</p>
          <p className="text-[11px] text-slate-400">{data.sent} delivered</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600 uppercase tracking-wider">
            <span>Failed / DLQ</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight tabular-nums text-rose-600">{data.failed}</p>
          <p className="text-[11px] text-slate-400">Require intervention</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-600 uppercase tracking-wider">
            <span>Queued</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight tabular-nums text-amber-600">{data.queued}</p>
          <p className="text-[11px] text-slate-400">Pending worker pickup</p>
        </div>
      </div>

      {/* Channel Volume Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-2">
          <BarChart2 size={18} className="text-slate-600" />
          <h4 className="text-sm font-bold uppercase tracking-wider">Channel Volume Breakdown</h4>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-700">Email (SMTP)</span>
              <span className="font-mono text-slate-500">{data.channels.email} dispatches</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${data.total > 0 ? (data.channels.email / data.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* SMS */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-700">SMS (Twilio)</span>
              <span className="font-mono text-slate-500">{data.channels.sms} dispatches</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${data.total > 0 ? (data.channels.sms / data.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Webhook */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-700">Webhook (HTTP Callback)</span>
              <span className="font-mono text-slate-500">{data.channels.webhook} dispatches</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${data.total > 0 ? (data.channels.webhook / data.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
