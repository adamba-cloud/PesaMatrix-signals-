import { useState, useEffect } from 'react';
import { Bell, Search, TrendingUp } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardPage from './pages/DashboardPage';
import SignalsPage from './pages/SignalsPage';
import PaymentsPage from './pages/PaymentsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import Sidebar from './components/Sidebar';

type Page = 'dashboard' | 'signals' | 'payments' | 'profile' | 'admin';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [email, setEmail] = useState('');
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [hasActiveSub, setHasActiveSub] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) {
      try {
        const payload = JSON.parse(atob(t.split('.')[1]));
        setRole(payload.role);
        setEmail(payload.email || '');
        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          handleLogout();
        }
      } catch {
        handleLogout();
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetch('/api/v1/auth/subscription-status', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(d => setHasActiveSub(d.active ?? false)).catch(() => {});
    }
  }, [token]);

  const handleLogin = (t: string, mustChange: boolean, r: 'USER' | 'ADMIN') => {
    setToken(t);
    setMustChangePassword(mustChange);
    setRole(r);
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      setEmail(payload.email || '');
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setRole('USER');
    setEmail('');
    setActivePage('dashboard');
  };

  if (!token) return <LoginPage onLogin={handleLogin} />;
  if (mustChangePassword) return (
    <ChangePasswordPage
      token={token}
      onComplete={() => setMustChangePassword(false)}
    />
  );

  const displayName = email.split('@')[0].replace(/[^a-zA-Z\s]/g, ' ').trim();
  const capitalized = displayName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Trader';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'T';

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage token={token} role={role} email={email} onNavigate={(p) => setActivePage(p)} />;
      case 'signals': return <SignalsPage />;
      case 'payments': return <PaymentsPage token={token} />;
      case 'profile': return <ProfilePage token={token} email={email} role={role} />;
      case 'admin': return role === 'ADMIN' ? <AdminPage token={token} /> : <DashboardPage token={token} role={role} email={email} onNavigate={(p) => setActivePage(p)} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        role={role}
        isActive={hasActiveSub}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-brand-card/80 backdrop-blur border-b border-brand-border px-6 py-4 flex items-center gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full bg-brand-dark border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary transition"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative w-10 h-10 bg-brand-dark border border-brand-border rounded-xl flex items-center justify-center hover:border-brand-primary/50 transition">
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary rounded-full text-brand-dark text-xs font-bold flex items-center justify-center">3</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight">{capitalized}</p>
                <p className="text-xs text-brand-primary font-medium">{hasActiveSub ? 'VIP Member' : role === 'ADMIN' ? 'Administrator' : 'Standard'}</p>
              </div>
              <button
                onClick={() => setActivePage('profile')}
                className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-brand-dark font-bold text-sm hover:bg-brand-primaryDark transition"
              >
                {initials || <TrendingUp className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
