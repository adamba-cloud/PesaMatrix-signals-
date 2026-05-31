import { useState, useEffect } from 'react';
import { CreditCard, Crown, Check, Phone, Clock } from 'lucide-react';

interface Props { token: string; }

interface SubConfig { subscriptionFee: number; subscriptionDays: number; }

const dayOptions = [7, 14, 30, 60, 90];

export default function PaymentsPage({ token }: Props) {
  const [phone, setPhone] = useState('');
  const [selectedDays, setSelectedDays] = useState(30);
  const [subConfig, setSubConfig] = useState<SubConfig>({ subscriptionFee: 3000, subscriptionDays: 30 });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/admin/public-config').then(r => r.json()).then(d => {
      setSubConfig(d);
      setSelectedDays(d.subscriptionDays);
    }).catch(() => {});

    fetch('/api/v1/auth/my-subscriptions', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => setHistory(d.subscriptions || [])).catch(() => {});
  }, [token]);

  const pricePerDay = subConfig.subscriptionFee / subConfig.subscriptionDays;
  const totalAmount = Math.round(pricePerDay * selectedDays);

  const handleStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/v1/payments/stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phoneNumber: phone, amount: totalAmount, days: selectedDays }),
      });
      const data = await res.json();
      if (data.CheckoutRequestID || data.checkoutId) {
        setStatus(`✅ M-Pesa prompt sent to ${phone}. Check your phone to complete payment. Ref: ${data.CheckoutRequestID || data.checkoutId}`);
      } else {
        setStatus(data.error || 'Payment initiation failed. Please try again.');
      }
    } catch {
      setStatus('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold mb-1">Payments</h2>
        <p className="text-gray-400 text-sm">Subscribe and manage your trading access</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Plan */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-bold">VIP Trading Access</h3>
              <p className="text-gray-400 text-xs">Select your subscription period</p>
            </div>
          </div>

          {/* Day Selector */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-3">Subscription Duration</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {dayOptions.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDays(d)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition border ${
                    selectedDays === d
                      ? 'bg-brand-primary text-brand-dark border-brand-primary'
                      : 'bg-brand-dark border-brand-border text-gray-400 hover:border-brand-primary/50 hover:text-white'
                  }`}
                >
                  {d} days
                </button>
              ))}
              <div className="col-span-3">
                <label className="block text-xs text-gray-500 mb-1.5 mt-2">Or enter custom days:</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={selectedDays}
                  onChange={e => setSelectedDays(parseInt(e.target.value) || 1)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-primary transition"
                />
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-brand-dark border border-brand-border rounded-xl p-4 mb-5 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Base rate</span>
              <span>KES {subConfig.subscriptionFee.toLocaleString()} / {subConfig.subscriptionDays} days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Selected duration</span>
              <span>{selectedDays} days</span>
            </div>
            <div className="flex justify-between text-sm border-t border-brand-border pt-2.5">
              <span className="font-bold">Total Amount</span>
              <span className="text-brand-primary font-bold text-lg">KES {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2 mb-5">
            {['All VIP Trading Signals', 'Real-time Market Alerts', 'AI Market Analysis', 'Strategy Guides', 'Priority WhatsApp Support'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-brand-primary flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* M-Pesa Payment */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-bold">Pay via M-Pesa</h3>
              <p className="text-gray-400 text-xs">Instant STK push to your phone</p>
            </div>
          </div>

          <form onSubmit={handleStkPush} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-primary" /> M-Pesa Phone Number</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 254712345678"
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary transition"
              />
              <p className="text-gray-500 text-xs mt-1.5">Format: 254XXXXXXXXX (no spaces or +)</p>
            </div>

            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-semibold text-brand-primary">Payment Summary</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan</span>
                  <span>{selectedDays}-Day VIP Access</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="font-bold text-brand-primary">KES {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {status && (
              <div className={`p-4 rounded-xl text-sm font-medium ${status.startsWith('✅') ? 'bg-brand-primary/10 border border-brand-primary/30 text-brand-primaryLight' : 'bg-red-900/20 border border-red-800 text-red-400'}`}>
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primaryDark disabled:opacity-60 transition text-brand-dark font-bold py-3.5 rounded-xl"
            >
              {loading ? 'Sending STK Push...' : `Pay KES ${totalAmount.toLocaleString()} via M-Pesa`}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-brand-border text-center">
            <p className="text-gray-500 text-xs">Need help? WhatsApp: <a href="https://wa.me/254717434943" className="text-brand-primary hover:underline">+254 717 434 943</a></p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {history.length > 0 && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold mb-4">Payment History</h3>
          <div className="space-y-3">
            {history.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between py-3 border-b border-brand-border last:border-0">
                <div>
                  <div className="font-medium text-sm">{h.planName}</div>
                  <div className="text-gray-400 text-xs">{new Date(h.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">KES {h.amount.toLocaleString()}</div>
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${h.status === 'COMPLETED' ? 'bg-brand-primary/20 text-brand-primary' : h.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>
                    {h.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
