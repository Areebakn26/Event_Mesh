import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, Mail, MessageSquare, Bell, CheckCircle2, Play, ChevronRight, Layers, FileCode } from 'lucide-react';

export const NovuExactWorkflowHero: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'in_app' | 'email' | 'sms'>('in_app');

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl overflow-hidden relative text-slate-100 font-sans">
      
      {/* Background Ambient Gradient Glows */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#7342E2]/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2"></div>

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 relative z-10 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7342E2] to-indigo-600 flex items-center justify-center shadow-lg">
            <Zap size={16} className="text-white fill-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">EventMesh Workflow Studio</h3>
            <p className="text-xs text-slate-400 font-mono">Visual Node Builder & Multi-Channel Preview</p>
          </div>
        </div>

        {/* Channel Preview Tabs (In-App, Email, SMS) */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-full p-1 text-xs font-medium">
          <button
            onClick={() => setActiveTab('in_app')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'in_app' ? 'bg-[#7342E2] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell size={12} />
            <span>In-App Inbox</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'email' ? 'bg-[#7342E2] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail size={12} />
            <span>Email</span>
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'sms' ? 'bg-[#7342E2] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare size={12} />
            <span>SMS</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Visual Node Builder Graph (Novu Exact Pattern) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative min-h-[380px] flex flex-col justify-between shadow-inner">
          
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-4 border-b border-slate-800">
            <span className="flex items-center space-x-2">
              <Layers size={14} className="text-indigo-400" />
              <span>Workflow Sequence: "order-confirmation"</span>
            </span>
            <span className="text-emerald-400 font-bold flex items-center space-x-1">
              <Play size={10} className="fill-emerald-400" />
              <span>Active Workflow</span>
            </span>
          </div>

          {/* SVG Animated Curved Wires */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="wireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7342E2" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Wire 1: Trigger -> Digest */}
            <motion.path 
              d="M 140 120 L 260 120" 
              stroke="url(#wireGrad)" 
              strokeWidth="2" 
              strokeDasharray="4,4"
              initial={{ strokeDashoffset: 40 }}
              animate={{ strokeDashoffset: [40, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />

            {/* Wire 2: Digest -> Steps */}
            <motion.path 
              d="M 380 120 L 460 120" 
              stroke="url(#wireGrad)" 
              strokeWidth="2" 
              strokeDasharray="4,4"
              initial={{ strokeDashoffset: 40 }}
              animate={{ strokeDashoffset: [40, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear', delay: 0.2 }}
            />
          </svg>

          {/* Node Cards Row */}
          <div className="grid grid-cols-3 gap-3 my-auto relative z-10">
            
            {/* Node 1: Trigger */}
            <div className="bg-slate-950 border border-[#7342E2]/60 rounded-xl p-3.5 space-y-2 shadow-[0_0_15px_rgba(115,66,226,0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">Trigger</span>
                <Zap size={12} className="text-purple-400 fill-purple-400" />
              </div>
              <p className="text-xs font-bold text-white truncate">order_created</p>
              <p className="text-[10px] font-mono text-slate-400">SDK API Event</p>
            </div>

            {/* Node 2: Digest / Delay */}
            <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-3.5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Digest</span>
                <Clock size={12} className="text-amber-400" />
              </div>
              <p className="text-xs font-bold text-white truncate">5 min window</p>
              <p className="text-[10px] font-mono text-slate-400">Batch Events</p>
            </div>

            {/* Node 3: Multi-Channel Dispatch */}
            <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3.5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Channels</span>
                <CheckCircle2 size={12} className="text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-white truncate">In-App + Email</p>
              <p className="text-[10px] font-mono text-slate-400">Parallel Send</p>
            </div>

          </div>

          {/* Bottom Payload Context Box */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center space-x-1.5">
              <FileCode size={13} className="text-slate-400" />
              <span>Payload: <code className="text-amber-300">&#123; name: "Faizan", orderId: "#1049" &#125;</code></span>
            </span>
            <span className="text-emerald-400 font-bold">200 OK</span>
          </div>

        </div>

        {/* Right Column: Live Interactive Notification Preview (Novu Switcher) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          
          {/* Active Tab Preview Box */}
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
          >
            {/* IN-APP INBOX PREVIEW */}
            {activeTab === 'in_app' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Bell size={16} className="text-[#7342E2]" />
                    <span>In-App Notification Center</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#7342E2]"></span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md">
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-full bg-[#7342E2] flex items-center justify-center text-white font-bold text-xs shadow-md">
                      EM
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">EventMesh Order Service</span>
                        <span className="text-[10px] text-slate-500 font-mono">Just now</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Hey <span className="text-indigo-400 font-bold">Faizan</span>! Your order <span className="font-mono text-amber-300">#1049</span> has been processed successfully.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg bg-[#7342E2] hover:bg-indigo-600 transition-colors flex items-center space-x-1">
                      <span>View Order</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* EMAIL TEMPLATE PREVIEW */}
            {activeTab === 'email' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Mail size={16} className="text-sky-400" />
                    <span>Email Template Preview</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">SMTP Ready</span>
                </div>

                <div className="bg-white text-slate-900 rounded-xl p-5 space-y-3 font-sans shadow-md">
                  <div className="text-xs font-mono text-slate-400 border-b pb-2">
                    Subject: Order Confirmation for Faizan (#1049)
                  </div>
                  <h4 className="font-bold text-base text-slate-900">Thank you for your order!</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hello <strong>Faizan</strong>, we have received your payment for order <code>#1049</code>. Your items are currently being prepared for shipping.
                  </p>
                  <div className="pt-2">
                    <span className="inline-block bg-[#7342E2] text-white text-xs font-semibold px-4 py-2 rounded-lg">
                      Track Package
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SMS PREVIEW */}
            {activeTab === 'sms' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <MessageSquare size={16} className="text-emerald-400" />
                    <span>SMS Phone Preview</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Twilio Sent</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-none p-3.5 text-xs ml-auto max-w-[240px] shadow-md">
                    EventMesh: Hello Faizan! Your order #1049 is confirmed. Track live: https://ems.link/1049
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono text-right pr-1">Delivered • SMS</p>
                </div>
              </div>
            )}

          </motion.div>
        </div>

      </div>
    </div>
  );
};
