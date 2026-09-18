import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  GitFork, Plus, Search, Trash2, Edit3, History,
  CheckCircle2, Clock, Mail, MessageSquare, Globe, Bell, RefreshCw, X
} from 'lucide-react';
import { WorkflowBuilder } from './WorkflowBuilder';
import { WorkflowRunHistory } from './WorkflowRunHistory';

interface WorkflowsTabProps {
  projectId: string;
}

export const WorkflowsTab: React.FC<WorkflowsTabProps> = ({ projectId }) => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Selected Workflow for Builder & History
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [historyWorkflowId, setHistoryWorkflowId] = useState<string | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTriggerId, setNewTriggerId] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, [projectId]);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/v1/workflows', {
        headers: { 'x-project-id': projectId },
      });
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Failed to fetch workflows', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newTriggerId.trim()) return;

    setCreating(true);
    try {
      const defaultSteps = [
        { type: 'email', subject: 'Welcome!', body: 'Hello {{subscriber.firstName}}!' },
        { type: 'delay', duration: 24, unit: 'hours' },
        { type: 'sms', body: 'Did you get our welcome email?' },
      ];

      const { data } = await api.post(
        '/v1/workflows',
        {
          name: newName.trim(),
          triggerIdentifier: newTriggerId.trim(),
          description: newDesc.trim() || undefined,
          steps: defaultSteps,
        },
        { headers: { 'x-project-id': projectId } }
      );

      setNewName('');
      setNewTriggerId('');
      setNewDesc('');
      setIsCreateModalOpen(false);
      fetchWorkflows();

      // Immediately open builder for newly created workflow!
      if (data.workflow?.id) {
        setActiveWorkflowId(data.workflow.id);
      }
    } catch (error: any) {
      console.error('Failed to create workflow', error);
      alert(error.response?.data?.error || 'Failed to create workflow.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWorkflow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this workflow and all execution logs?')) return;

    try {
      await api.delete(`/v1/workflows/${id}`, {
        headers: { 'x-project-id': projectId },
      });
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to delete workflow', error);
    }
  };

  const renderStepBadges = (stepsJson: any) => {
    const steps = (stepsJson as any[]) || [];
    if (steps.length === 0) {
      return <span className="text-[11px] text-slate-400 italic">No steps defined</span>;
    }

    return (
      <div className="flex items-center space-x-1 overflow-x-auto max-w-xs">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-700 flex items-center space-x-1">
              {s.type === 'email' && <Mail size={10} className="text-blue-500" />}
              {s.type === 'sms' && <MessageSquare size={10} className="text-emerald-500" />}
              {s.type === 'delay' && <Clock size={10} className="text-amber-500" />}
              {s.type === 'in_app' && <Bell size={10} className="text-purple-500" />}
              {s.type === 'webhook' && <Globe size={10} className="text-indigo-500" />}
              <span>{s.type}</span>
            </span>
            {i < steps.length - 1 && <span className="text-slate-300 text-[10px]">→</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // IF WORKFLOW BUILDER IS OPEN
  if (activeWorkflowId) {
    return (
      <WorkflowBuilder
        workflowId={activeWorkflowId}
        projectId={projectId}
        onBack={() => {
          setActiveWorkflowId(null);
          fetchWorkflows();
        }}
        onSaveSuccess={fetchWorkflows}
      />
    );
  }

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.triggerIdentifier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Workflow Orchestrator & Automation Pipelines
          </h3>
          <p className="text-xs text-slate-500">
            Build multi-step notification sequences with delay steps, preference checks, and real-time triggers.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center space-x-2 text-white bg-violet-600 hover:bg-violet-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={15} />
          <span>Create Workflow</span>
        </button>
      </div>

      {/* Toolbar & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search workflows by name or trigger identifier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-violet-500"
          />
        </div>

        <button
          onClick={fetchWorkflows}
          className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center space-x-1"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Workflow Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Workflow Name</th>
              <th className="px-6 py-3">Trigger Identifier</th>
              <th className="px-6 py-3">Sequence Steps</th>
              <th className="px-6 py-3">Total Executions</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && workflows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading workflow automations...
                </td>
              </tr>
            ) : filteredWorkflows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                  <GitFork size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No Workflows Configured Yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Create your first workflow to trigger multi-step notifications on events like `user-signup`.
                  </p>
                </td>
              </tr>
            ) : (
              filteredWorkflows.map((wf) => (
                <tr
                  key={wf.id}
                  onClick={() => setActiveWorkflowId(wf.id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  {/* Name & Description */}
                  <td className="px-6 py-4">
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{wf.name}</span>
                      {wf.description && <span className="text-[11px] text-slate-400 truncate max-w-xs block">{wf.description}</span>}
                    </div>
                  </td>

                  {/* Trigger Identifier */}
                  <td className="px-6 py-4 font-mono text-xs font-semibold">
                    <span className="px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded">
                      {wf.triggerIdentifier}
                    </span>
                  </td>

                  {/* Sequence Steps Badges */}
                  <td className="px-6 py-4">{renderStepBadges(wf.steps)}</td>

                  {/* Runs Count */}
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">
                    {wf._count?.runs !== undefined ? `${wf._count.runs} runs` : '0 runs'}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {wf.active ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1 w-fit">
                        <CheckCircle2 size={10} />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 w-fit">
                        Draft
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveWorkflowId(wf.id);
                        }}
                        className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Workflow Steps"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistoryWorkflowId(wf.id);
                        }}
                        className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Execution History"
                      >
                        <History size={15} />
                      </button>

                      <button
                        onClick={(e) => handleDeleteWorkflow(wf.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Workflow"
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
      </div>

      {/* MODAL: CREATE WORKFLOW */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Workflow Automation</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Workflow Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. User Welcome Drip"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trigger Identifier * (API event key)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. user-welcome or order-created"
                  value={newTriggerId}
                  onChange={(e) => setNewTriggerId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-violet-500 text-violet-700 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Used in API requests: `POST /v1/workflows/{newTriggerId || 'trigger-key'}/trigger`
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Triggered when a user signs up to onboard them over 3 days"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-violet-600 text-white font-semibold text-xs rounded-lg hover:bg-violet-700"
                >
                  {creating ? 'Creating...' : 'Create & Open Builder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RUN HISTORY DRAWER */}
      {historyWorkflowId && (
        <WorkflowRunHistory
          workflowId={historyWorkflowId}
          projectId={projectId}
          isOpen={true}
          onClose={() => setHistoryWorkflowId(null)}
        />
      )}
    </div>
  );
};
