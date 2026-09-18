import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ArrowLeft, Save, Trash2, ArrowUp, ArrowDown, Mail, MessageSquare,
  Globe, Bell, Clock, PlayCircle, Check, History, Zap, X, Layers
} from 'lucide-react';
import { WorkflowRunHistory } from './WorkflowRunHistory';

interface WorkflowBuilderProps {
  workflowId: string;
  projectId: string;
  onBack: () => void;
  onSaveSuccess?: () => void;
}

export interface WorkflowStep {
  type: 'email' | 'sms' | 'in_app' | 'webhook' | 'delay' | 'digest';
  templateId?: string;
  subject?: string;
  body?: string;
  topicKey?: string;
  duration?: number;
  unit?: 'seconds' | 'minutes' | 'hours' | 'days';
  delayMs?: number;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflowId,
  projectId,
  onBack,
  onSaveSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);

  // Workflow Form State
  const [name, setName] = useState('');
  const [triggerIdentifier, setTriggerIdentifier] = useState('');
  const [active, setActive] = useState(true);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Test Trigger Form
  const [testSubscriberId, setTestSubscriberId] = useState('usr_test_100');
  const [testEmail, setTestEmail] = useState('user@example.com');
  const [testPayloadJson, setTestPayloadJson] = useState('{\n  "name": "Alex",\n  "orderId": "#9921"\n}');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    fetchWorkflowDetails();
    fetchTemplates();
  }, [workflowId, projectId]);

  const fetchWorkflowDetails = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/v1/workflows/${workflowId}`, {
        headers: { 'x-project-id': projectId },
      });
      const wf = data.workflow;
      setName(wf.name || '');
      setTriggerIdentifier(wf.triggerIdentifier || '');
      setActive(wf.active ?? true);
      setSteps((wf.steps as WorkflowStep[]) || []);
    } catch (error) {
      console.error('Failed to fetch workflow details', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}/templates`);
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates', error);
    }
  };

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      await api.put(
        `/v1/workflows/${workflowId}`,
        {
          name,
          triggerIdentifier,
          active,
          steps,
        },
        { headers: { 'x-project-id': projectId } }
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error('Failed to save workflow', error);
      alert('Failed to save workflow. Please check your parameters.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStep = (type: WorkflowStep['type']) => {
    let newStep: WorkflowStep;
    if (type === 'delay') {
      newStep = { type: 'delay', duration: 5, unit: 'seconds' };
    } else if (type === 'digest') {
      newStep = { type: 'digest', duration: 1, unit: 'hours' };
    } else {
      newStep = { type, subject: '', body: '', topicKey: '' };
    }

    setSteps((prev) => [...prev, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...steps];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSteps(updated);
  };

  const handleStepChange = (index: number, field: keyof WorkflowStep, value: any) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleExecuteTestTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(testPayloadJson);
      } catch {
        parsedPayload = {};
      }

      const { data } = await api.post(
        `/v1/workflows/${triggerIdentifier}/trigger`,
        {
          subscriberId: testSubscriberId,
          email: testEmail,
          payload: parsedPayload,
        },
        { headers: { 'x-project-id': projectId } }
      );

      setTestResult(data);
    } catch (error: any) {
      console.error('Failed to trigger workflow', error);
      setTestResult({ error: error.response?.data?.error || error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail size={16} className="text-blue-600" />;
      case 'sms':
        return <MessageSquare size={16} className="text-emerald-600" />;
      case 'in_app':
        return <Bell size={16} className="text-purple-600" />;
      case 'webhook':
        return <Globe size={16} className="text-indigo-600" />;
      case 'delay':
        return <Clock size={16} className="text-amber-600" />;
      case 'digest':
        return <Layers size={16} className="text-indigo-600" />;
      default:
        return <Zap size={16} className="text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Loading Workflow Builder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Action & Navigation Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to Workflows"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workflow Name (e.g. User Welcome Drip)"
              className="text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-violet-600 focus:outline-none bg-transparent px-1 py-0.5"
            />
            <div className="flex items-center space-x-2 mt-0.5 px-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Trigger Identifier:</span>
              <input
                type="text"
                value={triggerIdentifier}
                onChange={(e) => setTriggerIdentifier(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="user-welcome"
                className="text-xs font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Side Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {/* Active Switch */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
            <span>Status:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
            <span className={active ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
              {active ? 'Active' : 'Draft'}
            </span>
          </div>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <History size={14} className="text-violet-600" />
            <span>Run History</span>
          </button>

          <button
            onClick={() => setIsTestModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <PlayCircle size={14} />
            <span>Test Trigger</span>
          </button>

          <button
            onClick={handleSaveWorkflow}
            disabled={isSaving}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Save size={14} />
            <span>{isSaving ? 'Saving...' : 'Save Workflow'}</span>
          </button>

          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
              <Check size={14} />
              <span>Saved!</span>
            </span>
          )}
        </div>
      </div>

      {/* Vertical Timeline Step Builder */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
        
        {/* Trigger Badge (Step 0 Anchor) */}
        <div className="relative flex items-center space-x-3">
          <div className="absolute -left-6 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
            <Zap size={12} className="fill-white" />
          </div>

          <div className="bg-gradient-to-r from-violet-50 to-slate-50 border border-violet-200 p-4 rounded-xl shadow-sm flex-1 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Workflow Trigger Event</span>
              <h4 className="text-sm font-bold text-slate-900">
                Triggered via API Event: <code className="font-mono text-violet-600 bg-white px-1.5 py-0.5 rounded border border-violet-200">{triggerIdentifier || 'trigger-key'}</code>
              </h4>
            </div>
            <span className="text-xs font-semibold text-slate-400">Step 0</span>
          </div>
        </div>

        {/* Steps Cards */}
        {steps.length === 0 ? (
          <div className="ml-2 p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
            <Clock size={28} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No Sequence Steps Added Yet</p>
            <p className="text-[11px] text-slate-500">
              Click the "Add Step" menu below to build your notification or delay pipeline.
            </p>
          </div>
        ) : (
          steps.map((step, idx) => (
            <div key={idx} className="relative flex items-start space-x-3">
              
              {/* Step Sequence Badge */}
              <div className="absolute -left-6 top-4 w-6 h-6 rounded-full bg-white border-2 border-slate-300 text-slate-700 flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                {idx + 1}
              </div>

              {/* Step Card */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden transition-all hover:border-slate-300">
                
                {/* Step Card Header */}
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                      {getStepIcon(step.type)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Step {idx + 1}: {step.type.replace('_', ' ')}
                      </span>
                      <span className="ml-2 text-[10px] text-slate-400 font-mono">
                        {step.type === 'delay' || step.type === 'digest'
                          ? `${step.duration || 0} ${step.unit || (step.type === 'digest' ? 'hours' : 'seconds')}`
                          : step.templateId || 'Custom Content'}
                      </span>
                    </div>
                  </div>

                  {/* Move & Delete Step Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleMoveStep(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-white rounded"
                      title="Move Up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveStep(idx, 'down')}
                      disabled={idx === steps.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-white rounded"
                      title="Move Down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Delete Step"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Step Configuration Body */}
                <div className="p-4 space-y-4">
                  
                  {/* DELAY & DIGEST CONFIGURATION */}
                  {step.type === 'delay' || step.type === 'digest' ? (
                    <div className="space-y-3">
                      {step.type === 'digest' && (
                        <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg flex items-center space-x-2.5 text-xs text-indigo-900">
                          <Layers size={18} className="text-indigo-600 flex-shrink-0" />
                          <p className="text-[11px]">
                            <strong>Digest Batching Window:</strong> Aggregates incoming events for this subscriber over the specified duration into an <code>events</code> array payload before triggering subsequent steps.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {step.type === 'digest' ? 'Batching Window Duration' : 'Delay Duration'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={step.duration || (step.type === 'digest' ? 1 : 5)}
                            onChange={(e) => handleStepChange(idx, 'duration', parseInt(e.target.value) || 1)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Time Unit</label>
                          <select
                            value={step.unit || (step.type === 'digest' ? 'hours' : 'seconds')}
                            onChange={(e) => handleStepChange(idx, 'unit', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-medium"
                          >
                            <option value="seconds">Seconds</option>
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* NOTIFICATION STEP CONFIGURATION (email, sms, in_app, webhook) */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Use Saved Template (Optional)</label>
                          <select
                            value={step.templateId || ''}
                            onChange={(e) => handleStepChange(idx, 'templateId', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-medium"
                          >
                            <option value="">-- Direct Inline Content --</option>
                            {templates
                              .filter((t) => t.channel === step.type || step.type === 'webhook' || step.type === 'in_app')
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name} ({t.channel})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Topic Category Key (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. security_alerts"
                            value={step.topicKey || ''}
                            onChange={(e) => handleStepChange(idx, 'topicKey', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Inline Subject & Body if template is not chosen */}
                      {!step.templateId && (
                        <div className="space-y-3 pt-1 border-t border-slate-100">
                          {step.type === 'email' && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Line</label>
                              <input
                                type="text"
                                placeholder="Welcome to EventMesh, {{subscriber.firstName}}!"
                                value={step.subject || ''}
                                onChange={(e) => handleStepChange(idx, 'subject', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body (Handlebars HTML/Text)</label>
                            <textarea
                              rows={3}
                              placeholder="Hello {{subscriber.firstName}}, your order {{orderId}} is confirmed!"
                              value={step.body || ''}
                              onChange={(e) => handleStepChange(idx, 'body', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-violet-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Add Step Action Bar */}
        <div className="pt-2 flex justify-center">
          <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 px-2 uppercase tracking-wider">Add Step:</span>

            <button
              onClick={() => handleAddStep('email')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors border border-blue-200"
            >
              <Mail size={14} />
              <span>Email</span>
            </button>

            <button
              onClick={() => handleAddStep('sms')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors border border-emerald-200"
            >
              <MessageSquare size={14} />
              <span>SMS</span>
            </button>

            <button
              onClick={() => handleAddStep('delay')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg transition-colors border border-amber-200"
            >
              <Clock size={14} />
              <span>Delay</span>
            </button>

            <button
              onClick={() => handleAddStep('digest')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-200"
            >
              <Layers size={14} />
              <span>Digest</span>
            </button>

            <button
              onClick={() => handleAddStep('in_app')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg transition-colors border border-purple-200"
            >
              <Bell size={14} />
              <span>In-App</span>
            </button>

            <button
              onClick={() => handleAddStep('webhook')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-200"
            >
              <Globe size={14} />
              <span>Webhook</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: TEST TRIGGER WORKFLOW */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Trigger Test Execution</h3>
                <p className="text-xs text-slate-500">Fire workflow `{triggerIdentifier}` in real-time.</p>
              </div>
              <button onClick={() => setIsTestModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExecuteTestTrigger} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subscriber ID *</label>
                <input
                  type="text"
                  required
                  value={testSubscriberId}
                  onChange={(e) => setTestSubscriberId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test Email Address</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payload JSON (Context variables)</label>
                <textarea
                  rows={4}
                  value={testPayloadJson}
                  onChange={(e) => setTestPayloadJson(e.target.value)}
                  className="w-full bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-4 py-2 bg-violet-600 text-white font-medium text-xs rounded-lg hover:bg-violet-700 shadow-sm flex items-center space-x-2"
                >
                  <PlayCircle size={14} />
                  <span>{isTesting ? 'Triggering...' : 'Fire Workflow'}</span>
                </button>
              </div>
            </form>

            {testResult && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-slate-800">Response Output:</span>
                <pre className="p-2 bg-slate-900 text-emerald-400 rounded font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DRAWER: WORKFLOW RUN HISTORY */}
      <WorkflowRunHistory
        workflowId={workflowId}
        projectId={projectId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};
