import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Bell, Globe as GlobeIcon, CheckCircle2, Zap, Radio } from 'lucide-react';
import { World } from './ui/globe';
import type { GlobeConfig } from './ui/globe';

export const EventMeshAceternityGlobe: React.FC = () => {
  const [activeMessage, setActiveMessage] = useState(0);

  const globeConfig: GlobeConfig = {
    pointSize: 4,
    globeColor: '#0b0f19',
    showAtmosphere: true,
    atmosphereColor: '#7342E2',
    atmosphereAltitude: 0.15,
    polygonColor: 'rgba(255,255,255,0.7)',
    emissive: '#000000',
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    initialCoordinates: { lat: 37.7749, lng: -122.4194 },
    autoRotate: true,
    autoRotateSpeed: 1.2,
  };

  const sampleArcs = [
    {
      order: 1,
      startLat: 37.7749,
      startLng: -122.4194,
      endLat: 51.5074,
      endLng: -0.1278,
      arcAlt: 0.2,
      color: '#7342E2',
    },
    {
      order: 2,
      startLat: 37.7749,
      startLng: -122.4194,
      endLat: 35.6762,
      endLng: 139.6503,
      arcAlt: 0.3,
      color: '#38bdf8',
    },
    {
      order: 3,
      startLat: 37.7749,
      startLng: -122.4194,
      endLat: 50.1109,
      endLng: 8.6821,
      arcAlt: 0.25,
      color: '#34d399',
    },
    {
      order: 4,
      startLat: 37.7749,
      startLng: -122.4194,
      endLat: -23.5505,
      endLng: -46.6333,
      arcAlt: 0.35,
      color: '#818cf8',
    },
  ];

  const messages = [
    {
      channel: 'Email',
      icon: Mail,
      color: 'text-sky-400 bg-sky-500/20 border-sky-500/30',
      location: 'London, UK (eu-west-1)',
      title: 'Order Confirmation Email',
      template: 'Subject: Order #1049 Confirmed for Faizan',
      status: 'Sent via SMTP',
    },
    {
      channel: 'SMS',
      icon: MessageSquare,
      color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      location: 'Tokyo, Japan (ap-northeast-1)',
      title: '2FA Auth SMS',
      template: 'Your EventMesh code is: 991823',
      status: 'Sent via Twilio',
    },
    {
      channel: 'In-App',
      icon: Bell,
      color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      location: 'San Francisco, US (us-west-1)',
      title: 'In-App Bell Alert',
      template: 'Faizan mentioned you in #project-mesh',
      status: 'Delivered in-app',
    },
    {
      channel: 'Webhook',
      icon: GlobeIcon,
      color: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
      location: 'Frankfurt, DE (eu-central-1)',
      title: 'HTTP Webhook Callback',
      template: 'POST https://api.client.com/webhook (200 OK)',
      status: 'Callback 200 OK',
    },
  ];

  // Rotate through active notification popovers every 3.2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveMessage(prev => (prev + 1) % messages.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [messages.length]);

  const currentMsg = messages[activeMessage];
  const IconComponent = currentMsg.icon;

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-10 shadow-2xl overflow-hidden relative text-slate-100 font-sans">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7342E2]/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 relative z-10 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 font-bold uppercase tracking-widest mb-1">
            <Zap size={14} className="fill-purple-400" />
            <span>Aceternity UI 3D World Globe</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Global Multi-Channel Message Trajectories
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <Radio size={12} className="animate-pulse text-emerald-400" />
          <span>Real-Time Stream Active</span>
        </div>
      </div>

      {/* Main 3D Aceternity World Globe & Message Popovers */}
      <div className="relative min-h-[500px] flex items-center justify-center relative z-10">
        
        {/* Aceternity 3D World Globe Canvas Container */}
        <div className="w-full max-w-[550px] aspect-square relative flex items-center justify-center mx-auto">
          <World globeConfig={globeConfig} data={sampleArcs} />
        </div>

        {/* Live Active Notification Message Popover (Rotating) */}
        <motion.div
          key={activeMessage}
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -15 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-6 right-2 sm:right-10 bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl shadow-2xl max-w-sm w-full space-y-3 z-20 pointer-events-none"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${currentMsg.color}`}>
                <IconComponent size={14} />
              </div>
              <span className="text-xs font-bold text-white">{currentMsg.channel} Template</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 size={10} />
              <span>{currentMsg.status}</span>
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-white">{currentMsg.title}</p>
            <p className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
              {currentMsg.template}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Location: {currentMsg.location}</span>
            <span className="text-purple-400 font-bold">Latency: 28ms</span>
          </div>
        </motion.div>

        {/* Left Secondary Floating Node Badge */}
        <div className="absolute bottom-6 left-2 sm:left-8 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-lg text-xs font-mono text-slate-300 hidden sm:flex items-center space-x-3 pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-[#7342E2] animate-ping"></div>
          <div>
            <p className="text-[11px] font-bold text-white">EventMesh Core Origin</p>
            <p className="text-[10px] text-slate-400">Dispatching to 5 Global Regions</p>
          </div>
        </div>

      </div>
    </div>
  );
};
