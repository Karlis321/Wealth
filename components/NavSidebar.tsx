'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Calendar,
  Tag,
  Plus,
  ChevronRight,
  RefreshCw,
  Wifi,
  WifiOff,
  User,
  LogOut,
} from 'lucide-react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency } from '@/lib/calculations';
import { format } from 'date-fns';
import AddAssetModal from './AddAssetModal';
import AddObligationModal from './AddObligationModal';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', scrollTarget: 'main-scroll' },
  { icon: TrendingUp, label: 'Public Assets', scrollTarget: 'section-assets' },
  { icon: CreditCard, label: 'Obligations', scrollTarget: 'section-obligations' },
  { icon: Calendar, label: 'Dividends', scrollTarget: 'section-dividends', tab: 'calendar' as const },
];

interface NavSidebarProps {
  mobile?: boolean;
  onClose?: () => void;
  onNavigate?: (tab: 'portfolio' | 'calendar') => void;
}

export default function NavSidebar({ mobile, onClose, onNavigate }: NavSidebarProps = {}) {
  const { store, summary, profileName, switchProfile, activeTagFilter, setActiveTagFilter, lastRefreshed, pricesLoading, refreshPrices } =
    usePortfolio();
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddObligation, setShowAddObligation] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  function handleNavClick(item: typeof NAV_ITEMS[number]) {
    setActiveNav(item.label);
    if (item.tab && onNavigate) {
      onNavigate(item.tab);
      return;
    }
    if (item.scrollTarget) {
      document.getElementById(item.scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const tagCounts = store.tags.reduce<Record<string, number>>((acc, tag) => {
    const count =
      store.publicAssets.filter((a) => a.tags.includes(tag)).length +
      store.privateObligations.filter((o) => o.tags.includes(tag)).length;
    acc[tag] = count;
    return acc;
  }, {});

  return (
    <>
      <aside className={`${mobile ? 'w-full h-full' : 'w-56 flex-shrink-0 border-r border-surface-border'} flex flex-col bg-surface-card overflow-hidden`}>
        {/* Logo */}
        <div className="p-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <TrendingUp size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Wealth</p>
              <p className="text-xs font-bold text-accent-light leading-tight">Command Center</p>
            </div>
          </div>
          {/* Active profile */}
          <div className="flex items-center gap-1.5 mt-2.5 px-0.5">
            <User size={11} className="text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-400 truncate">{profileName}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-3 border-b border-surface-border space-y-1.5">
          <Stat label="Positions" value={summary.assetCount} />
          <Stat label="Obligations" value={summary.obligationCount} />
          <Stat
            label="Monthly Div."
            value={formatCurrency(summary.estimatedMonthlyDividend, store.baseCurrency, true)}
            accent
          />
        </div>

        {/* Navigation */}
        <nav className="p-2 border-b border-surface-border">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.label;
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/15 text-accent-light'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-surface-hover'
                }`}
              >
                <item.icon size={15} />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={12} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Asset Tags */}
        <div className="p-3 flex-1 overflow-y-auto">
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={11} className="text-slate-500" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tags
            </span>
          </div>
          <div className="space-y-1">
            {store.tags.map((tag) => {
              const count = tagCounts[tag] ?? 0;
              const active = activeTagFilter === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTagFilter(active ? null : tag)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    active
                      ? 'bg-accent/20 text-accent-light border border-accent/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-surface-hover'
                  }`}
                >
                  <span>{tag}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-accent/30 text-accent-light' : 'bg-surface text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-surface-border space-y-2">
          {/* Refresh status */}
          <button
            onClick={refreshPrices}
            disabled={pricesLoading}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-surface-hover transition-colors"
          >
            {pricesLoading ? (
              <RefreshCw size={11} className="animate-spin text-accent" />
            ) : lastRefreshed ? (
              <Wifi size={11} className="text-up" />
            ) : (
              <WifiOff size={11} />
            )}
            <span>
              {pricesLoading
                ? 'Refreshing…'
                : lastRefreshed
                ? `${format(lastRefreshed, 'HH:mm:ss')}`
                : 'No data yet'}
            </span>
          </button>

          {/* Add buttons */}
          <button
            onClick={() => setShowAddAsset(true)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent-light text-xs font-medium transition-colors"
          >
            <Plus size={13} />
            Add Public Asset
          </button>
          <button
            onClick={() => setShowAddObligation(true)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface-hover hover:bg-surface-border text-slate-400 text-xs font-medium transition-colors"
          >
            <Plus size={13} />
            Add Obligation
          </button>

          {/* Switch profile */}
          <button
            onClick={() => { switchProfile(); onClose?.(); }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-surface-hover text-xs transition-colors"
          >
            <LogOut size={11} />
            Switch Profile
          </button>
        </div>
      </aside>

      {showAddAsset && <AddAssetModal onClose={() => setShowAddAsset(false)} />}
      {showAddObligation && (
        <AddObligationModal onClose={() => setShowAddObligation(false)} />
      )}
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-600">{label}</span>
      <span
        className={`text-xs font-mono font-medium ${accent ? 'text-up' : 'text-slate-300'}`}
      >
        {value}
      </span>
    </div>
  );
}
