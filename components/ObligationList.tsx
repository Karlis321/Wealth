'use client';

import { useState } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency } from '@/lib/calculations';
import { CreditCard, Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import AddObligationModal from './AddObligationModal';
import type { EnrichedPrivateObligation } from '@/lib/types';
import { format, parseISO } from 'date-fns';

// US 10yr Treasury yield — update periodically as market rates change
const RISK_FREE_RATE = 4.3;

const TYPE_COLORS: Record<string, string> = {
  loan: 'text-orange-400 bg-orange-400/10',
  bond: 'text-blue-400 bg-blue-400/10',
  mortgage: 'text-purple-400 bg-purple-400/10',
  credit: 'text-red-400 bg-red-400/10',
};

export default function ObligationList() {
  const { enrichedObligations, removeObligation, activeTagFilter, store } = usePortfolio();
  const [editingObligation, setEditingObligation] = useState<EnrichedPrivateObligation | null>(
    null
  );
  const [showAdd, setShowAdd] = useState(false);

  const filtered = activeTagFilter
    ? enrichedObligations.filter((o) => o.tags.includes(activeTagFilter))
    : enrichedObligations;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-orange-400" />
          <span className="text-sm font-semibold text-slate-200">Private Obligations</span>
          <span className="text-xs bg-surface px-1.5 py-0.5 rounded-full text-slate-500">
            {filtered.length}
          </span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-8 text-center">
          <CreditCard size={28} className="text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-slate-600">No obligations tracked</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-2 text-xs text-orange-400 hover:underline"
          >
            Add a loan or bond →
          </button>
        </div>
      )}

      {/* Obligation cards */}
      <div className="space-y-3">
        {filtered.map((ob) => (
          <ObligationCard
            key={ob.id}
            ob={ob}
            baseCurrency={store.baseCurrency}
            onEdit={() => setEditingObligation(ob)}
            onDelete={() => removeObligation(ob.id)}
          />
        ))}
      </div>

      {showAdd && <AddObligationModal onClose={() => setShowAdd(false)} />}
      {editingObligation && (
        <AddObligationModal
          onClose={() => setEditingObligation(null)}
          initialData={editingObligation}
        />
      )}
    </div>
  );
}

function ObligationCard({
  ob,
  baseCurrency,
  onEdit,
  onDelete,
}: {
  ob: EnrichedPrivateObligation;
  baseCurrency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeClass = TYPE_COLORS[ob.obligationType] ?? 'text-slate-400 bg-slate-400/10';

  const vsBenchmark = ob.apr - RISK_FREE_RATE;

  return (
    <div className="bg-surface rounded-2xl p-3.5 border group card-accent-top transition-all duration-200 hover:border-surface-highlight" style={{ borderColor: 'rgba(255,255,255,0.05)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-200">{ob.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeClass}`}>
              {ob.obligationType.toUpperCase()}
            </span>
            {ob.bondStructure && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-blue-300 bg-blue-400/10 border border-blue-400/20">
                {ob.bondStructure.charAt(0).toUpperCase() + ob.bondStructure.slice(1)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Since {format(parseISO(ob.startDate), 'MMM d, yyyy')}
            {ob.endDate && ` → ${format(parseISO(ob.endDate), 'MMM d, yyyy')}`}
          </p>
        </div>
        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="text-slate-500 hover:text-slate-200 p-1 rounded">
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => {
              if (confirm(`Remove "${ob.name}"?`)) onDelete();
            }}
            className="text-slate-500 hover:text-down p-1 rounded"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Numbers row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2.5">
        <MetricCell label="Principal" value={formatCurrency(ob.principal, ob.currency, true)} />
        <MetricCell
          label="Current Balance"
          value={formatCurrency(ob.currentBalance, ob.currency, true)}
          accent="text-orange-400"
        />
        <MetricCell
          label="Interest Earned"
          value={formatCurrency(ob.accruedInterest, ob.currency, true)}
          accent="text-up"
        />
        <MetricCell
          label="APR"
          value={`${ob.apr}%`}
          accent={
            vsBenchmark >= 3
              ? 'text-up'
              : vsBenchmark >= 0
              ? 'text-amber-400'
              : 'text-down'
          }
        />
      </div>

      {/* Progress bar — only shown when end date is known */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-600 mb-1">
          <span>{ob.daysElapsed} days elapsed</span>
          <div className="flex items-center gap-1">
            {Math.abs(vsBenchmark) >= 0.5 && (
              <span className={`flex items-center gap-0.5 ${vsBenchmark >= 0 ? 'text-up' : 'text-down'}`}>
                <TrendingUp size={9} />
                {vsBenchmark > 0 ? '+' : ''}{vsBenchmark.toFixed(1)}% vs 10yr
              </span>
            )}
            {ob.progressPercent != null && (
              <span>{ob.progressPercent.toFixed(1)}%</span>
            )}
          </div>
        </div>
        {ob.progressPercent != null && (
          <div className="h-1 bg-surface-hover rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ob.progressPercent)}%`,
                background:
                  ob.progressPercent > 80
                    ? 'linear-gradient(90deg, #ef4444, #f97316)'
                    : 'linear-gradient(90deg, #f97316, #fbbf24)',
              }}
            />
          </div>
        )}
      </div>

      {/* Monthly income + tags */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-slate-600">
          Monthly interest income:{' '}
          <span className="text-up font-mono">
            +{formatCurrency(ob.monthlyInterestIncome, ob.currency)}
          </span>
        </span>
        <div className="flex gap-1">
          {ob.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="px-1.5 py-0.5 rounded-full bg-surface-hover text-slate-500 text-[10px]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-slate-600 mb-0.5">{label}</p>
      <p className={`text-xs font-mono font-medium ${accent ?? 'text-slate-300'}`}>{value}</p>
    </div>
  );
}
