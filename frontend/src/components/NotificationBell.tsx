import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Bell, CheckCheck, RefreshCw, X, MessageSquare, Info, Sparkles
} from 'lucide-react';

interface NotificationBellProps {
  subscriberId: string;
  projectId: string;
  className?: string;
}

interface InAppMessage {
  id: string;
  title: string;
  body: string;
  read: boolean;
  readAt?: string;
  data?: any;
  createdAt: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  subscriberId,
  projectId,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<InAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [hasNewPulse, setHasNewPulse] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  const baseURL = 'http://localhost:4000';

  // 1. Fetch initial unread count & message list
  const fetchMessagesAndCount = async () => {
    if (!subscriberId) return;
    setLoading(true);
    try {
      const [countRes, msgRes] = await Promise.all([
        axios.get(`${baseURL}/v1/inapp/unread-count`, {
          params: { subscriberId },
          headers: { 'x-project-id': projectId },
        }),
        axios.get(`${baseURL}/v1/inapp`, {
          params: { subscriberId, limit: 25 },
          headers: { 'x-project-id': projectId },
        }),
      ]);

      setUnreadCount(countRes.data.unreadCount || 0);
      setMessages(msgRes.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch in-app notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessagesAndCount();
  }, [subscriberId, projectId]);

  // 2. Real-Time SSE Integration (Live EventSource stream)
  useEffect(() => {
    if (!subscriberId) return;

    const sseUrl = `${baseURL}/v1/inapp/stream?subscriberId=${encodeURIComponent(subscriberId)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    // Listen for custom "in_app_message" SSE event dispatched from backend
    eventSource.addEventListener('in_app_message', (event: MessageEvent) => {
      try {
        const newMessage: InAppMessage = JSON.parse(event.data);

        // Prepend new message to top of list & increment unread count
        setMessages((prev) => [newMessage, ...prev.filter((m) => m.id !== newMessage.id)]);
        setUnreadCount((prev) => prev + 1);

        // Trigger bell pulse animation
        setHasNewPulse(true);
        setTimeout(() => setHasNewPulse(false), 3000);
      } catch (err) {
        console.error('Failed to parse incoming SSE in-app message', err);
      }
    });

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    // Clean disconnect on unmount
    return () => {
      setSseConnected(false);
      eventSource.close();
    };
  }, [subscriberId]);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark single message as read
  const handleMarkAsRead = async (messageId: string, isRead: boolean) => {
    if (isRead) return;

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, read: true, readAt: new Date().toISOString() } : m))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await axios.patch(
        `${baseURL}/v1/inapp/${messageId}/read`,
        {},
        { headers: { 'x-project-id': projectId } }
      );
    } catch (error) {
      console.error('Failed to mark message as read', error);
      fetchMessagesAndCount();
    }
  };

  // Mark ALL as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic update
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
    setUnreadCount(0);

    try {
      await axios.patch(
        `${baseURL}/v1/inapp/read-all`,
        { subscriberId },
        { headers: { 'x-project-id': projectId } }
      );
    } catch (error) {
      console.error('Failed to mark all messages as read', error);
      fetchMessagesAndCount();
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-all active:scale-95 border border-slate-200 shadow-xs ${
          hasNewPulse ? 'animate-bounce' : ''
        }`}
        title={`Notifications (${unreadCount} unread)`}
      >
        <Bell size={18} className={unreadCount > 0 ? 'text-violet-600 fill-violet-50' : 'text-slate-600'} />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in-75">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Live SSE Pulse Dot */}
        {sseConnected && (
          <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
        )}
      </button>

      {/* Popover Message Center Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Popover Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">In-App Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="text-[11px] font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-40 flex items-center space-x-1 px-2 py-1 rounded hover:bg-violet-50 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck size={13} />
                <span>Read All</span>
              </button>

              <button
                type="button"
                onClick={fetchMessagesAndCount}
                className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && messages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageSquare size={28} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-700">No Notifications Yet</p>
                <p className="text-[11px] text-slate-400">
                  Messages dispatched via workflows or in-app stream will appear here.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleMarkAsRead(msg.id, msg.read)}
                  className={`p-4 cursor-pointer transition-colors flex items-start space-x-3 ${
                    msg.read ? 'bg-white hover:bg-slate-50/80' : 'bg-violet-50/40 hover:bg-violet-50/70 border-l-2 border-violet-600'
                  }`}
                >
                  {/* Icon / Unread Dot */}
                  <div className="mt-0.5 flex-shrink-0">
                    {!msg.read ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-violet-600 ring-4 ring-violet-100"></div>
                    ) : (
                      <Info size={14} className="text-slate-300" />
                    )}
                  </div>

                  {/* Message Details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold ${msg.read ? 'text-slate-800' : 'text-slate-900 font-extrabold'}`}>
                        {msg.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-2">
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{msg.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center space-x-1">
              <Sparkles size={11} className="text-violet-500" />
              <span>Real-time SSE Active</span>
            </span>
            <span>Sub: {subscriberId}</span>
          </div>
        </div>
      )}
    </div>
  );
};
