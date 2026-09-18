import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const { data } = await api.post(endpoint, { email, password });
      
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex font-sans selection:bg-[#7342E2]/30" style={{ backgroundColor: 'var(--color-login-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}>
      
      {/* Left Column - Form */}
      <div className="flex-1 flex flex-col justify-center px-12 sm:px-24 lg:px-32 bg-white/60 backdrop-blur-md relative z-10 shadow-2xl">
        <div className="max-w-[400px] w-full mx-auto">
          <div className="flex items-center space-x-2 mb-12">
            <div className="w-8 h-8 bg-slate-950 rounded-lg flex items-center justify-center shadow-md">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">EventMesh</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-slate-500 mb-8 text-sm">
            {isLogin ? 'Enter your credentials to access your workspaces.' : 'Start building your notification infrastructure today.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email address</label>
              <input 
                type="email" 
                required
                className="w-full bg-white text-slate-900 text-sm rounded-lg px-4 py-3 border border-slate-300 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow shadow-sm placeholder:text-slate-400"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-white text-slate-900 text-sm rounded-lg px-4 py-3 border border-slate-300 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow shadow-sm placeholder:text-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-sm text-rose-600 font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full text-white font-medium py-3 rounded-lg transition-transform active:scale-95 shadow-lg mt-2"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="font-semibold text-slate-900 hover:underline transition-all"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Brand Imagery */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden" style={{ backgroundColor: 'var(--color-text)' }}>
        {/* Subtle decorative background */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="relative z-10 max-w-lg px-12">
          <h3 className="text-4xl font-bold text-white mb-6 leading-tight">Ship notifications <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">without the infrastructure.</span></h3>
          <p className="text-slate-400 text-lg leading-relaxed">
            EventMesh handles API rate limiting, queueing, retries, and cross-channel delivery so you can focus on building your actual product.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="border border-slate-800/60 bg-slate-900/50 p-5 rounded-2xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-4"><Zap size={20} /></div>
              <h4 className="text-white font-medium mb-1">Guaranteed Delivery</h4>
              <p className="text-sm text-slate-500">BullMQ powered retries prevent network blips from dropping messages.</p>
            </div>
            <div className="border border-slate-800/60 bg-slate-900/50 p-5 rounded-2xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4"><Zap size={20} /></div>
              <h4 className="text-white font-medium mb-1">Omnichannel</h4>
              <p className="text-sm text-slate-500">Send an Email and an SMS with a single API request.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
