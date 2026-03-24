'use client';

import { useState, useEffect, useRef } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { X, TrendingUp, Loader, Search } from 'lucide-react';
import type { PublicAsset } from '@/lib/types';

interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

interface Props {
  onClose: () => void;
  initialData?: Partial<PublicAsset> & { id?: string };
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SEK'];

export default function AddAssetModal({ onClose, initialData }: Props) {
  const { addAsset, editAsset, store } = usePortfolio();
  const isEdit = !!initialData?.id;

  const [ticker, setTicker] = useState(initialData?.ticker ?? '');
  const [name, setName] = useState(initialData?.name ?? '');
  const [quantity, setQuantity] = useState(String(initialData?.quantity ?? ''));
  const [currency, setCurrency] = useState(initialData?.currency ?? 'EUR');
  const [sector, setSector] = useState(initialData?.sector ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags ?? []);
  const [newTag, setNewTag] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Auto-fetch name/currency/sector when ticker is entered
  useEffect(() => {
    if (ticker.length >= 1 && !isEdit) {
      const timeout = setTimeout(async () => {
        setLookupLoading(true);
        setLookupError('');
        try {
          const res = await fetch(`/api/prices?tickers=${encodeURIComponent(ticker)}`);
          const data = await res.json();
          const info = data[ticker.toUpperCase()];
          if (info && !info.error) {
            if (!name) setName(info.name ?? '');
            if (info.currency) setCurrency(info.currency);
            if (info.sector) setSector(info.sector);
          } else if (info?.error) {
            setLookupError('Ticker not found — check the format or add manually.');
          }
        } catch {
          setLookupError('Could not verify ticker.');
        } finally {
          setLookupLoading(false);
        }
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [ticker, isEdit, name]);

  // Search by company name
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data: SearchResult[] = await res.json();
        setSearchResults(data);
        setShowDropdown(data.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectSearchResult(result: SearchResult) {
    setTicker(result.ticker.toUpperCase());
    if (!name) setName(result.name);
    setSearchQuery('');
    setShowDropdown(false);
    setLookupError('');
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!ticker || isNaN(qty) || qty <= 0) return;

    const data: Omit<PublicAsset, 'id' | 'addedAt'> = {
      ticker: ticker.trim().toUpperCase(),
      name: name || ticker.toUpperCase(),
      quantity: qty,
      currency,
      sector: sector || undefined,
      notes: notes || undefined,
      tags: selectedTags,
    };

    if (isEdit && initialData?.id) {
      editAsset(initialData.id, data);
    } else {
      addAsset(data);
    }
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box animate-slide-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
              <TrendingUp size={14} className="text-accent-light" />
            </div>
            <h2 className="text-base font-semibold text-slate-200">
              {isEdit ? 'Edit Asset' : 'Add Public Asset'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company search */}
          {!isEdit && (
            <div ref={searchRef} className="relative">
              <label className="text-xs text-slate-500 mb-1 block">Search by Company Name</label>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="input pl-7"
                  placeholder="e.g. Apple, Volkswagen, Nestlé…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
                {searchLoading && (
                  <Loader size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-accent" />
                )}
              </div>
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 rounded-lg border border-surface-border bg-surface shadow-lg overflow-hidden">
                  {searchResults.map((r) => (
                    <button
                      key={r.ticker}
                      type="button"
                      onMouseDown={() => selectSearchResult(r)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-hover transition-colors text-left"
                    >
                      <div>
                        <span className="text-xs font-medium text-slate-200">{r.name}</span>
                        <span className="text-[10px] text-slate-500 ml-1.5">{r.exchange}</span>
                      </div>
                      <span className="text-[10px] font-mono text-accent-light ml-2 shrink-0">{r.ticker}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ticker + Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Ticker *</label>
              <div className="relative">
                <input
                  className="input pr-8 font-mono uppercase"
                  placeholder="AAPL"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  required
                />
                {lookupLoading && (
                  <Loader size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-accent" />
                )}
              </div>
              {lookupError && (
                <p className="text-[10px] text-orange-400 mt-1">{lookupError}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Quantity *</label>
              <input
                className="input font-mono"
                placeholder="10"
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Company Name</label>
            <input
              className="input"
              placeholder="Auto-fetched or enter manually"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Currency + Sector */}
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Sector (optional)</label>
              <input
                className="input"
                placeholder="Technology"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                list="sector-suggestions"
              />
              <datalist id="sector-suggestions">
                <option value="Financials" />
                <option value="Real Estate" />
                <option value="Energy" />
                <option value="Industrials" />
                <option value="Technology" />
                <option value="Consumer Staples" />
                <option value="Consumer Discretionary" />
                <option value="Healthcare" />
                <option value="Utilities" />
                <option value="Telecommunications" />
                <option value="Materials" />
                <option value="Timber & Forestry" />
              </datalist>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Notes</label>
            <input
              className="input"
              placeholder="Optional notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {store.tags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`tag-pill ${
                    selectedTags.includes(tag)
                      ? 'bg-accent/20 border-accent/40 text-accent-light'
                      : 'border-surface-border text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <input
              className="input text-xs"
              placeholder="#CustomTag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTag) {
                  e.preventDefault();
                  const t = newTag.startsWith('#') ? newTag : `#${newTag}`;
                  toggleTag(t);
                  setNewTag('');
                }
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {isEdit ? 'Save Changes' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
