import { useState } from 'react';
import { User, Mail, Phone, MessageCircle, Eye, EyeOff, Shield } from 'lucide-react';

interface Props { token: string; email: string; role: 'USER' | 'ADMIN'; }

export default function ProfilePage({ token, email, role }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { setStatus('Passwords do not match'); return; }
    if (newPassword.length < 8) { setStatus('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      setStatus(data.status ? '✅ Password updated successfully' : (data.error || 'Failed to update'));
      if (data.status) { setNewPassword(''); setConfirm(''); }
    } catch { setStatus('Connection error'); }
    finally { setLoading(false); }
  };

  const displayName = email.split('@')[0].replace(/[^a-zA-Z\s]/g, ' ').trim();
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold mb-1">Profile</h2>
        <p className="text-gray-400 text-sm">Manage your account details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-brand-border">
            <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center text-brand-dark font-bold text-xl flex-shrink-0">
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-lg capitalize">{displayName || 'Trader'}</h3>
              <p className="text-gray-400 text-sm">{email}</p>
              <span className={`inline-block mt-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${role === 'ADMIN' ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30'}`}>
                {role}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 py-3 border-b border-brand-border">
              <Mail className="w-4 h-4 text-brand-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3 border-b border-brand-border">
              <User className="w-4 h-4 text-brand-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Account Type</p>
                <p className="text-sm font-medium">{role === 'ADMIN' ? 'Administrator' : 'Standard Trader'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3">
              <Shield className="w-4 h-4 text-brand-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Account Security</p>
                <p className="text-sm font-medium">Password Protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold mb-5">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary transition"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary transition"
              />
            </div>
            {status && (
              <div className={`p-3 rounded-xl text-sm ${status.startsWith('✅') ? 'bg-brand-primary/10 border border-brand-primary/30 text-brand-primaryLight' : 'bg-red-900/20 border border-red-800 text-red-400'}`}>
                {status}
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full bg-brand-primary hover:bg-brand-primaryDark disabled:opacity-60 transition text-brand-dark font-bold py-3 rounded-xl text-sm">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Contact Support */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold mb-4">Contact & Support</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a href="tel:+254781585319" className="flex items-center gap-3 p-4 bg-brand-dark border border-brand-border rounded-xl hover:border-brand-primary/50 transition group">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center group-hover:bg-brand-primary/20 transition">
                <Phone className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone 1</p>
                <p className="font-semibold text-sm">+254 781 585 319</p>
              </div>
            </a>
            <a href="tel:+254717434943" className="flex items-center gap-3 p-4 bg-brand-dark border border-brand-border rounded-xl hover:border-brand-primary/50 transition group">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center group-hover:bg-brand-primary/20 transition">
                <Phone className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone 2</p>
                <p className="font-semibold text-sm">+254 717 434 943</p>
              </div>
            </a>
            <a href="https://wa.me/254717434943" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-brand-dark border border-brand-border rounded-xl hover:border-green-500/30 transition group">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition">
                <MessageCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">WhatsApp</p>
                <p className="font-semibold text-sm">+254 717 434 943</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
