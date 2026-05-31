import React, { useState } from 'react';
import { Shield, Eye, EyeOff, TrendingUp } from 'lucide-react';

interface Props {
  token: string;
  onComplete: () => void;
}

export default function ChangePasswordPage({ token, onComplete }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (data.status) {
        onComplete();
      } else {
        setError(data.error || 'Failed to update password');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-brand-dark" />
          </div>
          <span className="text-lg font-bold">PesaMatrix Signal</span>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-2xl p-8">
          <div className="flex items-center gap-3 text-yellow-400 mb-4">
            <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white">Security Update Required</h2>
              <p className="text-xs text-gray-400">Temporary password detected</p>
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-6 bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4">
            For your account security, you must set a new password before accessing the platform.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition"
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
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primaryDark disabled:opacity-60 transition text-brand-dark font-bold py-3 rounded-xl text-sm"
            >
              {loading ? 'Updating...' : 'Set New Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
