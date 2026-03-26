'use client';

import { useState } from 'react';
import { TrendingUp, User, ArrowLeft, Eye, EyeOff, Loader } from 'lucide-react';
import {
  checkProfileExists,
  createProfile,
  verifyPassword,
  setActiveProfile,
} from '@/lib/profiles';

interface Props {
  onProfile: (name: string, key: CryptoKey) => void;
}

type Step = 'name' | 'password';

export default function ProfileGate({ onProfile }: Props) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Enter your name.'); return; }
    setError('');
    setLoading(true);
    try {
      const exists = await checkProfileExists(trimmed);
      setIsExisting(exists);
      setStep('password');
    } catch {
      setError('Connection error. Check your internet.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!isExisting && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isExisting) {
        const key = await verifyPassword(name.trim(), password);
        if (!key) { setError('Incorrect password.'); setLoading(false); return; }
        setActiveProfile(name.trim());
        onProfile(name.trim(), key);
      } else {
        const { key } = await createProfile(name.trim(), password);
        onProfile(name.trim(), key);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#07070f' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 60%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 60% at 80% 100%, rgba(139,92,246,0.05) 0%, transparent 55%)' }} />

      <div className="w-full max-w-sm relative animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', boxShadow: '0 8px 28px rgba(99,102,241,0.5)' }}>
            <TrendingUp size={22} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-white leading-tight">Wealth</p>
            <p className="text-base font-bold leading-tight text-gradient">Command Center</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl" style={{
          background: 'linear-gradient(160deg, rgba(15,15,28,0.99) 0%, rgba(10,10,18,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.06) inset',
        }}>
          {step === 'name' ? (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <p className="text-xs text-slate-500">Enter your name to continue.</p>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Name</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Your name…"
                  className="input"
                />
                {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <Loader size={13} className="animate-spin" />}
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Back + profile name */}
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => { setStep('name'); setError(''); setPassword(''); setConfirmPassword(''); }}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-surface-hover transition-colors"
                >
                  <ArrowLeft size={14} />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center">
                    <User size={11} className="text-accent-light" />
                  </div>
                  <span className="text-sm font-semibold text-slate-200">{name}</span>
                </div>
                <span className="text-xs text-slate-600 ml-auto">
                  {isExisting ? 'Welcome back' : 'New profile'}
                </span>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    autoFocus
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter password…"
                    className="input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm password — only for new profiles */}
              {!isExisting && (
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Repeat password…"
                    className="input"
                  />
                </div>
              )}

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {loading && <Loader size={13} className="animate-spin" />}
                {isExisting ? 'Login' : 'Create Profile'}
              </button>

              {!isExisting && (
                <p className="text-[10px] text-slate-600 text-center">
                  Your data is encrypted with your password. If you forget it, your data cannot be recovered.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
