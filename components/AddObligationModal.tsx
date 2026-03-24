'use client';

import { useState } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { X, CreditCard } from 'lucide-react';
import type { PrivateObligation, BondStructure } from '@/lib/types';

interface Props {
  onClose: () => void;
  initialData?: Partial<PrivateObligation> & { id?: string };
}

const OB_TYPES: PrivateObligation['obligationType'][] = ['loan', 'bond', 'mortgage', 'credit'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SEK'];

const BOND_STRUCTURES: { value: BondStructure; label: string; description: string }[] = [
  { value: 'bullet',       label: 'Bullet',      description: 'Full principal paid at maturity' },
  { value: 'balloon',      label: 'Balloon',      description: 'Installments + large final payment' },
  { value: 'amortizing',   label: 'Amortizing',   description: 'Scheduled principal & interest payments' },
  { value: 'zero-coupon',  label: 'Zero-Coupon',  description: 'No periodic payments; sold at discount' },
];

export default function AddObligationModal({ onClose, initialData }: Props) {
  const { addObligation, editObligation, store } = usePortfolio();
  const isEdit = !!initialData?.id;

  const [name, setName] = useState(initialData?.name ?? '');
  const [obligationType, setObligationType] = useState<PrivateObligation['obligationType']>(
    initialData?.obligationType ?? 'loan'
  );
  const [bondStructure, setBondStructure] = useState<BondStructure>(
    initialData?.bondStructure ?? 'bullet'
  );
  const [principal, setPrincipal] = useState(String(initialData?.principal ?? ''));
  const [apr, setApr] = useState(String(initialData?.apr ?? ''));
  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? initialData.startDate.split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate ? initialData.endDate.split('T')[0] : ''
  );
  const [currency, setCurrency] = useState(initialData?.currency ?? 'USD');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags ?? []);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  // Preview calculation
  const principalNum = parseFloat(principal) || 0;
  const aprNum = parseFloat(apr) || 0;
  const previewMonthly = principalNum * (aprNum / 100 / 12);
  const previewAnnual = principalNum * (aprNum / 100);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(principal);
    const a = parseFloat(apr);
    if (!name || isNaN(p) || p <= 0 || isNaN(a) || a < 0) return;

    const data: Omit<PrivateObligation, 'id' | 'addedAt'> = {
      name: name.trim(),
      obligationType,
      bondStructure,
      principal: p,
      apr: a,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      currency,
      notes: notes || undefined,
      tags: selectedTags,
    };

    if (isEdit && initialData?.id) {
      editObligation(initialData.id, data);
    } else {
      addObligation(data);
    }
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-400/15 flex items-center justify-center">
              <CreditCard size={14} className="text-orange-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-200">
              {isEdit ? 'Edit Obligation' : 'Add Private Obligation'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Name *</label>
            <input
              className="input"
              placeholder='e.g. "Home Renovation Loan"'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Type + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Type</label>
              <select
                className="input capitalize"
                value={obligationType}
                onChange={(e) =>
                  setObligationType(e.target.value as PrivateObligation['obligationType'])
                }
              >
                {OB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Currency</label>
              <select
                className="input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Repayment Structure */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Structure *</label>
            <div className="grid grid-cols-2 gap-2">
              {BOND_STRUCTURES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setBondStructure(s.value)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                    bondStructure === s.value
                      ? 'border-blue-400/50 bg-blue-400/10 text-blue-300'
                      : 'border-surface-border text-slate-500 hover:border-slate-500 hover:text-slate-300'
                  }`}
                >
                  <p className="font-medium">{s.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Principal + APR */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Principal *</label>
              <input
                className="input font-mono"
                placeholder="10000"
                type="number"
                step="any"
                min="0"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">APR (%) *</label>
              <input
                className="input font-mono"
                placeholder="8.5"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={apr}
                onChange={(e) => setApr(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Preview */}
          {principalNum > 0 && aprNum > 0 && (
            <div className="bg-surface rounded-lg p-3 border border-surface-border text-xs">
              <p className="text-slate-500 mb-1 font-medium">Interest Preview</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-600">Monthly interest</p>
                  <p className="text-orange-400 font-mono">
                    {currency}{' '}
                    {previewMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Annual interest</p>
                  <p className="text-red-400 font-mono">
                    {currency}{' '}
                    {previewAnnual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Start Date *</label>
              <input
                className="input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">End Date (opt.)</label>
              <input
                className="input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Notes</label>
            <input
              className="input"
              placeholder="Lender, purpose, conditions…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {store.tags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`tag-pill ${
                    selectedTags.includes(tag)
                      ? 'bg-orange-400/15 border-orange-400/30 text-orange-400'
                      : 'border-surface-border text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {isEdit ? 'Save Changes' : 'Add Obligation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
