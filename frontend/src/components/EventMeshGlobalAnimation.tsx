import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Globe, CheckCircle2, Zap } from 'lucide-react';

export const EventMeshGlobalAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 3D Interactive Rotating Earth Canvas Shader/Particle Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;

    // Generate 3D Globe Latitude/Longitude Points
    const points: { x: number; y: number; z: number }[] = [];
    const numPoints = 600;
    const radius = 130;

    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;
      points.push({
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
      });
    }

    const render = () => {
      rotation += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Render 3D Dots on Rotating Sphere
      points.forEach(p => {
        // Rotate around Y axis
        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);

        const rx = p.x * cosR - p.z * sinR;
        const rz = p.x * sinR + p.z * cosR;

        // Perspective projection
        const scale = 250 / (250 + rz);
        const px = centerX + rx * scale;
        const py = centerY + p.y * scale;

        // Depth alpha (fade back points)
        const alpha = Math.max(0.1, (rz + radius) / (2 * radius));
        const size = Math.max(1, 2 * scale);

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(115, 66, 226, ${alpha * 0.7})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-10 shadow-2xl overflow-hidden relative text-slate-100 font-sans">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7342E2]/15 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-4 mb-6 relative z-10 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-widest mb-1">
            <Zap size={14} className="fill-indigo-400" />
            <span>EventMesh Global Distribution Engine</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Real-Time Cross-Continental Message Routing
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Global Latency: &lt; 45ms</span>
        </div>
      </div>

      {/* Main 3D Globe Container & Floating Notification Popovers */}
      <div className="relative min-h-[420px] flex items-center justify-center relative z-10">
        
        {/* Canvas 3D Rotating Sphere */}
        <canvas 
          ref={canvasRef} 
          width={450} 
          height={420} 
          className="max-w-full pointer-events-none opacity-90"
        />

        {/* Global Arc Beams / Trajectories SVG Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="arc1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7342E2" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="arc2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7342E2" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Animated Arc Curve 1 (US -> Europe) */}
          <motion.path 
            d="M 120 180 Q 250 50 360 140" 
            fill="none" 
            stroke="url(#arc1)" 
            strokeWidth="2.5" 
            strokeDasharray="6,6"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: [100, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
          />

          {/* Animated Arc Curve 2 (US -> Asia) */}
          <motion.path 
            d="M 120 180 Q 220 340 380 280" 
            fill="none" 
            stroke="url(#arc2)" 
            strokeWidth="2.5" 
            strokeDasharray="6,6"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: [100, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: 0.5 }}
          />
        </svg>

        {/* Floating Zone 1: North America Server Hub (Origin) */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-12 left-4 sm:left-12 bg-slate-900/90 backdrop-blur-md border border-[#7342E2]/50 p-3.5 rounded-2xl shadow-[0_0_25px_rgba(115,66,226,0.3)] max-w-[210px] space-y-1.5"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-1">
            <span className="text-indigo-400 font-bold">us-west-1 (Origin)</span>
            <span className="text-emerald-400">Trigger</span>
          </div>
          <p className="text-xs font-bold text-white">EventMesh Core Hub</p>
          <p className="text-[10px] font-mono text-slate-400">Payload: Order #1049 Confirmed</p>
        </motion.div>

        {/* Floating Zone 2: Europe (London / Email Dispatch) */}
        <motion.div 
          animate={{ y: [-4, 4, -4] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute top-16 right-4 sm:right-16 bg-slate-900/90 backdrop-blur-md border border-sky-500/40 p-3.5 rounded-2xl shadow-xl max-w-[220px] space-y-1.5"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-1">
            <span className="text-sky-400 font-bold">eu-west-1 (London)</span>
            <span className="text-emerald-400 flex items-center space-x-1"><CheckCircle2 size={10} /><span>200 OK</span></span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <div className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Mail size={12} />
            </div>
            <span>Email Delivered</span>
          </div>
          <p className="text-[10px] font-mono text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800">
            "Welcome Faizan! Your order #1049 is active."
          </p>
        </motion.div>

        {/* Floating Zone 3: Asia Pacific (Tokyo / SMS Dispatch) */}
        <motion.div 
          animate={{ y: [4, -4, 4] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          className="absolute bottom-10 right-8 sm:right-24 bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 p-3.5 rounded-2xl shadow-xl max-w-[220px] space-y-1.5"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-1">
            <span className="text-emerald-400 font-bold">ap-northeast-1 (Tokyo)</span>
            <span className="text-emerald-400">Delivered</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare size={12} />
            </div>
            <span>SMS Delivered</span>
          </div>
          <p className="text-[10px] font-mono text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800">
            "Your login code is: 991823"
          </p>
        </motion.div>

        {/* Floating Zone 4: South America / Webhook Callback */}
        <motion.div 
          animate={{ y: [-3, 3, -3] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
          className="absolute bottom-8 left-6 sm:left-16 bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 p-3.5 rounded-2xl shadow-xl max-w-[210px] space-y-1.5"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-1">
            <span className="text-indigo-400 font-bold">sa-east-1 (São Paulo)</span>
            <span className="text-emerald-400">Webhook 200</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <div className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Globe size={12} />
            </div>
            <span>HTTP Webhook Callback</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
