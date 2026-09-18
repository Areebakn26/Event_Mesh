import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, LockKeyhole, Fingerprint, Menu, X, ArrowRightCircle, Shield, Cpu, RefreshCw, Layers, CheckCircle2, Terminal } from 'lucide-react';
import { EventMesh3DGlobe } from '../components/EventMesh3DGlobe';
import { CometCard } from '../components/ui/comet-card';

const Landing = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as any }
    })
  };

  const scrollReveal = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as any }
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden selection:bg-[#7342E2]/30" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text)', backgroundColor: 'var(--color-login-bg)' }}>
      
      {/* Background Video (Hero Section) */}
      <div className="fixed inset-0 z-0">
        <video 
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4" 
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          autoPlay 
          muted 
          loop 
          playsInline
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navbar */}
        <nav className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" overflow="visible" viewBox="0 0 256 256">
              <path d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z" fill="#192837"/>
            </svg>
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>EventMesh</span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm font-medium hover:opacity-75 transition-opacity">Architecture</a>
            <a href="#benefits" className="text-sm font-medium hover:opacity-75 transition-opacity">Why EventMesh</a>
            <a href="#code" className="text-sm font-medium hover:opacity-75 transition-opacity">API Spec</a>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <Link to="/login" className="text-sm font-medium rounded-full px-5 py-2.5 hover:opacity-80 transition-opacity" style={{ background: 'var(--color-login-bg)', color: 'var(--color-text)' }}>
              Sign In
            </Link>
            <Link to="/login" className="text-sm font-medium rounded-full px-5 py-2.5 hover:opacity-90 transition-opacity" style={{ background: 'var(--color-accent)', color: 'white' }}>
              Start For Free
            </Link>
          </div>

          <button className="md:hidden" style={{ color: 'var(--color-text)' }} onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={28} />
          </button>
        </nav>

        {/* Hero Section */}
        <main className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 pb-24 flex-1 flex flex-col" style={{ paddingTop: 'clamp(40px, 8vw, 72px)' }}>
          <div className="max-w-[560px]">
            <motion.h1 
              custom={0} initial="hidden" animate="visible" variants={fadeUp}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.65rem, 5vw, 3rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                color: 'var(--color-text)',
                marginBottom: '24px'
              }}
            >
              <Zap size={24} color="#192837" className="inline relative align-middle -top-[2px] mr-1" />
              Ship Notifications <LockKeyhole size={24} color="#192837" className="inline relative align-middle -top-[2px] mx-1" /> with Ironclad Reliability <Fingerprint size={24} color="#192837" className="inline relative align-middle -top-[2px] ml-1" />
            </motion.h1>

            <motion.p 
              custom={1} initial="hidden" animate="visible" variants={fadeUp}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                lineHeight: 1.65,
                opacity: 0.8,
                maxWidth: '560px',
                color: 'var(--color-text)',
                marginBottom: '40px'
              }}
            >
              Zero stress, total control. EventMesh keeps you covered with Redis-backed rate limiting, guaranteed BullMQ asynchronous queueing, and unified cross-channel delivery for your SaaS.
            </motion.p>

            <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
              <Link 
                to="/login"
                className="inline-flex items-center justify-between transition-transform active:scale-96 hover:scale-[1.04] hover:brightness-110 mb-12"
                style={{
                  background: 'var(--color-accent)',
                  color: 'white',
                  borderRadius: '50px',
                  padding: '17px 24px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  boxShadow: '0 4px 24px rgba(115,66,226,0.28)',
                  minWidth: '210px',
                  gap: '32px'
                }}
              >
                <span>Get It Free</span>
                <ArrowRightCircle size={20} />
              </Link>
            </motion.div>
          </div>

          {/* 3D Point-Cloud Particle Globe & Flying Arc Messages Hero Component */}
          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="w-full mt-12">
            <EventMesh3DGlobe />
          </motion.div>
        </main>
      </div>

      {/* Scrollable Content Sections (Rich Theme Gradients, Patterns & Animated Light Beams) */}
      <div className="relative z-10 bg-white border-t border-[#192837]/10">
        
        {/* Section 1: Architecture Highlights (Gradient Grid with Traveling Light Beam) */}
        <section id="features" className="py-24 max-w-[1280px] mx-auto px-5 sm:px-8 relative overflow-hidden bg-gradient-to-br from-purple-500/04 via-white to-sky-500/04">
          {/* Animated Top Horizontal Light Laser Beam */}
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none z-20">
            <motion.div
              animate={{ x: ['-100%', '250%'] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'linear' }}
              className="w-56 h-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, #7342E2 50%, transparent 100%)',
                boxShadow: '0 0 14px #7342E2, 0 0 4px #7342E2'
              }}
            />
          </div>

          {/* Ambient Purple & Sky Glow Orbs */}
          <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.22, 0.12] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#7342E2]/20 rounded-full blur-[100px] pointer-events-none"
          />
          <motion.div 
            animate={{ scale: [1.15, 1, 1.15], opacity: [0.15, 0.25, 0.15] }}
            transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
            className="absolute top-1/4 right-0 w-80 h-80 bg-sky-400/20 rounded-full blur-[100px] pointer-events-none"
          />
          
          {/* Section Pattern 1: Tech Linear Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#7342E218_1px,transparent_1px),linear-gradient(to_bottom,#7342E218_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"></div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={scrollReveal}
            className="mb-16 max-w-2xl relative z-10"
          >
            <div className="inline-flex items-center space-x-2 bg-[#7342E2]/10 border border-[#7342E2]/25 px-3 py-1 rounded-full mb-3">
              <span className="w-2 h-2 rounded-full bg-[#7342E2] animate-pulse"></span>
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#7342E2]">Architectural Integrity</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Built for high-scale, zero-loss delivery.
            </h2>
            <p className="text-base opacity-75 leading-relaxed">
              Stop letting third-party SMTP timeouts or SMS provider blips crash your web application. EventMesh handles async workloads gracefully in the background.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-12 gap-8 items-stretch relative z-10">
            {/* Main Feature - 7 cols */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={scrollReveal}
              className="md:col-span-7 h-full"
            >
              <CometCard className="h-full">
                <div 
                  className="rounded-2xl p-8 sm:p-10 flex flex-col justify-between h-full shadow-lg relative overflow-hidden bg-gradient-to-br from-[#EAE5E2] to-[#DFD8D4] border border-[#192837]/15 group hover:border-[#7342E2]/40 transition-colors"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#7342E2]/10 rounded-full blur-2xl pointer-events-none"></div>
                  <div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-md" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                      <Cpu size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>BullMQ Queue Engine</h3>
                    <p className="text-sm opacity-80 leading-relaxed max-w-md">
                      Every request generates an asynchronous job. Workers process jobs concurrently with configurable retry logic, backoff strategies, and error telemetry.
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[#192837]/15 font-mono text-xs opacity-75 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-[#7342E2] animate-ping"></span><span>Concurrency: Multi-thread</span></span>
                    <span className="bg-[#7342E2]/10 px-2.5 py-1 rounded border border-[#7342E2]/20 font-semibold text-[#7342E2]">Persistence: Redis Store</span>
                  </div>
                </div>
              </CometCard>
            </motion.div>

            {/* Secondary Feature - 5 cols */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={scrollReveal}
              className="md:col-span-5 h-full"
            >
              <CometCard className="h-full">
                <div 
                  className="rounded-2xl p-8 sm:p-10 flex flex-col justify-between text-white h-full shadow-xl relative overflow-hidden bg-gradient-to-br from-[#192837] via-[#0F1A26] to-[#192837] border border-white/10 group hover:border-sky-400/40 transition-colors"
                >
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-sky-400/15 rounded-full blur-2xl pointer-events-none"></div>
                  <div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-white/10 text-white shadow-inner">
                      <Shield size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>SHA-256 Key Security</h3>
                    <p className="text-sm opacity-80 leading-relaxed">
                      API keys are hashed on arrival. Raw keys never hit persistent storage, protecting your system even in database breach scenarios.
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 font-mono text-xs opacity-75 flex items-center justify-between">
                    <span>Algorithm: SHA-256 Hashing</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded border border-white/15">Zero-Knowledge Storage</span>
                  </div>
                </div>
              </CometCard>
            </motion.div>
          </div>
        </section>

        {/* Section 2: Why EventMesh (Polka Dot Grid Matrix with Pulsing Light Sphere) */}
        <section id="benefits" className="py-24 border-t border-[#192837]/10 relative overflow-hidden bg-gradient-to-b from-[#EFEAE6] via-[#E8E2DD] to-[#EFEAE6]">
          {/* Section Pattern 2: Polka Dot Matrix Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#7342E2_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

          {/* Animated Light Pulse Sphere */}
          <motion.div 
            animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.35, 0.15] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-purple-500/20 via-sky-400/15 to-purple-500/20 rounded-full blur-[120px] pointer-events-none"
          />

          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 relative z-10">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={scrollReveal}
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full mb-3">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-purple-700">BENEFITS AT A GLANCE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Why engineering teams switch
              </h2>
              <p className="text-base opacity-75">
                Focus on core user experience while EventMesh manages notification pipelines, rate limits, and cross-channel failovers.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={scrollReveal}
                className="h-full"
              >
                <CometCard className="h-full">
                  <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl border border-[#192837]/12 shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-sky-400 to-purple-500 transform origin-left scale-x-75 group-hover:scale-x-100 transition-transform duration-500"></div>
                    <div>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-purple-500/10 text-[#7342E2] border border-purple-500/20 shadow-inner">
                        <RefreshCw size={20} />
                      </div>
                      <h4 className="text-xl font-bold mb-2">Automated Retries</h4>
                      <p className="text-sm opacity-75 leading-relaxed">
                        Transient upstream network failures automatically trigger exponential backoff retry cycles without losing message state.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-mono text-purple-600 font-semibold flex items-center space-x-1">
                      <span>✓ Exponential Backoff</span>
                    </div>
                  </div>
                </CometCard>
              </motion.div>

              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={scrollReveal}
                className="h-full"
              >
                <CometCard className="h-full">
                  <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl border border-[#192837]/12 shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-emerald-400 to-sky-400 transform origin-left scale-x-75 group-hover:scale-x-100 transition-transform duration-500"></div>
                    <div>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-purple-500/10 text-[#7342E2] border border-purple-500/20 shadow-inner">
                        <Layers size={20} />
                      </div>
                      <h4 className="text-xl font-bold mb-2">Omnichannel Support</h4>
                      <p className="text-sm opacity-75 leading-relaxed">
                        Dispatch to Email (SMTP/Nodemailer) and SMS (Twilio) simultaneously with unified JSON payloads.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-mono text-purple-600 font-semibold flex items-center space-x-1">
                      <span>✓ Email + SMS + Webhooks</span>
                    </div>
                  </div>
                </CometCard>
              </motion.div>

              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={scrollReveal}
                className="h-full"
              >
                <CometCard className="h-full">
                  <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl border border-[#192837]/12 shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-purple-500 to-emerald-400 transform origin-left scale-x-75 group-hover:scale-x-100 transition-transform duration-500"></div>
                    <div>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-purple-500/10 text-[#7342E2] border border-purple-500/20 shadow-inner">
                        <CheckCircle2 size={20} />
                      </div>
                      <h4 className="text-xl font-bold mb-2">In-App Inspection</h4>
                      <p className="text-sm opacity-75 leading-relaxed">
                        Visual lifecycle timeline log views provide complete visibility from API ingress to delivery confirmation.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-mono text-purple-600 font-semibold flex items-center space-x-1">
                      <span>✓ Real-time SSE Logs</span>
                    </div>
                  </div>
                </CometCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 3: Developer Experience (Circuit Pattern & Terminal Animated Light Scanner) */}
        <section id="code" className="py-24 max-w-[1280px] mx-auto px-5 sm:px-8 relative overflow-hidden bg-gradient-to-tr from-[#F8F6F4] via-white to-purple-500/05">
          {/* Section Pattern 3: Circuit Micro Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#192837_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.08] pointer-events-none"></div>

          {/* Ambient Code Spotlight Glow */}
          <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-r from-purple-500/15 via-emerald-400/10 to-purple-500/15 rounded-full blur-[130px] pointer-events-none"></div>

          <div className="grid lg:grid-cols-12 gap-12 items-center relative z-10">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={scrollReveal}
              className="lg:col-span-5"
            >
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full mb-3">
                <Terminal size={14} className="text-emerald-600" />
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-emerald-700">Developer First</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                One standard payload for all channels.
              </h2>
              <p className="text-base opacity-75 mb-6 leading-relaxed">
                Send notifications effortlessly from PowerShell, cURL, or any HTTP client. Pass `templateId`, target `channels`, and recipient parameters in a single request.
              </p>
              <Link 
                to="/login"
                className="inline-flex items-center space-x-2 font-semibold text-sm hover:underline text-[#7342E2]"
              >
                <span>Get your API key to test</span>
                <ArrowRightCircle size={16} />
              </Link>
            </motion.div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={scrollReveal}
              className="lg:col-span-7"
            >
              <CometCard>
                <div 
                  className="rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800 bg-[#0F172A]"
                >
                  {/* Animated Vertical Light Beam Scanner on Terminal */}
                  <div className="absolute top-0 bottom-0 left-0 w-[2px] overflow-hidden pointer-events-none z-20">
                    <motion.div
                      animate={{ y: ['-100%', '300%'] }}
                      transition={{ repeat: Infinity, duration: 3.8, ease: 'linear' }}
                      className="h-28 w-full"
                      style={{
                        background: 'linear-gradient(180deg, transparent 0%, #34d399 50%, transparent 100%)',
                        boxShadow: '0 0 10px #34d399'
                      }}
                    />
                  </div>

                  <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between text-xs font-mono bg-slate-900/90 text-slate-200">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1.5 mr-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                      </div>
                      <Terminal size={14} className="text-emerald-400" />
                      <span className="font-bold">POST /v1/notify</span>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">200 OK</span>
                  </div>
                  <pre className="p-6 text-xs sm:text-sm font-mono overflow-x-auto text-emerald-400 leading-relaxed bg-[#0B1120]">
{`{
  "templateId": "welcome",
  "channels": ["email", "sms"],
  "recipient": {
    "email": "user@example.com",
    "phone": "+1234567890"
  },
  "data": {
    "name": "Faizan"
  }
}`}
                  </pre>
                </div>
              </CometCard>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-[#192837]/10" style={{ backgroundColor: 'var(--color-login-bg)' }}>
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between text-sm opacity-70 gap-4">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 256 256">
                <path d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z" fill="#192837"/>
              </svg>
              <span className="font-bold">EventMesh</span>
            </div>
            <p>© {new Date().getFullYear()} EventMesh. All rights reserved.</p>
          </div>
        </footer>

      </div>

      {/* Mobile Menu Sheet */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 md:hidden"
              style={{ background: 'rgba(25,40,55,0.35)', backdropFilter: 'blur(4px)' }}
            />
            
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 h-[100dvh] z-50 md:hidden flex flex-col"
              style={{ 
                width: 'min(88vw, 360px)', 
                background: '#CFC8C5',
                boxShadow: '-12px 0 48px rgba(25,40,55,0.18)'
              }}
            >
              <div className="flex items-center justify-between p-5 border-b border-[#192837]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 256 256">
                  <path d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z" fill="#192837"/>
                </svg>
                <button onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--color-text)' }}>
                  <X size={28} />
                </button>
              </div>

              <div className="flex flex-col p-6 space-y-6">
                <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Architecture</a>
                <a href="#benefits" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Why EventMesh</a>
                <a href="#code" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">API Spec</a>
              </div>

              <div className="mt-auto p-6 flex flex-col space-y-3">
                <Link to="/login" className="w-full text-center py-3 rounded-full font-medium" style={{ background: 'var(--color-login-bg)', color: 'var(--color-text)' }}>Sign In</Link>
                <Link to="/login" className="w-full text-center py-3 rounded-full font-medium" style={{ background: 'var(--color-accent)', color: 'white' }}>Start For Free</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Landing;
