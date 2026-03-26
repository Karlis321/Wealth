'use client';

import { useState } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency } from '@/lib/calculations';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import type { MintosAccount } from '@/lib/types';
import { format, parseISO } from 'date-fns';

// ─── Mintos SVG Logo ───────────────────────────────────────────────────────────
// Wordmark rendered as styled text matching Mintos brand identity

function MintosLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size * 4.2} height={size} viewBox="0 0 84 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mintos">
      <text
        x="0" y="15"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="16"
        letterSpacing="-0.3"
        fill="#00B14F"
      >
        mintos
      </text>
    </svg>
  );
}

// Small badge icon used in compact contexts
function MintosIcon({ size = 20 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: 'linear-gradient(135deg, #00B14F 0%, #00C957 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,177,79,0.35)',
      }}
    >
      <span style={{ color: '#fff', fontSize: size * 0.45, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1 }}>m</span>
    </div>
  );
}

// ─── Add / Edit Modal ──────────────────────────────────────────────────────────

function MintosAccountModal({
  onClose,
  initialData,
  onSave,
}: {
  onClose: () => void;
  initialData?: MintosAccount;
  onSave: (data: Omit<MintosAccount, 'id' | 'addedAt'>) => void;
}) {
  const [nickname, setNickname] = useState(initialData?.nickname ?? '');
  const [currency, setCurrency] = useState(initialData?.currency ?? 'EUR');
  const [totalInvested, setTotalInvested] = useState(initialData?.totalInvested?.toString() ?? '');
  const [availableFunds, setAvailableFunds] = useState(initialData?.availableFunds?.toString() ?? '');
  const [totalInterestEarned, setTotalInterestEarned] = useState(initialData?.totalInterestEarned?.toString() ?? '');
  const [netAnnualReturn, setNetAnnualReturn] = useState(initialData?.netAnnualReturn?.toString() ?? '');
  const [pendingPayments, setPendingPayments] = useState(initialData?.pendingPayments?.toString() ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      nickname: nickname.trim() || 'Mintos Account',
      currency,
      totalInvested: parseFloat(totalInvested) || 0,
      availableFunds: parseFloat(availableFunds) || 0,
      totalInterestEarned: parseFloat(totalInterestEarned) || 0,
      netAnnualReturn: parseFloat(netAnnualReturn) || 0,
      pendingPayments: parseFloat(pendingPayments) || 0,
      lastSynced: initialData?.lastSynced ?? null,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-2xl shadow-2xl">
        {/* Modal header with Mintos branding */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <MintosIcon size={26} />
            <div>
              <MintosLogo size={14} />
              <p className="text-[10px] text-slate-500 mt-0.5">
                {initialData ? 'Edit account data' : 'Add your portfolio'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] text-slate-500 mb-1">Nickname</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="My Mintos Account"
                className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#00B14F]/50"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00B14F]/50"
              >
                {['EUR', 'USD', 'GBP', 'CZK', 'PLN', 'DKK', 'SEK', 'NOK'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">NAR %</label>
              <input
                type="number"
                value={netAnnualReturn}
                onChange={(e) => setNetAnnualReturn(e.target.value)}
                placeholder="11.5"
                step="0.1"
                className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#00B14F]/50"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Invested in loans</label>
              <input
                type="number"
                value={totalInvested}
                onChange={(e) => setTotalInvested(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#00B14F]/50"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Available funds</label>
              <input
                type="number"
                value={availableFunds}
                onChange={(e) => setAvailableFunds(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#00B14F]/50"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Interest earned (all-time)</label>
              <input
                type="number"
                value={totalInterestEarned}
                onChange={(e) => setTotalInterestEarned(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#00B14F]/50"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Pending payments</label>
              <input
                type="number"
                value={pendingPayments}
                onChange={(e) => setPendingPayments(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#00B14F]/50"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: 'linear-gradient(135deg, #00B14F, #00C957)' }}
            >
              {initialData ? 'Save changes' : 'Add account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sync Modal ────────────────────────────────────────────────────────────────

const COOKIE_STEPS = [
  'Go to mintos.com and log in normally in your browser',
  'Press F12 → click the Network tab → refresh the page (F5)',
  'Click any request to www.mintos.com in the list',
  'Open the Headers panel → scroll to Request Headers',
  'Find the "cookie:" row → copy its entire value',
  'Paste it below and click Sync',
];

function MintosSyncModal({
  account,
  onClose,
  onSynced,
}: {
  account: MintosAccount;
  onClose: () => void;
  onSynced: (data: Partial<Omit<MintosAccount, 'id' | 'addedAt'>>) => void;
}) {
  const [cookie, setCookie] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSync(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/mintos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCookie: cookie.trim() }),
      });
      const data = await res.json() as { error?: string; _rawKeys?: string[] } & Partial<MintosAccount>;

      if (!res.ok || data.error) {
        setError(data.error ?? 'Sync failed.');
        return;
      }

      const { _rawKeys: _drop, ...accountData } = data;
      void _drop;
      setSuccess(true);
      onSynced({ ...accountData, lastSynced: new Date().toISOString() });
      setTimeout(onClose, 1800);
    } catch {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface-card border border-surface-border rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <MintosIcon size={26} />
            <div>
              <MintosLogo size={14} />
              <p className="text-[10px] text-slate-500 mt-0.5">Session sync · {account.nickname}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Why */}
          <div className="rounded-xl p-3 border" style={{ background: 'rgba(0,177,79,0.05)', borderColor: 'rgba(0,177,79,0.18)' }}>
            <p className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Zap size={11} className="text-[#00B14F]" /> Why a session cookie instead of password?
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Mintos blocks automated logins with reCAPTCHA. Instead, you log in normally in your
              browser (CAPTCHA already solved), then share the session token Mintos gave you.
              The cookie is forwarded only to Mintos&apos;s own API and is{' '}
              <span className="text-slate-400 font-medium">never stored anywhere</span>.
            </p>
          </div>

          {/* Steps */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              How to get your cookie
            </p>
            <div className="space-y-2">
              {COOKIE_STEPS.map((text, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold"
                    style={{ background: 'rgba(0,177,79,0.12)', color: '#00B14F', border: '1px solid rgba(0,177,79,0.25)' }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Example */}
          <div className="rounded-xl p-3 border border-surface-border bg-surface">
            <p className="text-[10px] text-slate-600 mb-1 font-medium">The value looks like:</p>
            <p className="text-[10px] text-slate-500 font-mono break-all leading-relaxed">
              _ga=GA1.2.xxx; lang=en; cf_clearance=AbC123...; session=eyJhbGciOi...
            </p>
          </div>
        </div>

        {/* Form — pinned bottom */}
        <form onSubmit={handleSync} className="px-5 pb-5 pt-3 border-t border-surface-border flex-shrink-0 space-y-3">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">
              Paste your cookie header value
            </label>
            <div className="relative">
              <textarea
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                onFocus={() => setRevealed(true)}
                required
                rows={3}
                placeholder="_ga=GA1.2...; session=eyJ..."
                className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-[#00B14F]/50 font-mono resize-none"
                style={{ filter: revealed ? 'none' : 'blur(3px)', transition: 'filter 0.2s' }}
              />
              {!revealed && (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Eye size={13} /> Click to paste cookie
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle size={12} className="text-green-400" />
              <p className="text-[11px] text-green-300">Synced! Updating your portfolio…</p>
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-surface-hover transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success || !cookie.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #00B14F, #00C957)' }}
            >
              {loading && <RefreshCw size={12} className="animate-spin" />}
              {loading ? 'Fetching data…' : 'Sync now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Account Row ───────────────────────────────────────────────────────────────

function MintosAccountRow({
  account,
  onEdit,
  onDelete,
  onSync,
}: {
  account: MintosAccount;
  onEdit: () => void;
  onDelete: () => void;
  onSync: () => void;
}) {
  const totalValue = account.totalInvested + account.availableFunds;

  return (
    <div
      className="bg-surface rounded-2xl p-3.5 border group transition-all duration-200 hover:border-[#00B14F]/30"
      style={{ borderColor: 'rgba(255,255,255,0.05)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <MintosIcon size={18} />
            <span className="text-sm font-semibold text-slate-200">{account.nickname}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ color: '#00B14F', background: 'rgba(0,177,79,0.1)', border: '1px solid rgba(0,177,79,0.2)' }}>
              P2P
            </span>
            <span className="text-[10px] text-slate-600">{account.currency}</span>
          </div>
          {account.lastSynced ? (
            <p className="text-[10px] text-slate-600 mt-0.5 ml-0.5">
              Synced {format(parseISO(account.lastSynced), 'MMM d, HH:mm')}
            </p>
          ) : (
            <p className="text-[10px] text-slate-600 mt-0.5 ml-0.5">Manual entry</p>
          )}
        </div>

        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={onSync}
            className="text-slate-500 hover:text-[#00B14F] p-1 rounded transition-colors"
            title="Auto-sync from Mintos"
          >
            <RefreshCw size={11} />
          </button>
          <button onClick={onEdit} className="text-slate-500 hover:text-slate-200 p-1 rounded transition-colors">
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => { if (confirm(`Remove "${account.nickname}"?`)) onDelete(); }}
            className="text-slate-500 hover:text-down p-1 rounded transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
        <MetricCell
          label="Total value"
          value={formatCurrency(totalValue, account.currency, true)}
          accent="text-[#00B14F]"
        />
        <MetricCell
          label="Invested"
          value={formatCurrency(account.totalInvested, account.currency, true)}
        />
        <MetricCell
          label="Available"
          value={formatCurrency(account.availableFunds, account.currency, true)}
        />
        <MetricCell
          label="NAR"
          value={`${account.netAnnualReturn.toFixed(1)}%`}
          accent={
            account.netAnnualReturn >= 10
              ? 'text-up'
              : account.netAnnualReturn >= 6
              ? 'text-amber-400'
              : 'text-slate-300'
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-600">
          Interest earned:{' '}
          <span className="text-up font-mono">
            +{formatCurrency(account.totalInterestEarned, account.currency)}
          </span>
        </span>
        {account.pendingPayments > 0 && (
          <span className="text-[10px] text-amber-400 font-mono">
            {formatCurrency(account.pendingPayments, account.currency)} pending
          </span>
        )}
      </div>
    </div>
  );
}

function MetricCell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-600 mb-0.5">{label}</p>
      <p className={`text-xs font-mono font-medium ${accent ?? 'text-slate-300'}`}>{value}</p>
    </div>
  );
}

// ─── Empty / Connect Banner ────────────────────────────────────────────────────

function MintosConnectBanner({ onConnect }: { onConnect: () => void }) {
  return (
    <button
      onClick={onConnect}
      className="w-full group rounded-2xl border border-dashed transition-all duration-200 hover:border-[#00B14F]/40 p-5 flex flex-col items-center gap-3 text-center"
      style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,177,79,0.02)' }}
    >
      {/* Big Mintos icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #00B14F 0%, #00C957 100%)', boxShadow: '0 4px 20px rgba(0,177,79,0.3)' }}
      >
        <span style={{ color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>m</span>
      </div>

      <div>
        <MintosLogo size={18} />
        <p className="text-xs text-slate-500 mt-1.5">P2P lending platform</p>
      </div>

      <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity group-hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #00B14F, #00C957)', boxShadow: '0 2px 10px rgba(0,177,79,0.3)' }}>
        <Plus size={12} />
        Add your Mintos portfolio
      </div>

      <p className="text-[10px] text-slate-600 max-w-xs leading-relaxed">
        Track your P2P loan investments alongside stocks and obligations.
        Enter data manually or try auto-sync.
      </p>
    </button>
  );
}

// ─── Main Card ─────────────────────────────────────────────────────────────────

export default function MintosCard() {
  const { store, addMintos, editMintos, removeMintos } = usePortfolio();
  const accounts = store.mintosAccounts ?? [];

  const [showAdd, setShowAdd] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MintosAccount | null>(null);
  const [syncingAccount, setSyncingAccount] = useState<MintosAccount | null>(null);

  const totalValue = accounts.reduce((sum, a) => sum + a.totalInvested + a.availableFunds, 0);
  const displayCurrency = accounts[0]?.currency ?? 'EUR';

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <MintosIcon size={20} />
          <MintosLogo size={13} />
          {accounts.length > 0 && (
            <>
              <span className="text-xs bg-surface px-1.5 py-0.5 rounded-full text-slate-500">
                {accounts.length}
              </span>
              <span className="text-xs font-mono" style={{ color: '#00B14F' }}>
                {formatCurrency(totalValue, displayCurrency, true)}
              </span>
            </>
          )}
        </div>
        {accounts.length > 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: '#00B14F' }}
          >
            <Plus size={13} /> Add
          </button>
        )}
      </div>

      {/* Empty → show the clickable connect banner */}
      {accounts.length === 0 ? (
        <MintosConnectBanner onConnect={() => setShowAdd(true)} />
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <MintosAccountRow
              key={account.id}
              account={account}
              onEdit={() => setEditingAccount(account)}
              onDelete={() => removeMintos(account.id)}
              onSync={() => setSyncingAccount(account)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <MintosAccountModal
          onClose={() => setShowAdd(false)}
          onSave={(data) => addMintos(data)}
        />
      )}
      {editingAccount && (
        <MintosAccountModal
          onClose={() => setEditingAccount(null)}
          initialData={editingAccount}
          onSave={(data) => editMintos(editingAccount.id, data)}
        />
      )}
      {syncingAccount && (
        <MintosSyncModal
          account={syncingAccount}
          onClose={() => setSyncingAccount(null)}
          onSynced={(data) => editMintos(syncingAccount.id, data)}
        />
      )}
    </div>
  );
}
