import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Zap, Radio, Send } from 'lucide-react';
import { CometCard } from './ui/comet-card';

// --- DATA STRUCTURE (Point-to-Point Network, NO Central Hub) ---
export interface NetworkArc {
  id: string;
  fromName: string;
  toName: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  channel: 'Email' | 'SMS' | 'In-App' | 'Webhook';
  senderTemplate: string;
  receiverTemplate: string;
}

const networkArcsData: NetworkArc[] = [
  {
    id: 'arc-1',
    fromName: 'Tokyo, Japan',
    toName: 'London, UK',
    startLat: 35.6762,
    startLng: 139.6503,
    endLat: 51.5074,
    endLng: -0.1278,
    color: '#7342E2',
    channel: 'Email',
    senderTemplate: 'Sending: Order #1049 Confirmed',
    receiverTemplate: 'Received: SMTP Delivered (28ms)',
  },
  {
    id: 'arc-2',
    fromName: 'Sydney, Australia',
    toName: 'New York, USA',
    startLat: -33.8688,
    startLng: 151.2093,
    endLat: 40.7128,
    endLng: -74.0060,
    color: '#38bdf8',
    channel: 'SMS',
    senderTemplate: 'Sending 2FA SMS: Code 991823',
    receiverTemplate: 'Received: Twilio SMS Delivered',
  },
  {
    id: 'arc-3',
    fromName: 'Berlin, Germany',
    toName: 'Cairo, Egypt',
    startLat: 52.5200,
    startLng: 13.4050,
    endLat: 30.0444,
    endLng: 31.2357,
    color: '#34d399',
    channel: 'Webhook',
    senderTemplate: 'Triggering Webhook: POST /callback',
    receiverTemplate: 'Received: HTTP 200 OK Callback',
  },
  {
    id: 'arc-4',
    fromName: 'São Paulo, Brazil',
    toName: 'Paris, France',
    startLat: -23.5505,
    startLng: -46.6333,
    endLat: 48.8566,
    endLng: 2.3522,
    color: '#a855f7',
    channel: 'In-App',
    senderTemplate: 'Sending In-App Alert: New Mention',
    receiverTemplate: 'Received: Bell Badge Updated',
  },
];

// --- MATH: Convert Lat/Lng to 3D Cartesian Coordinates (Vector3) ---
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// --- 1. POINT-CLOUD EARTH PARTICLES SPHERE ---
const EarthPointCloud: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const count = 3600;
    const radius = 2.4;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const c1 = new THREE.Color('#7342E2');
    const c2 = new THREE.Color('#38bdf8');

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const mixed = c1.clone().lerp(c2, Math.random());
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }
    return [pos, col];
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// --- 2. INDEPENDENT 3D ARC & FLYING PACKET COMPONENT ---
const IndependentArc: React.FC<{
  arc: NetworkArc;
  isActive: boolean;
  onPacketArrived: () => void;
}> = ({ arc, isActive, onPacketArrived }) => {
  const packetRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const hasArrivedRef = useRef(false);

  const { curve, tubeGeometry, startVec, endVec } = useMemo(() => {
    const radius = 2.4;
    const start = latLngToVector3(arc.startLat, arc.startLng, radius);
    const end = latLngToVector3(arc.endLat, arc.endLng, radius);

    // Lowered 3D midpoint for tighter arc curvature
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    mid.normalize().multiplyScalar(radius + distance * 0.15);

    const curvePath = new THREE.CatmullRomCurve3([start, mid, end]);
    const geo = new THREE.TubeGeometry(curvePath, 64, 0.002, 8, false);

    return { curve: curvePath, tubeGeometry: geo, startVec: start, endVec: end };
  }, [arc]);

  // Reset animation when this arc becomes active
  useEffect(() => {
    if (isActive) {
      progressRef.current = 0;
      hasArrivedRef.current = false;
    }
  }, [isActive]);

  useFrame((_, delta) => {
    if (!isActive || !packetRef.current) return;

    if (progressRef.current < 1) {
      progressRef.current += delta * 0.65; // Speed of light packet
      if (progressRef.current >= 1) {
        progressRef.current = 1;
        if (!hasArrivedRef.current) {
          hasArrivedRef.current = true;
          onPacketArrived();
        }
      }
      const pt = curve.getPoint(progressRef.current);
      packetRef.current.position.copy(pt);
    }
  });

  return (
    <group>
      {/* 3D Arc Curve Line */}
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial
          color={arc.color}
          transparent
          opacity={isActive ? 0.8 : 0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Start Coordinates Marker Dot */}
      <mesh position={startVec}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={arc.color} toneMapped={false} />
      </mesh>

      {/* End Coordinates Marker Dot */}
      <mesh position={endVec}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={arc.color} toneMapped={false} />
      </mesh>

      {/* Flying Glowing Message Packet (Shrunk Size) */}
      {isActive && (
        <mesh ref={packetRef}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

// --- 3. 2D HTML OVERLAY CARDS WITH DREI SPRITE, DISTANCE FACTOR & OCCLUSION ---
const CoordinateHtmlOverlays: React.FC<{
  arc: NetworkArc;
  showSenderCard: boolean;
  showReceiverCard: boolean;
}> = ({ arc, showSenderCard, showReceiverCard }) => {
  const radius = 2.4;

  const startVec = useMemo(() => latLngToVector3(arc.startLat, arc.startLng, radius * 1.15), [arc]);
  const endVec = useMemo(() => latLngToVector3(arc.endLat, arc.endLng, radius * 1.15), [arc]);

  return (
    <>
      {/* 2D SENDER HTML CARD AT START LAT/LNG (CONSTANT 2D STANDARD SIZE) */}
      {showSenderCard && (
        <Html position={[startVec.x, startVec.y, startVec.z]} center>
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-purple-500/50 p-2.5 rounded-xl shadow-2xl w-44 space-y-1 text-slate-100 font-sans pointer-events-none"
            >
              <div className="flex items-center justify-between text-[9px] font-mono text-purple-400 border-b border-slate-800 pb-1">
                <span className="font-bold flex items-center space-x-1">
                  <Send size={9} />
                  <span>Sending ({arc.channel})</span>
                </span>
                <span className="truncate max-w-[60px] font-semibold">{arc.fromName.split(',')[0]}</span>
              </div>
              <p className="text-[10px] font-mono text-slate-200 bg-slate-950 p-1.5 rounded border border-slate-800/80 truncate">
                {arc.senderTemplate}
              </p>
            </motion.div>
          </AnimatePresence>
        </Html>
      )}

      {/* 2D RECEIVER HTML CARD AT END LAT/LNG (CONSTANT 2D STANDARD SIZE) */}
      {showReceiverCard && (
        <Html position={[endVec.x, endVec.y, endVec.z]} center>
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/50 p-2.5 rounded-xl shadow-2xl w-44 space-y-1 text-slate-100 font-sans pointer-events-none"
            >
              <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400 border-b border-slate-800 pb-1">
                <span className="font-bold flex items-center space-x-1">
                  <CheckCircle2 size={9} />
                  <span>Received</span>
                </span>
                <span className="truncate max-w-[60px] font-semibold">{arc.toName.split(',')[0]}</span>
              </div>
              <p className="text-[10px] font-mono text-slate-200 bg-slate-950 p-1.5 rounded border border-slate-800/80 truncate">
                {arc.receiverTemplate}
              </p>
            </motion.div>
          </AnimatePresence>
        </Html>
      )}
    </>
  );
};

// --- 4. SCENE CONTAINER & CONTINUOUS RANDOM ARC SCHEDULER ---
const GlobeScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [activeArcIndex, setActiveArcIndex] = useState(0);
  const [showSenderCard, setShowSenderCard] = useState(true);
  const [showReceiverCard, setShowReceiverCard] = useState(false);

  // Auto-rotate the globe slowly on Y-axis
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  // Continuous random arc trigger sequence
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveArcIndex(prev => {
        let next = Math.floor(Math.random() * networkArcsData.length);
        if (next === prev) next = (prev + 1) % networkArcsData.length;
        return next;
      });
      setShowSenderCard(true);
      setShowReceiverCard(false);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handlePacketArrived = () => {
    setShowSenderCard(false);
    setShowReceiverCard(true);
  };

  const activeArc = networkArcsData[activeArcIndex];

  return (
    <group ref={groupRef}>
      {/* Point-Cloud Earth */}
      <EarthPointCloud />

      {/* Outer Atmosphere Glow */}
      <mesh>
        <sphereGeometry args={[2.42, 32, 32]} />
        <meshBasicMaterial
          color="#7342E2"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Render all independent 3D arcs */}
      {networkArcsData.map((arc, idx) => (
        <IndependentArc
          key={arc.id}
          arc={arc}
          isActive={idx === activeArcIndex}
          onPacketArrived={handlePacketArrived}
        />
      ))}

      {/* Render 2D HTML Template Cards */}
      <CoordinateHtmlOverlays
        arc={activeArc}
        showSenderCard={showSenderCard}
        showReceiverCard={showReceiverCard}
      />
    </group>
  );
};

// --- MAIN EXPORTED COMPONENT ---
export const EventMesh3DGlobe: React.FC = () => {
  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl overflow-hidden relative text-slate-100 font-sans">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7342E2]/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-4 mb-6 relative z-10 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 font-bold uppercase tracking-widest mb-1">
            <Zap size={14} className="fill-purple-400" />
            <span>GLOBAL NOTIFICATION PIPELINE</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Deliver Notifications Anywhere on Earth in Milliseconds
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <Radio size={12} className="animate-pulse text-emerald-400" />
          <span>Active Event Mesh</span>
        </div>
      </div>

      {/* Main Grid: Left Workflow Cards | 3D Canvas | Right Workflow Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">

        {/* Left Side Workflow Cards (Steps 1 & 2) */}
        <div className="lg:col-span-3 flex flex-col space-y-4 order-2 lg:order-1">
          {/* Step 1 */}
          <CometCard rotateDepth={12} translateDepth={12}>
            <div className="bg-slate-900/70 border border-slate-800/80 hover:border-purple-500/40 p-4 rounded-2xl backdrop-blur-md transition-all duration-300 group h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  STEP 01
                </span>
                <span className="text-[11px] font-mono text-slate-400">Ingress</span>
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                Unified API Ingress
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Standard JSON payload ingested with instant SHA-256 API key authentication & rate limiting.
              </p>
            </div>
          </CometCard>

          {/* Step 2 */}
          <CometCard rotateDepth={12} translateDepth={12}>
            <div className="bg-slate-900/70 border border-slate-800/80 hover:border-purple-500/40 p-4 rounded-2xl backdrop-blur-md transition-all duration-300 group h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  STEP 02
                </span>
                <span className="text-[11px] font-mono text-slate-400">Queueing</span>
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                BullMQ Async Workers
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Redis-backed job queue processes high concurrency bursts without dropped requests.
              </p>
            </div>
          </CometCard>
        </div>

        {/* Center Canvas Container */}
        <div className="lg:col-span-6 h-[460px] sm:h-[500px] w-full flex items-center justify-center relative order-1 lg:order-2">
          
          <Canvas
            camera={{ position: [0, 0, 6.2], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
            className="w-full h-full"
          >
            <ambientLight intensity={0.5} />
            <GlobeScene />
            <OrbitControls enablePan={false} enableZoom={false} rotateSpeed={0.5} />

            {/* WebGL Neon Bloom Glow Effect */}
            <EffectComposer>
              <Bloom
                intensity={1.4}
                luminanceThreshold={0.2}
                luminanceSmoothing={0.9}
              />
            </EffectComposer>
          </Canvas>

        </div>

        {/* Right Side Workflow Cards (Steps 3 & 4) */}
        <div className="lg:col-span-3 flex flex-col space-y-4 order-3">
          {/* Step 3 */}
          <CometCard rotateDepth={12} translateDepth={12}>
            <div className="bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/40 p-4 rounded-2xl backdrop-blur-md transition-all duration-300 group h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  STEP 03
                </span>
                <span className="text-[11px] font-mono text-slate-400">Dispatch</span>
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                Omnichannel Failover
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Automatic provider fallback across SMTP Email, Twilio SMS, and HTTP Webhooks.
              </p>
            </div>
          </CometCard>

          {/* Step 4 */}
          <CometCard rotateDepth={12} translateDepth={12}>
            <div className="bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/40 p-4 rounded-2xl backdrop-blur-md transition-all duration-300 group h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  STEP 04
                </span>
                <span className="text-[11px] font-mono text-slate-400">Audit</span>
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                Real-time SSE Audit
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Live server-sent events provide millisecond delivery confirmation & visual trace logs.
              </p>
            </div>
          </CometCard>
        </div>

      </div>
    </div>
  );
};
