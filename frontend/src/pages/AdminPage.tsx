import { useState, useEffect } from 'react';
import {
  Shield, AlertTriangle, DollarSign, Clock, Users,
  ToggleLeft, ToggleRight, Settings, CreditCard, CheckCircle, RefreshCw, PlusCircle
} from 'lucide-react';

interface Props { token: string; }

interface Config {
  killSwitchActive: boolean;
  maxSpread: number;
  subscriptionFee: number;
  subscriptionDays: number;
}

type Tab = 'overview' | 'subscriptions' | 'users';

export default function AdminPage({ token }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [config, setConfig] = useState<Config>({
    killSwitchActive: false, maxSpread: 5, subscriptionFee: 3000, subscriptionDays: 30,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [maxSpread, setMaxSpread] = useState('5');
  const [subFee, setSubFee] = useState('3000');
  const [subDays, setSubDays] = useState('30');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  // Manual create subscription form
  const [createUserId, setCreateUserId] = useState('');
  const [createDays, setCreateDays] = useState('30');
  const [createAmount, setCreateAmount] = useState('3000');
  const [createPhone, setCreatePhone] = useState('');
  const [createRef, setCreateRef] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/v1/admin/config', { headers });
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setMaxSpread(String(data.config.maxSpread ?? 5));
        setSubFee(String(data.config.subscriptionFee ?? 3000));
        setSubDays(String(data.config.subscriptionDays ?? 30));
      }
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/admin/users', { headers });
      const data = await res.json();
      setUsers(data.users || []);
    } catch {}
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/v1/payments/admin/all', { headers });
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch {}
  };

  useEffect(() => {
    fetchConfig();
    fetchUsers();
    fetchSubscriptions();
  }, []);

  const toggleKillSwitch = async () => {
    setLoading('kill');
    try {
      const res = await fetch('/api/v1/admin/killswitch', {
        method: 'POST', headers,
        body: JSON.stringify({ active: !config.killSwitchActive }),
      });
      const data = await res.json();
      setConfig(prev => ({ ...prev, killSwitchActive: data.config.killSwitchActive }));
      setStatus(`Kill-switch ${data.config.killSwitchActive ? '⛔ ACTIVATED' : '✅ DEACTIVATED'}`);
    } catch { setStatus('Failed to update kill-switch'); }
    finally { setLoading(null); }
  };

  const updateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('risk');
    try {
      const res = await fetch('/api/v1/admin/risk-parameters', {
        method: 'POST', headers,
        body: JSON.stringify({ maxSpread: parseFloat(maxSpread) }),
      });
      const data = await res.json();
      setConfig(prev => ({ ...prev, maxSpread: data.config.maxSpread }));
      setStatus('✅ Risk parameters updated');
    } catch { setStatus('Failed to update risk parameters'); }
    finally { setLoading(null); }
  };

  const updateSubConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('sub');
    try {
      const res = await fetch('/api/v1/admin/subscription-config', {
        method: 'POST', headers,
        body: JSON.stringify({ subscriptionFee: parseFloat(subFee), subscriptionDays: parseInt(subDays) }),
      });
      const data = await res.json();
      setConfig(prev => ({
        ...prev,
        subscriptionFee: data.config.subscriptionFee,
        subscriptionDays: data.config.subscriptionDays,
      }));
      setStatus('✅ Subscription configuration updated');
    } catch { setStatus('Failed to update subscription config'); }
    finally { setLoading(null); }
  };

  const activateSubscription = async (subscriptionId: string, days?: number) => {
    setLoading(`activate-${subscriptionId}`);
    try {
      const res = await fetch('/api/v1/payments/admin/activate', {
        method: 'POST', headers,
        body: JSON.stringify({ subscriptionId, days }),
      });
      const data = await res.json();
      if (data.activated) {
        setStatus(`✅ Subscription activated — expires ${new Date(data.expiresAt).toLocaleDateString()}`);
        fetchSubscriptions();
      } else {
        setStatus(data.error || 'Activation failed');
      }
    } catch { setStatus('Failed to activate subscription'); }
    finally { setLoading(null); }
  };

  const createManualSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('create-sub');
    try {
      const res = await fetch('/api/v1/payments/admin/create', {
        method: 'POST', headers,
        body: JSON.stringify({
          userId: createUserId,
          days: parseInt(createDays),
          amount: parseFloat(createAmount),
          phoneNumber: createPhone,
          ref: createRef || undefined,
        }),
      });
      const data = await res.json();
      if (data.subscription) {
        setStatus(`✅ Manual subscription created — expires ${new Date(data.expiresAt).toLocaleDateString()}`);
        setCreateUserId(''); setCreatePhone(''); setCreateRef('');
        fetchSubscriptions();
      } else {
        setStatus(data.error || 'Failed to create subscription');
      }
    } catch { setStatus('Failed to create subscription'); }
    finally { setLoading(null); }
  };

  const activeUsers = users.filter(u =>
    u.subscriptions?.some((s: any) =>
      s.status === 'COMPLETED' && s.expiresAt && new Date(s.expiresAt) > new Date()
    )
  );

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'bg-brand-primary/20 text-brand-primary',
      PENDING:   'bg-yellow-900/30 text-yellow-400',
      FAILED:    'bg-red-900/30 text-red-400',
    };
    return `text-xs font-bold px-2 py-0.5 rounded-full ${map[s] || 'bg-gray-700 text-gray-400'}`;
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview',       label: 'Overview & Config', icon: Settings },
    { id: 'subscriptions',  label: 'Subscriptions',     icon: CreditCard },
    { id: 'users',          label: 'Users',             icon: Users },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand-primary" /> Admin Panel
        </h2>
        <p className="text-gray-400 text-sm">Platform management and configuration</p>
      </div>

      {status && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${status.startsWith('✅') ? 'bg-brand-primary/10 border border-brand-primary/30 text-brand-primaryLight' : 'bg-yellow-900/20 border border-yellow-700 text-yellow-400'}`}>
          <span>{status}</span>
          <button onClick={() => setStatus('')} className="text-gray-400 hover:text-white ml-4">×</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',        value: users.length,        icon: Users,      color: 'text-brand-primary' },
          { label: 'Active Subscribers', value: activeUsers.length,  icon: Shield,     color: 'text-brand-primary' },
          { label: 'Sub Fee (KES)',       value: config.subscriptionFee?.toLocaleString() ?? '—', icon: DollarSign, color: 'text-brand-primary' },
          { label: 'Sub Duration',        value: `${config.subscriptionDays ?? 30} days`, icon: Clock, color: 'text-brand-primary' },
        ].map(s => (
          <div key={s.label} className="bg-brand-card border border-brand-border rounded-2xl p-5">
            <div className="flex justify-between items-start mb-3">
              <span className="text-gray-400 text-sm">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-dark border border-brand-border rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition ${
              activeTab === t.id
                ? 'bg-brand-primary text-brand-dark'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kill Switch */}
          <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold">Emergency Kill-Switch</h3>
            </div>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              Instantly halts all trade execution across all MT5 terminals.
            </p>
            <div className="flex items-center justify-between mb-4 p-4 bg-brand-dark rounded-xl border border-brand-border">
              <div>
                <p className="font-semibold text-sm">Execution Engine</p>
                <p className={`text-xs font-bold mt-0.5 ${config.killSwitchActive ? 'text-red-400' : 'text-brand-primary'}`}>
                  {config.killSwitchActive ? '⛔ HALTED' : '✅ RUNNING'}
                </p>
              </div>
              <button onClick={toggleKillSwitch} disabled={loading === 'kill'}>
                {config.killSwitchActive
                  ? <ToggleRight className="w-10 h-10 text-red-500" />
                  : <ToggleLeft className="w-10 h-10 text-brand-primary" />}
              </button>
            </div>
            <button
              onClick={toggleKillSwitch}
              disabled={loading === 'kill'}
              className={`w-full font-bold py-3 rounded-xl text-sm transition ${
                config.killSwitchActive
                  ? 'bg-brand-primary hover:bg-brand-primaryDark text-brand-dark'
                  : 'bg-red-700 hover:bg-red-600 text-white'
              }`}
            >
              {loading === 'kill' ? 'Updating...' : config.killSwitchActive ? 'Deactivate Kill-Switch' : 'Activate Kill-Switch'}
            </button>
          </div>

          {/* Subscription Config */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
            <div className="flex items-center gap-2 text-brand-primary mb-4">
              <DollarSign className="w-5 h-5" />
              <h3 className="font-bold">Subscription Pricing</h3>
            </div>
            <p className="text-gray-400 text-sm mb-5">Set the base fee and access duration users will see.</p>
            <form onSubmit={updateSubConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subscription Fee (KES)</label>
                <input
                  type="number" min={100} value={subFee} onChange={e => setSubFee(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Base Duration (Days)</label>
                <input
                  type="number" min={1} max={365} value={subDays} onChange={e => setSubDays(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition"
                />
              </div>
              <div className="bg-brand-dark rounded-xl p-3 border border-brand-border text-xs text-gray-400">
                Current: KES {config.subscriptionFee?.toLocaleString()} / {config.subscriptionDays} days
              </div>
              <button type="submit" disabled={loading === 'sub'} className="w-full bg-brand-primary hover:bg-brand-primaryDark disabled:opacity-60 transition text-brand-dark font-bold py-3 rounded-xl text-sm">
                {loading === 'sub' ? 'Saving...' : 'Update Pricing'}
              </button>
            </form>
          </div>

          {/* Risk Parameters */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
            <div className="flex items-center gap-2 text-brand-primary mb-4">
              <Settings className="w-5 h-5" />
              <h3 className="font-bold">Risk Parameters</h3>
            </div>
            <p className="text-gray-400 text-sm mb-5">Configure market execution risk limits.</p>
            <form onSubmit={updateRisk} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Spread (pips)</label>
                <input
                  type="number" step="0.1" value={maxSpread} onChange={e => setMaxSpread(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition"
                />
                <p className="text-gray-500 text-xs mt-1.5">Signals won't execute if spread exceeds this value</p>
              </div>
              <button type="submit" disabled={loading === 'risk'} className="w-full bg-brand-accent hover:bg-blue-600 disabled:opacity-60 transition text-white font-bold py-3 rounded-xl text-sm">
                {loading === 'risk' ? 'Saving...' : 'Update Risk Parameters'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTIONS TAB ────────────────────────────────────────────── */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Manual Create */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
            <div className="flex items-center gap-2 text-brand-primary mb-4">
              <PlusCircle className="w-5 h-5" />
              <h3 className="font-bold">Create Manual Subscription</h3>
            </div>
            <p className="text-gray-400 text-sm mb-5">
              Use this for cash payments or when M-Pesa callback is missed. Subscription activates immediately.
            </p>
            <form onSubmit={createManualSubscription} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">User ID</label>
                <select
                  value={createUserId}
                  onChange={e => setCreateUserId(e.target.value)}
                  required
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition"
                >
                  <option value="">— Select User —</option>
                  {users.filter(u => u.role === 'USER').map((u: any) => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration (Days)</label>
                <input
                  type="number" min={1} max={365} value={createDays}
                  onChange={e => setCreateDays(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount (KES)</label>
                <input
                  type="number" min={0} value={createAmount}
                  onChange={e => setCreateAmount(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone (optional)</label>
                <input
                  type="tel" value={createPhone} placeholder="254XXXXXXXXX"
                  onChange={e => setCreatePhone(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary transition"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Reference (optional)</label>
                <input
                  type="text" value={createRef} placeholder="e.g. CASH_PAYMENT_001"
                  onChange={e => setCreateRef(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary transition"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading === 'create-sub' || !createUserId}
                  className="w-full bg-brand-primary hover:bg-brand-primaryDark disabled:opacity-60 transition text-brand-dark font-bold py-3 rounded-xl"
                >
                  {loading === 'create-sub' ? 'Creating...' : 'Create & Activate Subscription'}
                </button>
              </div>
            </form>
          </div>

          {/* All Subscriptions Table */}
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-primary" /> All Payments
              </h3>
              <button onClick={fetchSubscriptions} className="text-gray-400 hover:text-brand-primary transition">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-dark border-b border-brand-border">
                  <tr className="text-gray-400">
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Days</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Expires</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {subscriptions.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No payments yet</td></tr>
                  ) : subscriptions.map((s: any) => (
                    <tr key={s.id} className="hover:bg-white/2 transition">
                      <td className="px-4 py-3 font-medium text-xs">{s.user?.email || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{s.planName}</td>
                      <td className="px-4 py-3 font-semibold">KES {Number(s.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-400">{s.days}d</td>
                      <td className="px-4 py-3">
                        <span className={statusBadge(s.status)}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {s.status === 'PENDING' && (
                          <button
                            onClick={() => activateSubscription(s.id)}
                            disabled={loading === `activate-${s.id}`}
                            className="flex items-center gap-1 text-xs bg-brand-primary/10 hover:bg-brand-primary hover:text-brand-dark text-brand-primary font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {loading === `activate-${s.id}` ? '...' : 'Activate'}
                          </button>
                        )}
                        {s.status === 'COMPLETED' && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-brand-primary" /> Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-primary" /> Registered Users
            </h3>
            <span className="text-gray-400 text-sm">{users.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-dark border-b border-brand-border">
                <tr className="text-gray-400">
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Subscription</th>
                  <th className="px-6 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No users found</td></tr>
                ) : users.map((u: any) => {
                  const activeSub = u.subscriptions?.find((s: any) =>
                    s.status === 'COMPLETED' && s.expiresAt && new Date(s.expiresAt) > new Date()
                  );
                  return (
                    <tr key={u.id} className="hover:bg-white/2 transition">
                      <td className="px-6 py-4 font-medium">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${u.role === 'ADMIN' ? 'bg-red-900/30 text-red-400' : 'bg-brand-primary/10 text-brand-primary'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {activeSub ? (
                          <div>
                            <span className="text-xs font-bold bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-lg">Active</span>
                            <span className="text-gray-400 text-xs ml-2">until {new Date(activeSub.expiresAt).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No active plan</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
