import { Radio, TrendingUp, TrendingDown, Crown } from 'lucide-react';

const signals = [
  { symbol: 'EUR/USD', icon: '€', color: 'bg-blue-600', type: 'BUY', entry: '1.08245', sl: '1.0790', tp: '1.0890', pips: '+45', time: '2 min ago', status: 'OPEN' },
  { symbol: 'XAU/USD', icon: '⚡', color: 'bg-yellow-600', type: 'BUY', entry: '2,356.75', sl: '2,340.00', tp: '2,380.00', pips: '+120', time: '15 min ago', status: 'OPEN' },
  { symbol: 'GBP/USD', icon: '£', color: 'bg-purple-600', type: 'SELL', entry: '1.26340', sl: '1.2690', tp: '1.2550', pips: '-25', time: '1 hour ago', status: 'CLOSED' },
  { symbol: 'BTC/USDT', icon: '₿', color: 'bg-orange-500', type: 'BUY', entry: '67,892.11', sl: '66,500.00', tp: '69,500.00', pips: '+230', time: '2 hours ago', status: 'OPEN' },
  { symbol: 'US30', icon: '📈', color: 'bg-indigo-600', type: 'BUY', entry: '39,150.00', sl: '38,900.00', tp: '39,500.00', pips: '+85', time: '3 hours ago', status: 'CLOSED' },
  { symbol: 'NAS100', icon: '💹', color: 'bg-teal-600', type: 'SELL', entry: '17,820.00', sl: '18,000.00', tp: '17,500.00', pips: '+95', time: '5 hours ago', status: 'CLOSED' },
];

export default function SignalsPage() {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Trading Signals</h2>
          <p className="text-gray-400 text-sm">AI-powered signals updated in real-time</p>
        </div>
        <span className="flex items-center gap-1.5 text-brand-primary text-sm font-semibold bg-brand-primary/10 border border-brand-primary/30 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse-green" /> Live
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Signals', value: '128', icon: Radio },
          { label: 'Win Rate', value: '82%', icon: TrendingUp },
          { label: 'Avg Pips', value: '+94', icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="bg-brand-card border border-brand-border rounded-2xl p-5 text-center">
            <s.icon className="w-5 h-5 text-brand-primary mx-auto mb-2" />
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-gray-400 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Signal List */}
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h3 className="font-bold">All Signals</h3>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-brand-primary" />
            <span className="text-xs text-brand-primary font-semibold">VIP Access Required</span>
          </div>
        </div>
        <div className="divide-y divide-brand-border">
          {signals.map((s, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-white/2 transition">
              <div className={`w-10 h-10 ${s.color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">{s.symbol}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${s.type === 'BUY' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-red-900/30 text-red-400'}`}>{s.type}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${s.status === 'OPEN' ? 'border-brand-primary/30 text-brand-primary bg-brand-primary/5' : 'border-gray-700 text-gray-500 bg-brand-dark'}`}>{s.status}</span>
                </div>
                <div className="text-gray-400 text-xs">
                  Entry: {s.entry} · SL: {s.sl} · TP: {s.tp} · {s.time}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`font-bold text-sm flex items-center gap-1 justify-end ${parseInt(s.pips) >= 0 ? 'text-brand-primary' : 'text-red-400'}`}>
                  {parseInt(s.pips) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {s.pips} pips
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
