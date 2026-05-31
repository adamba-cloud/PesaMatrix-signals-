import { TrendingUp, LayoutDashboard, Radio, CreditCard, User, Shield, LogOut, Crown, Phone, MessageCircle } from 'lucide-react';

type Page = 'dashboard' | 'signals' | 'payments' | 'profile' | 'admin';

interface SidebarProps {
  activePage: Page;
  setActivePage: (p: Page) => void;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  onLogout: () => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'signals' as Page, label: 'Signals', icon: Radio },
  { id: 'payments' as Page, label: 'Payments', icon: CreditCard },
  { id: 'profile' as Page, label: 'Profile', icon: User },
];

export default function Sidebar({ activePage, setActivePage, role, isActive, onLogout }: SidebarProps) {
  return (
    <aside className="w-60 min-h-screen bg-brand-card border-r border-brand-border flex flex-col fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-brand-dark" />
          </div>
          <div>
            <span className="font-bold text-sm block leading-tight">PesaMatrix</span>
            <span className="text-brand-primary text-xs font-semibold">SaaS</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-primary text-brand-dark'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          );
        })}

        {role === 'ADMIN' && (
          <button
            onClick={() => setActivePage('admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activePage === 'admin'
                ? 'bg-brand-primary text-brand-dark'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            Admin Panel
            <span className="ml-auto text-xs bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded-md font-bold">
              Admin
            </span>
          </button>
        )}
      </nav>

      {/* VIP / Active card */}
      <div className="px-3 pb-3">
        <div className={`rounded-xl p-4 ${isActive ? 'bg-brand-primary/10 border border-brand-primary/30' : 'bg-brand-card2 border border-brand-border'}`}>
          <div className={`flex items-center gap-2 mb-2 ${isActive ? 'text-brand-primary' : 'text-gray-400'}`}>
            <Crown className="w-4 h-4" />
            <span className="font-bold text-sm">{isActive ? 'Active Access' : 'No Subscription'}</span>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed mb-3">
            {isActive
              ? 'You have full access to all VIP signals.'
              : 'Subscribe to access all signals and features.'}
          </p>
          <button
            onClick={() => setActivePage('payments')}
            className="w-full bg-brand-primary hover:bg-brand-primaryDark transition text-brand-dark text-xs font-bold py-2 rounded-lg"
          >
            {isActive ? 'Manage Plan' : 'Subscribe Now'}
          </button>
        </div>

        {/* Contacts */}
        <div className="mt-3 space-y-1.5">
          <a href="tel:+254781585319" className="flex items-center gap-2 text-gray-500 hover:text-brand-primary transition text-xs px-1">
            <Phone className="w-3 h-3" /> +254 781 585 319
          </a>
          <a href="tel:+254717434943" className="flex items-center gap-2 text-gray-500 hover:text-brand-primary transition text-xs px-1">
            <Phone className="w-3 h-3" /> +254 717 434 943
          </a>
          <a href="https://wa.me/254717434943" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-500 hover:text-green-400 transition text-xs px-1">
            <MessageCircle className="w-3 h-3" /> WhatsApp Support
          </a>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-brand-border pt-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-900/10 transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
