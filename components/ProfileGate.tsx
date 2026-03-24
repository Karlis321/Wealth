'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, User, ArrowLeft, Eye, EyeOff, Loader, Trash2 } from 'lucide-react';
import {
  fetchProfiles,
  createProfile,
  verifyPassword,
  setActiveProfile,
  deleteProfile,
  type Profile,
} from '@/lib/profiles';

interface Props {
  onProfile: (name: string, key: CryptoKey) => void;
}

type Step = 'name' | 'password';

export default function ProfileGate({ onProfile }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfiles().then((p) => {
      setProfiles(p);
      setLoadingProfiles(false);
    });
  }, []);

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Enter your name.'); return; }
    setError('');
    const existing = profiles.find((p) => p.name === trimmed);
    setIsExisting(!!existing);
    setStep('password');
  }

  function selectProfile(profileName: string) {
    setName(profileName);
    setIsExisting(true);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setStep('password');
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
        const key = await verifyPassword(name, password);
        if (!key) { setError('Incorrect password.'); setLoading(false); return; }
        setActiveProfile(name);
        onProfile(name, key);
      } else {
        const { key } = await createProfile(name, password);
        onProfile(name, key);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProfile(e: React.MouseEvent, profileName: string) {
    e.stopPropagation();
    if (!confirm(`Delete profile "${profileName}"? All data will be lost.`)) return;
    await deleteProfile(profileName);
    setProfiles((prev) => prev.filter((p) => p.name !== profileName));
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Wealth</p>
            <p className="text-sm font-bold text-accent-light leading-tight">Command Center</p>
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
          {step === 'name' ? (
            <div className="space-y-5">
              {/* Existing profiles */}
              {loadingProfiles ? (
                <div className="flex items-center justify-center py-4 gap-2 text-slate-500 text-xs">
                  <Loader size={13} className="animate-spin" />
                  Loading profiles…
                </div>
              ) : profiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Select profile
                  </p>
                  {profiles.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => selectProfile(p.name)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border hover:border-accent/40 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                        <User size={13} className="text-accent-light" />
                      </div>
                      <span className="flex-1 text-sm text-slate-200 text-left">{p.name}</span>
                      <button
                        onClick={(e) => handleDeleteProfile(e, p.name)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </button>
                  ))}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex-1 h-px bg-surface-border" />
                    <span className="text-xs text-slate-600">or create new</span>
                    <div className="flex-1 h-px bg-surface-border" />
                  </div>
                </div>
              )}

              {/* Name input */}
              <form onSubmit={handleNameSubmit} className="space-y-3">
                {!loadingProfiles && profiles.length === 0 && (
                  <p className="text-xs text-slate-500">Create your profile to get started.</p>
                )}
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder="Your name…"
                    className="w-full bg-surface border border-surface-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                  />
                  {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-colors"
                >
                  Continue
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Back + title */}
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
                  {isExisting ? 'Login' : 'New profile'}
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
                    className="w-full bg-surface border border-surface-border rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
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
                    className="w-full bg-surface border border-surface-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
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
