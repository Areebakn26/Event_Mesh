import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Eye, FileText, CheckCircle } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
  placeholders: string[];
  createdAt: string;
}

interface TemplatesTabProps {
  projectId: string;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({ projectId }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sampleDataJson, setSampleDataJson] = useState('{\n  "name": "Faizan",\n  "orderId": "#1049"\n}');
  const [previewOutput, setPreviewOutput] = useState('');

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/projects/${projectId}/templates`);
      setTemplates(data.templates);
    } catch (error) {
      console.error('Failed to fetch templates', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchTemplates();
  }, [projectId]);

  // Live Template Preview Compiler
  useEffect(() => {
    try {
      const parsedData = JSON.parse(sampleDataJson);
      let compiled = body;
      Object.keys(parsedData).forEach(key => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        compiled = compiled.replace(regex, parsedData[key]);
      });
      setPreviewOutput(compiled);
    } catch {
      setPreviewOutput(body);
    }
  }, [body, sampleDataJson]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setName('');
    setChannel('email');
    setSubject('Welcome {{name}}!');
    setBody('Hello {{name}}, thank you for joining us! Your order ID is {{orderId}}.');
    setShowModal(true);
  };

  const handleOpenEdit = (t: Template) => {
    setEditingTemplate(t);
    setName(t.name);
    setChannel(t.channel);
    setSubject(t.subject || '');
    setBody(t.body);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate.id}`, { name, channel, subject, body });
      } else {
        await api.post(`/projects/${projectId}/templates`, { name, channel, subject, body });
      }
      setShowModal(false);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save template', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Message Templates</h3>
          <p className="text-sm opacity-70">Define reusable email, SMS, and webhook notification templates with Handlebars placeholders.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 text-white font-medium px-4 py-2 rounded-lg transition-transform active:scale-95 shadow-sm text-sm"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          <Plus size={16} />
          <span>New Template</span>
        </button>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="text-center py-12 opacity-50">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white/50 border border-[#192837]/10 rounded-2xl p-12 text-center space-y-3">
          <FileText size={32} className="mx-auto opacity-30" />
          <h4 className="text-base font-semibold">No templates created yet</h4>
          <p className="text-sm opacity-70 max-w-sm mx-auto">Templates allow you to separate message copy from your API code using placeholders like {"{{name}}"}.</p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-2 text-white text-xs font-medium px-3 py-1.5 rounded-md mt-2"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <Plus size={14} />
            <span>Create First Template</span>
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white border border-[#192837]/10 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 opacity-80 mr-2">{t.channel}</span>
                    <span className="font-bold text-base">{t.name}</span>
                  </div>
                  <div className="flex space-x-1">
                    <button onClick={() => handleOpenEdit(t)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-rose-50 rounded text-rose-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {t.subject && (
                  <p className="text-xs font-mono bg-slate-50 p-2 rounded border border-slate-100 truncate">
                    <span className="font-semibold text-slate-400">Subject:</span> {t.subject}
                  </p>
                )}

                <p className="text-xs text-slate-600 line-clamp-3 font-mono bg-slate-50/50 p-2 rounded border border-slate-100">
                  {t.body}
                </p>
              </div>

              {/* Detected Placeholders */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Variables:</span>
                  {t.placeholders.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">None</span>
                  ) : (
                    t.placeholders.map(ph => (
                      <span key={ph} className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                        {`{{${ph}}}`}
                      </span>
                    ))
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">ID: {t.id.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-bold">{editingTemplate ? 'Edit Template' : 'Create New Template'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
              {/* Form Input Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Template Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Welcome Email"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={e => setChannel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>

                {channel === 'email' && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Email Subject</label>
                    <input
                      type="text"
                      placeholder="Welcome {{name}} to EventMesh"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Body Template (Handlebars)</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Hello {{name}}, your order {{orderId}} is confirmed."
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm text-white font-medium rounded-lg" style={{ backgroundColor: 'var(--color-accent)' }}>Save Template</button>
                </div>
              </div>

              {/* Live Handlebars Preview Column */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <Eye size={14} />
                    <span>Live Template Preview</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Sample Data (JSON Context):</label>
                    <textarea
                      rows={3}
                      value={sampleDataJson}
                      onChange={e => setSampleDataJson(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 space-y-2">
                    <label className="text-[11px] font-semibold text-slate-500 block">Rendered Result:</label>
                    <div className="bg-white border border-slate-200 rounded p-3 min-h-[100px] text-xs font-mono text-slate-800 whitespace-pre-wrap shadow-inner">
                      {previewOutput || <span className="text-slate-400 italic">Enter body template to see preview...</span>}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center space-x-1 pt-2 border-t">
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span>Placeholders are auto-detected and validated on save.</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
