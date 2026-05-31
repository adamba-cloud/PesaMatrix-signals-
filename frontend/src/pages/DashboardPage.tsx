import { useState, useEffect } from 'react';
import { BarChart2, CheckCircle2, Star, DollarSign, TrendingUp, TrendingDown, Crown, Check, Bell, Shield } from 'lucide-react';

interface Props {
  token: string;
  role: 'USER' | 'ADMIN';
  email: string;
  onNavigate: (page: 'payments') => void;
}

interface SubConfig { subscriptionFee: number; subscriptionDays: number; }

const marketData = [
  { symbol: 'EUR/USD', icon: '€', color: 'bg-blue-600', price: '1.08245', change: '+0.45%', signal: 'BUY signal updated', positive: true },
  { symbol: 'XAU/USD', icon: '⚡', color: 'bg-yellow-600', price: '2,356.75', change: '+0.89%', signal: 'Volatility increasing', positive: true },
  { symbol: 'BTC/USDT', icon: '₿', color: 'bg-orange-500', price: '67,892.11', change: '+2.35%', signal: 'Trend bullish continuation', positive: true },
];

const recentSignals = [
  { symbol: 'EUR/USD', icon: '€', color: 'bg-blue-600', type: 'BUY', time: '2 min ago', sl: '1.0790', tp: '1.0890', price: '1.08245', pips: '+45 pips', pos: true },
  { symbol: 'XAU/USD', icon: '⚡', color: 'bg-yellow-600', type: 'BUY', time: '15 min ago', sl: '2,340.00', tp: '2,380.00', price: '2,356.75', pips: '+120 pips', pos: true },
  { symbol: 'GBP/USD', icon: '£', color: 'bg-purple-600', type: 'SELL', time: '1 hour ago', sl: '1.2690', tp: '1.2550', price: '1.26340', pips: '-25 pips', pos: false },
  { symbol: 'BTC/USDT', icon: '₿', color: 'bg-orange-500', type: 'BUY', time: '2 hours ago', sl: '66,500.00', tp: '69,500.00', price: '67,892.11', pips: '+230 pips', pos: true },
];

const performanceDots = [20, 35, 30, 50, 48, 62, 75, 72, 85, 90, 82, 95];

export default function DashboardPage({ token, role, email, onNavigate }: Props) {
  const [subConfig, setSubConfig] = useState<SubConfig>({ subscriptionFee: 3000, subscriptionDays: 30 });
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [dismissBanner, setDismissBanner] = useState(false);

  useEffect(() => {
    fetch('/api/v1/admin/public-config').then(r => r.json()).then(setSubConfig).catch(() => {});

    fetch('/api/v1/auth/subscription-status', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => setHasActiveSub(d.active)).catch(() => {});
  }, [token]);

  const displayName = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || 'Trader';
  const capitalized = displayName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const stats = [
    { label: 'Total Signals', value: '128', change: '+12 this week', icon: BarChart2, iconColor: 'text-brand-primary', positive: true },
    { label: 'Win Rate', value: '82%', change: '+5% this week', icon: CheckCircle2, iconColor: 'text-brand-primary', positive: true },
    { label: 'Active Plan', value: hasActiveSub ? 'VIP' : 'None', change: hasActiveSub ? 'Active' : 'Subscribe', icon: Star, iconColor: 'text-brand-primary', positive: hasActiveSub },
    { label: 'Total Profit', value: '+$4,250', change: '+18.7% this month', icon: DollarSign, iconColor: 'text-brand-primary', positive: true },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Top Row: Welcome + VIP Card */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <p className="text-gray-400 text-sm mb-1">Welcome back,</p>
          <h1 className="text-3xl font-bold mb-1">{capitalized} <span>👋</span></h1>
          <p className="text-gray-400 text-sm">Here's what's happening with your trading today.</p>
        </div>

        {hasActiveSub && (
          <div className="lg:w-72 bg-gradient-to-br from-brand-primary/20 via-brand-card to-brand-card2 border border-brand-primary/30 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-white">VIP Member</span>
                <span className="text-xs bg-brand-primary text-brand-dark font-bold px-2 py-0.5 rounded-full">Active</span>
                <span className="text-xs bg-brand-card2 text-brand-primary border border-brand-primary/30 font-bold px-2 py-0.5 rounded-full">VIP</span>
              </div>
              <p className="text-brand-primary text-xs font-medium">Valid until 20/06/2026</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-brand-card border border-brand-border rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <span className="text-gray-400 text-sm">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
            <div className="text-2xl font-bold mb-1">{s.value}</div>
            <div className={`text-xs font-medium ${s.positive ? 'text-brand-primary' : 'text-red-400'}`}>
              {s.change}
            </div>
          </div>
        ))}
      </div>

      {/* Market + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Overview */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold">Live Market Overview</h3>
            <span className="flex items-center gap-1.5 text-brand-primary text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse-green" />
              Live
            </span>
          </div>
          <div className="space-y-4">
            {marketData.map((m) => (
              <div key={m.symbol} className="flex items-center gap-4 py-3 border-b border-brand-border last:border-0">
                <div className={`w-10 h-10 ${m.color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{m.symbol}</div>
                  <div className="text-gray-400 text-xs truncate">{m.signal}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{m.price}</div>
                  <div className={`text-xs font-semibold ${m.positive ? 'text-brand-primary' : 'text-red-400'}`}>{m.change}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 transition text-sm font-semibold py-2.5 rounded-xl">
            View All Markets
          </button>
        </div>

        {/* Performance Chart */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold">Performance</h3>
            <span className="text-xs bg-brand-card2 border border-brand-border px-3 py-1.5 rounded-lg text-gray-300 cursor-pointer">
              This Week ▾
            </span>
          </div>

          {/* Mini SVG Chart */}
          <div className="relative h-40 mb-4">
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-600 w-10">
              {['100%', '75%', '50%', '25%', '0%'].map(l => <span key={l}>{l}</span>)}
            </div>
            <div className="ml-10 h-full relative">
              <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`M 0,${100 - performanceDots[0]} ${performanceDots.map((v, i) => `L ${(i / (performanceDots.length - 1)) * 100},${100 - v}`).join(' ')} L 100,100 L 0,100 Z`}
                  fill="url(#perfGradient)"
                />
                <path
                  d={`M 0,${100 - performanceDots[0]} ${performanceDots.map((v, i) => `L ${(i / (performanceDots.length - 1)) * 100},${100 - v}`).join(' ')}`}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                />
                <circle cx="100" cy={100 - performanceDots[performanceDots.length - 1]} r="3" fill="#10B981" />
              </svg>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 ml-10">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
          </div>

          <div className="mt-4 pt-4 border-t border-brand-border flex items-center justify-between">
            <p className="text-gray-400 text-sm">Your account is performing<br />above average this week.</p>
            <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/30 font-bold text-sm px-3 py-1.5 rounded-xl">+18.7%</span>
          </div>
        </div>
      </div>

      {/* Signals + Subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signals */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold">Recent Signals</h3>
            <button className="text-brand-primary text-sm font-semibold hover:text-brand-primaryLight transition">View All</button>
          </div>
          <div className="space-y-4">
            {recentSignals.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-brand-border last:border-0">
                <div className={`w-9 h-9 ${s.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm">{s.symbol}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${s.type === 'BUY' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-red-900/30 text-red-400'}`}>{s.type}</span>
                  </div>
                  <div className="text-gray-500 text-xs">{s.time} · SL: {s.sl} · TP: {s.tp}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-sm">{s.price}</div>
                  <div className={`text-xs font-semibold ${s.pos ? 'text-brand-primary' : 'text-red-400'}`}>{s.pips}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 transition text-sm font-semibold py-2.5 rounded-xl">
            View All Signals
          </button>
        </div>

        {/* Subscription */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold mb-5">Subscription</h3>
          <div className="flex items-start gap-4 mb-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${hasActiveSub ? 'bg-brand-primary/20' : 'bg-brand-card2'}`}>
              <Crown className={`w-6 h-6 ${hasActiveSub ? 'text-brand-primary' : 'text-gray-500'}`} />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {hasActiveSub
                ? 'VIP access active with full signal privileges.'
                : `Subscribe for KES ${subConfig.subscriptionFee.toLocaleString()} and get full access to all signals for ${subConfig.subscriptionDays} days.`}
            </p>
          </div>

          {hasActiveSub ? (
            <div className="space-y-2 mb-5">
              {['All VIP Signals', 'Real-time Alerts', 'Strategy Guide', 'Priority Support'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-brand-dark border border-brand-border rounded-xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fee per period</span>
                <span className="font-bold text-brand-primary">KES {subConfig.subscriptionFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Access duration</span>
                <span className="font-bold">{subConfig.subscriptionDays} days</span>
              </div>
            </div>
          )}

          <button
            onClick={() => onNavigate('payments')}
            className="w-full bg-brand-primary hover:bg-brand-primaryDark transition text-brand-dark font-bold py-3 rounded-xl text-sm"
          >
            {hasActiveSub ? 'Manage Subscription' : 'Subscribe Now'}
          </button>
        </div>
      </div>

      {/* Security Banner */}
      {!dismissBanner && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-brand-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Secure Your Account</p>
            <p className="text-gray-400 text-xs mt-0.5">Enable two-factor authentication to keep your account safe.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 transition text-sm font-semibold px-4 py-2 rounded-xl">
              Enable 2FA
            </button>
            <button onClick={() => setDismissBanner(true)} className="text-gray-500 hover:text-white transition text-xl leading-none">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
