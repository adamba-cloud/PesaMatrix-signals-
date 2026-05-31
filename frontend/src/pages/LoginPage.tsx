import React, { useState } from 'react';
import { TrendingUp, Eye, EyeOff, Phone, MessageCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (token: string, mustChange: boolean, role: 'USER' | 'ADMIN') => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        onLogin(data.token, data.mustChangePassword, payload.role);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection error — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-darker via-brand-card to-brand-card2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-10 w-48 h-48 bg-brand-primaryDark/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-brand-dark" />
            </div>
            <span className="text-xl font-bold tracking-tight">PesaMatrix Signal</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-6">
            Professional MT5<br />
            <span className="text-brand-primary">Copy Trading</span><br />
            Platform
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            AI-powered market analysis with M-Pesa billing integration. Trade smarter with automated signal execution.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { label: 'Active Traders', value: '1,200+' },
            { label: 'Win Rate', value: '82%' },
            { label: 'Signals Sent', value: '45K+' },
            { label: 'Avg Return', value: '+18.7%' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-brand-primary font-bold text-xl">{s.value}</div>
              <div className="text-gray-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="relative z-10 space-y-2 pt-4 border-t border-white/10">
          <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Contact & Support</p>
          <a href="tel:+254781585319" className="flex items-center gap-2 text-gray-300 hover:text-brand-primary transition text-sm">
            <Phone className="w-4 h-4 text-brand-primary" />
            +254 781 585 319 / +254 717 434 943
          </a>
          <a href="https://wa.me/254717434943" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-brand-primary transition text-sm">
            <MessageCircle className="w-4 h-4 text-green-400" />
            WhatsApp: +254 717 434 943
          </a>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-dark" />
            </div>
            <span className="text-lg font-bold">PesaMatrix Signal</span>
          </div>

          <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-8">Sign in to your trading account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primaryDark disabled:opacity-60 transition text-brand-dark font-bold py-3 rounded-xl text-sm tracking-wide"
            >
              {loading ? 'Authenticating...' : 'Sign In Securely'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-brand-border">
            <p className="text-gray-500 text-sm text-center mb-3">Need help? Contact support</p>
            <div className="flex justify-center gap-6 text-sm">
              <a href="tel:+254781585319" className="flex items-center gap-1.5 text-gray-400 hover:text-brand-primary transition">
                <Phone className="w-4 h-4" /> +254 781 585 319
              </a>
              <a href="https://wa.me/254717434943" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-gray-400 hover:text-green-400 transition">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
