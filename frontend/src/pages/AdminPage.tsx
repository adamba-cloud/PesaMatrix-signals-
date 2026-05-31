import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, DollarSign, Clock, Users, ToggleLeft, ToggleRight, Settings } from 'lucide-react';

interface Props { token: string; }

interface Config {
  killSwitchActive: boolean;
  maxSpread: number;
  subscriptionFee: number;
  subscriptionDays: number;
}

export default function AdminPage({ token }: Props) {
  const [config, setConfig] = useState<Config>({
    killSwitchActive: false,
    maxSpread: 5,
    subscriptionFee: 3000,
    subscriptionDays: 30,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [maxSpread, setMaxSpread] = useState('5');
  const [subFee, setSubFee] = useState('3000');
  const [subDays, setSubDays] = useState('30');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

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

  useEffect(() => {
    fetchConfig();
    fetchUsers();
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
      setStatus(`Kill-switch ${data.config.killSwitchActive ? 'ACTIVATED' : 'DEACTIVATED'}`);
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
      setConfig(prev => ({ ...prev, subscriptionFee: data.config.subscriptionFee, subscriptionDays: data.config.subscriptionDays }));
      setStatus('✅ Subscription configuration updated');
    } catch { setStatus('Failed to update subscription config'); }
    finally { setLoading(null); }
  };

  const activeUsers = users.filter(u => u.subscriptions?.some((s: any) => s.status === 'COMPLETED' && s.expiresAt && new Date(s.expiresAt) > new Date()));

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand-primary" /> Admin Panel
        </h2>
        <p className="text-gray-400 text-sm">Platform management and configuration</p>
      </div>

      {status && (
        <div className={`p-4 rounded-xl text-sm font-medium ${status.startsWith('✅') ? 'bg-brand-primary/10 border border-brand-primary/30 text-brand-primaryLight' : 'bg-yellow-900/20 border border-yellow-700 text-yellow-400'}`}>
          {status}
          <button onClick={() => setStatus('')} className="ml-3 text-gray-400 hover:text-white">×</button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'text-brand-primary' },
          { label: 'Active Subscribers', value: activeUsers.length, icon: Shield, color: 'text-brand-primary' },
          { label: 'Sub Fee (KES)', value: config.subscriptionFee?.toLocaleString() ?? '—', icon: DollarSign, color: 'text-brand-primary' },
          { label: 'Sub Duration', value: `${config.subscriptionDays ?? 30} days`, icon: Clock, color: 'text-brand-primary' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kill Switch */}
        <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-red-400 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold">Emergency Kill-Switch</h3>
          </div>
          <p className="text-gray-400 text-sm mb-5 leading-relaxed">
            Instantly halts all trade execution across all MT5 terminals on the platform.
          </p>
          <div className="flex items-center justify-between mb-4 p-4 bg-brand-dark rounded-xl border border-brand-border">
            <div>
              <p className="font-semibold text-sm">Execution Engine</p>
              <p className={`text-xs font-bold mt-0.5 ${config.killSwitchActive ? 'text-red-400' : 'text-brand-primary'}`}>
                {config.killSwitchActive ? '⛔ HALTED' : '✅ RUNNING'}
              </p>
            </div>
            <button onClick={toggleKillSwitch} disabled={loading === 'kill'} className="transition">
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
          <p className="text-gray-400 text-sm mb-5">Set the subscription fee and access duration for users.</p>
          <form onSubmit={updateSubConfig} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subscription Fee (KES)</label>
              <input
                type="number"
                min={100}
                value={subFee}
                onChange={e => setSubFee(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Access Duration (Days)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={subDays}
                onChange={e => setSubDays(e.target.value)}
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
                type="number"
                step="0.1"
                value={maxSpread}
                onChange={e => setMaxSpread(e.target.value)}
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

      {/* Users Table */}
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
                const activeSub = u.subscriptions?.find((s: any) => s.status === 'COMPLETED' && s.expiresAt && new Date(s.expiresAt) > new Date());
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
    </div>
  );
}
