import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  X, CheckCircle2, Clock, AlertCircle, PlayCircle, ChevronDown, ChevronRight,
  Mail, Phone, Globe, RefreshCw, User, Layers
} from 'lucide-react';

interface WorkflowRunHistoryProps {
  workflowId: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowRunHistory: React.FC<WorkflowRunHistoryProps> = ({
  workflowId,
  projectId,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [workflow, setWorkflow] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workflowId) {
      fetchHistory();
    }
  }, [isOpen, workflowId, projectId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/v1/workflows/${workflowId}`, {
        headers: { 'x-project-id': projectId },
      });
      setWorkflow(data.workflow);
      setRuns(data.workflow?.runs || []);
      if (data.workflow?.runs?.length > 0) {
        setExpandedRunId(data.workflow.runs[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch workflow run history', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRunExpand = (runId: string) => {
    setExpandedRunId((prev) => (prev === runId ? null : runId));
  };

  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'sent':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} />
            <span>Completed</span>
          </span>
        );
      case 'digest_batch_created':
      case 'batched':
      case 'merged_into_batch':
      case 'digest_flushed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Layers size={12} />
            <span>{status.replace(/_/g, ' ')}</span>
          </span>
        );
      case 'processing':
      case 'paused':
      case 'paused_delay':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} className="animate-spin" />
            <span>{status}</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={12} />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <PlayCircle size={12} />
            <span>{status}</span>
          </span>
        );
    }
  };

  const renderStepIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'email':
        return <Mail size={14} className="text-blue-500" />;
      case 'sms':
        return <Phone size={14} className="text-emerald-500" />;
      case 'webhook':
      case 'in_app':
        return <Globe size={14} className="text-purple-500" />;
      case 'delay':
        return <Clock size={14} className="text-amber-500" />;
      case 'digest':
      case 'digest_flushed':
        return <Layers size={14} className="text-indigo-600" />;
      default:
        return <PlayCircle size={14} className="text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">Execution History</h3>
              {workflow && (
                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-mono font-bold rounded">
                  {workflow.triggerIdentifier}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Audit log of triggered workflow runs, step delays, skips, and dispatches.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchHistory}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Loading run logs...</p>
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-16 space-y-2 border border-dashed border-slate-200 rounded-xl">
              <PlayCircle size={32} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-700">No Workflow Runs Found</p>
              <p className="text-[11px] text-slate-400">
                Trigger this workflow via API `POST /v1/workflows/{workflow?.triggerIdentifier}/trigger` to view live executions.
              </p>
            </div>
          ) : (
            runs.map((run) => {
              const isExpanded = expandedRunId === run.id;
              const stepLogs = (run.logs as any[]) || [];

              return (
                <div
                  key={run.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all"
                >
                  {/* Run Header Row */}
                  <div
                    onClick={() => toggleRunExpand(run.id)}
                    className="p-4 bg-slate-50/50 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <button className="text-slate-400">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-slate-900">Run: {run.id.slice(0, 8)}...</span>
                          {renderStatusBadge(run.status)}
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center space-x-1">
                            <User size={11} className="text-slate-400" />
                            <span className="font-mono">{run.subscriberId}</span>
                          </span>
                          <span>•</span>
                          <span>{new Date(run.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-mono">Step {run.currentStepIndex}</span>
                    </div>
                  </div>

                  {/* Expanded Step Timeline */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 bg-white space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Step Execution Timeline</h4>

                      {stepLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No execution logs recorded yet.</p>
                      ) : (
                        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                          {stepLogs.map((log: any, idx: number) => {
                            const isSkipped = log.status === 'skipped';
                            const isFailed = log.status === 'failed';
                            const isDelay = log.type === 'delay';
                            const isDigest =
                              log.type === 'digest' ||
                              log.type === 'digest_flushed' ||
                              log.status === 'digest_batch_created' ||
                              log.status === 'batched' ||
                              log.status === 'merged_into_batch' ||
                              log.status === 'digest_flushed';

                            return (
                              <div key={idx} className="relative flex items-start space-x-3">
                                {/* Dot Indicator */}
                                <div
                                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                                    isFailed
                                      ? 'bg-rose-100 border-rose-400 text-rose-700'
                                      : isDigest
                                      ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                                      : isDelay
                                      ? 'bg-amber-100 border-amber-400 text-amber-700'
                                      : isSkipped
                                      ? 'bg-slate-100 border-slate-300 text-slate-500'
                                      : 'bg-emerald-100 border-emerald-400 text-emerald-700'
                                  }`}
                                >
                                  {log.stepIndex !== undefined ? log.stepIndex : idx}
                                </div>

                                <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      {renderStepIcon(log.type)}
                                      <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                                        {log.type || log.status}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                                          isFailed
                                            ? 'bg-rose-100 text-rose-700'
                                            : isDigest
                                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                            : isSkipped
                                            ? 'bg-slate-200 text-slate-700'
                                            : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                      >
                                        {log.status}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>

                                  <p className="text-slate-600 text-xs">{log.message}</p>

                                  {log.recipient && (
                                    <p className="text-[11px] font-mono text-slate-500">Recipient: {log.recipient}</p>
                                  )}

                                  {log.error && (
                                    <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 font-mono text-[11px] mt-1">
                                      {log.error}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
