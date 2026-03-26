'use client';

import { useState, useEffect } from 'react';
import { PortfolioProvider } from '@/lib/PortfolioContext';
import { loadProfiles, saveProfiles } from '@/lib/profiles';
import NavSidebar from './NavSidebar';
import MainPanel from './MainPanel';
import DividendCalendar from './DividendCalendar';
import ProfileGate from './ProfileGate';
import { TrendingUp, LayoutDashboard, Calendar, Menu, X } from 'lucide-react';

export default function Dashboard() {
  const [profileName, setProfileName] = useState<string | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileTab, setMobileTab] = useState<'portfolio' | 'calendar'>('portfolio');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  function handleProfileSelected(name: string, key: CryptoKey) {
    setProfileName(name);
    setCryptoKey(key);
  }

  function handleSwitchProfile() {
    const current = loadProfiles();
    saveProfiles({ ...current, activeProfile: null });
    setProfileName(null);
    setCryptoKey(null);
  }

  if (!ready) return null;

  if (!profileName || !cryptoKey) {
    return <ProfileGate onProfile={handleProfileSelected} />;
  }

  return (
    <PortfolioProvider
      profileName={profileName}
      cryptoKey={cryptoKey}
      switchProfile={handleSwitchProfile}
    >
      {/* ── Desktop: classic three-panel layout ── */}
      <div className="hidden md:flex h-screen overflow-hidden bg-surface">
        <NavSidebar />
        <MainPanel />
        <div id="section-dividends" className="flex-shrink-0"><DividendCalendar /></div>
      </div>

      {/* ── Mobile: stacked layout with bottom navigation ── */}
      <div className="flex md:hidden flex-col bg-surface overflow-hidden" style={{ height: '100dvh' }}>
        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 h-14 border-b border-surface-border bg-surface-card/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow: '0 4px 10px rgba(99,102,241,0.4)' }}>
              <TrendingUp size={13} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-bold text-white">Wealth</p>
              <p className="text-[11px] font-bold text-gradient">Command Center</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-hover transition-colors"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </header>

        {/* Content — fills space between header and bottom nav */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {mobileTab === 'portfolio' && <MainPanel />}
          {mobileTab === 'calendar' && <DividendCalendar mobile />}
        </div>

        {/* Bottom navigation */}
        <nav className="flex-shrink-0 flex border-t border-surface-border bg-surface-card/90 backdrop-blur-md">
          <button
            onClick={() => setMobileTab('portfolio')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all duration-200 relative ${
              mobileTab === 'portfolio' ? 'text-accent-light mobile-tab-active' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard size={17} />
            <span>Portfolio</span>
          </button>
          <button
            onClick={() => setMobileTab('calendar')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all duration-200 relative ${
              mobileTab === 'calendar' ? 'text-amber-400 mobile-tab-active' : 'text-slate-500'
            }`}
          >
            <Calendar size={17} />
            <span>Dividends</span>
          </button>
        </nav>

        {/* Slide-out sidebar drawer */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-surface-card border-r border-surface-border flex flex-col animate-slide-in-left overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border flex-shrink-0">
                <span className="text-sm font-semibold text-slate-200">Menu</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <NavSidebar
                mobile
                onClose={() => setSidebarOpen(false)}
                onNavigate={(tab) => { setMobileTab(tab); setSidebarOpen(false); }}
              />
              </div>
            </div>
          </>
        )}
      </div>
    </PortfolioProvider>
  );
}
