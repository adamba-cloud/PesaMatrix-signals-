import React, { useState } from 'react';
import { Shield, Key, CreditCard, Cpu, Radio, ToggleLeft, AlertTriangle } from 'lucide-react';

export default function App() {
  // Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');

  // Business Action States
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('3000');
  const [mt5Login, setMt5Login] = useState('');
  const [mt5Password, setMt5Password] = useState('');
  const [mt5Server, setMt5Server] = useState('');
  
  // Admin Panel States
  const [killSwitch, setKillSwitch] = useState(false);
  const [maxSpread, setMaxSpread] = useState('5.0');
  const [statusMessage, setStatusMessage] = useState('');

  const API_URL = '/api/v1';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setMustChangePassword(data.mustChangePassword);
        // Basic JWT Decode for Role separation
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        setRole(payload.role);
        setStatusMessage('Authenticated successfully.');
      } else {
        setStatusMessage(data.error || 'Authentication rejected');
      }
    } catch {
      setStatusMessage('Network connectivity error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (data.status) {
        setMustChangePassword(false);
        setStatusMessage('Seeded admin password overwritten successfully.');
      }
    } catch {
      setStatusMessage('Failed updating password.');
    }
  };

  const handleStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/payments/stk`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumber: phone, amount: parseFloat(amount) })
      });
      const data = await res.json();
      setStatusMessage(`STK Push Prompted. CheckoutRequestID: ${data.CheckoutRequestID || 'Check Logs'}`);
    } catch {
      setStatusMessage('Failed to prompt Live M-Pesa gateway.');
    }
  };

  const handleProvisionTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/mt5/provision`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ login: mt5Login, password: mt5Password, server: mt5Server })
      });
      const data = await res.json();
      setStatusMessage(`Terminal provisioning response: ${data.status || data.error}`);
    } catch {
      setStatusMessage('Terminal generation transmission failed.');
    }
  };

  const handleToggleKillSwitch = async (targetState: boolean) => {
    try {
      const res = await fetch(`${API_URL}/admin/killswitch`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: targetState })
      });
      const data = await res.json();
      setKillSwitch(data.config.killSwitchActive);
      setStatusMessage(`Global connection status altered. Kill-Switch Active: ${data.config.killSwitchActive}`);
    } catch {
      setStatusMessage('Admin command route failure.');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
        <div className="bg-brand-card border border-brand-border p-8 rounded-xl w-full max-w-md shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="text-brand-primary w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight">PESAMATRIX SIGNAL</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Corporate Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-brand-dark border border-brand-border rounded px-3 py-2 text-white focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Secure Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-brand-dark border border-brand-border rounded px-3 py-2 text-white focus:outline-none focus:border-brand-primary" />
            </div>
            <button type="submit" className="w-full bg-brand-primary hover:bg-emerald-600 transition text-brand-dark font-bold py-2 rounded">Authenticate Securely</button>
          </form>
          {statusMessage && <div className="mt-4 p-3 bg-brand-dark border border-brand-border text-sm rounded text-yellow-400 font-mono">{statusMessage}</div>}
        </div>
      </div>
    );
  }

  if (mustChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
        <div className="bg-brand-card border border-brand-border p-8 rounded-xl w-full max-w-md shadow-2xl">
          <div className="flex items-center gap-2 text-yellow-500 mb-4">
            <Shield className="w-6 h-6" />
            <h2 className="text-xl font-bold">Enforced Security Update</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Seeded administrator credentials detected. You must explicitly override the structural security sequence before accessing data metrics.</p>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">New Production Password</label>
              <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-brand-dark border border-brand-border rounded px-3 py-2 text-white focus:outline-none focus:border-brand-primary" />
            </div>
            <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 transition text-white font-bold py-2 rounded">Commit New Secret Key</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-gray-100">
      {/* Top Banner Navigation */}
      <header className="border-b border-brand-border bg-brand-card px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Cpu className="text-brand-primary w-6 h-6" />
          <span className="font-bold text-lg tracking-wider">PESAMATRIX ENGINE</span>
          <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${role === 'ADMIN' ? 'bg-red-900/50 text-red-400 border border-red-700' : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30'}`}>
            {role} CONSOLE
          </span>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-sm bg-brand-border hover:bg-gray-700 px-4 py-1.5 rounded transition">Disconnect Session</button>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status System Log */}
        {statusMessage && (
          <div className="col-span-1 lg:col-span-3 bg-brand-card border border-brand-primary/30 p-4 rounded-xl flex items-center gap-3 text-brand-primary font-mono text-sm">
            <Radio className="animate-pulse w-5 h-5 flex-shrink-0" />
            <span>Telemetry Log: {statusMessage}</span>
          </div>
        )}

        {/* ADMIN CMS ZONE */}
        {role === 'ADMIN' && (
          <div className="col-span-1 lg:col-span-3 bg-red-950/20 border border-red-900/50 p-6 rounded-xl space-y-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-bold tracking-wide">Emergency Infrastructure Parameters</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-brand-dark p-4 rounded-lg border border-brand-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Master Connectivity Kill-Switch</h3>
                  <p className="text-xs text-gray-400 mt-1">Instantly drops execution pipelines across all MT5 terminals.</p>
                </div>
                <button 
                  onClick={() => handleToggleKillSwitch(!killSwitch)}
                  className={`px-4 py-2 rounded font-bold text-sm transition ${killSwitch ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-brand-border hover:bg-gray-600 text-gray-300'}`}
                >
                  {killSwitch ? 'ACTIVE — Click to Deactivate' : 'INACTIVE — Click to Activate'}
                </button>
              </div>

              <div className="bg-brand-dark p-4 rounded-lg border border-brand-border">
                <h3 className="font-bold text-sm mb-3">Risk Parameter Configuration</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Max Spread (pips)</label>
                    <input
                      type="number"
                      value={maxSpread}
                      onChange={e => setMaxSpread(e.target.value)}
                      className="w-full bg-brand-card border border-brand-border rounded px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_URL}/admin/risk-parameters`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ maxSpread: parseFloat(maxSpread) })
                        });
                        const data = await res.json();
                        setStatusMessage(`Risk params updated. Max Spread: ${data.config?.maxSpread}`);
                      } catch {
                        setStatusMessage('Risk parameter update failed.');
                      }
                    }}
                    className="w-full bg-brand-accent hover:bg-blue-600 transition text-white font-bold py-2 rounded text-sm"
                  >
                    Update Risk Parameters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* M-Pesa Subscription Panel */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-brand-primary">
            <CreditCard className="w-5 h-5" />
            <h2 className="font-bold tracking-wide">M-Pesa Subscription</h2>
          </div>
          <form onSubmit={handleStkPush} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="254712345678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Amount (KES)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
            <button type="submit" className="w-full bg-brand-primary hover:bg-emerald-600 transition text-brand-dark font-bold py-2 rounded text-sm">
              Initiate STK Push
            </button>
          </form>
        </div>

        {/* MT5 Terminal Provisioning */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-brand-primary">
            <Key className="w-5 h-5" />
            <h2 className="font-bold tracking-wide">MT5 Terminal Provisioning</h2>
          </div>
          <form onSubmit={handleProvisionTerminal} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">MT5 Login</label>
              <input
                type="text"
                value={mt5Login}
                onChange={e => setMt5Login(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">MT5 Password</label>
              <input
                type="password"
                value={mt5Password}
                onChange={e => setMt5Password(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Broker Server</label>
              <input
                type="text"
                placeholder="BrokerName-Live"
                value={mt5Server}
                onChange={e => setMt5Server(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
            <button type="submit" className="w-full bg-brand-accent hover:bg-blue-600 transition text-white font-bold py-2 rounded text-sm">
              Provision Cloud Terminal
            </button>
          </form>
        </div>

        {/* System Status */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-brand-primary">
            <ToggleLeft className="w-5 h-5" />
            <h2 className="font-bold tracking-wide">System Status</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-brand-border">
              <span className="text-gray-400">Execution Engine</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${killSwitch ? 'text-red-400 bg-red-900/30' : 'text-brand-primary bg-brand-primary/10'}`}>
                {killSwitch ? 'HALTED' : 'ONLINE'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-brand-border">
              <span className="text-gray-400">Session Role</span>
              <span className="font-mono font-bold text-xs text-brand-accent">{role}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Platform</span>
              <span className="font-mono text-xs text-gray-300">PESAMATRIX v1.0</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

