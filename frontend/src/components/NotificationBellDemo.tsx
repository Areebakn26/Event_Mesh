import React, { useState } from 'react';
import { NotificationBell } from './NotificationBell';
import { Send, Zap } from 'lucide-react';
import api from '../services/api';

interface NotificationBellDemoProps {
  projectId: string;
}

export const NotificationBellDemo: React.FC<NotificationBellDemoProps> = ({ projectId }) => {
  const [subscriberId, setSubscriberId] = useState('usr_demo_100');
  const [title, setTitle] = useState('New In-App Alert');
  const [body, setBody] = useState('Your order #9921 has shipped successfully!');
  const [sending, setSending] = useState(false);

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // Trigger notification via /v1/notify with in_app channel
      await api.post(
        '/v1/notify',
        {
          subscriberId,
          channels: ['in_app'],
          recipient: { subscriberId },
          data: { title, body },
        },
        { headers: { 'x-project-id': projectId } }
      );
      setTitle('');
      setBody('');
    } catch (error) {
      console.error('Failed to send test in-app message', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Embeddable Notification Bell</h3>
            <p className="text-xs text-slate-500">Real-time SSE in-app notifications component</p>
          </div>
        </div>

        {/* Embedded Bell Component */}
        <NotificationBell subscriberId={subscriberId} projectId={projectId} />
      </div>

      <form onSubmit={handleSendTestMessage} className="space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Send Test Message Down Stream</h4>
        
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subscriber ID</label>
          <input
            type="text"
            value={subscriberId}
            onChange={(e) => setSubscriberId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notification Title</label>
          <input
            type="text"
            placeholder="Security Alert"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Message Body</label>
          <textarea
            rows={2}
            placeholder="New login detected from Chrome on Windows"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
            required
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center space-x-2"
        >
          <Send size={14} />
          <span>{sending ? 'Broadcasting...' : 'Broadcast Live In-App Message'}</span>
        </button>
      </form>
    </div>
  );
};
