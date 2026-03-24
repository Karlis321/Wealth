'use client';

import { useState } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import AddAssetModal from './AddAssetModal';
import type { EnrichedPublicAsset } from '@/lib/types';

export default function AssetTable() {
  const { enrichedAssets, removeAsset, activeTagFilter, pricesLoading, store } =
    usePortfolio();
  const [editingAsset, setEditingAsset] = useState<EnrichedPublicAsset | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = activeTagFilter
    ? enrichedAssets.filter((a) => a.tags.includes(activeTagFilter))
    : enrichedAssets;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-accent" />
          <span className="text-sm font-semibold text-slate-200">Public Assets</span>
          <span className="text-xs bg-surface px-1.5 py-0.5 rounded-full text-slate-500">
            {filtered.length}
          </span>
          {pricesLoading && (
            <RefreshCw size={11} className="animate-spin text-accent ml-1" />
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-8 text-center">
          <TrendingUp size={28} className="text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-slate-600">No public assets yet</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-2 text-xs text-accent hover:underline"
          >
            Add your first position →
          </button>
        </div>
      )}

      {/* Mobile card list */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-2">
          {filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              baseCurrency={store.baseCurrency}
              onEdit={() => setEditingAsset(asset)}
              onDelete={() => removeAsset(asset.id)}
            />
          ))}
        </div>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-600 border-b border-surface-border">
                <th className="text-left py-2 pr-3 font-medium">Ticker</th>
                <th className="text-right py-2 pr-3 font-medium">Price</th>
                <th className="text-right py-2 pr-3 font-medium">24h</th>
                <th className="text-right py-2 pr-3 font-medium">Qty</th>
                <th className="text-right py-2 pr-3 font-medium">Value</th>
                <th className="text-right py-2 pr-3 font-medium">Yield</th>
                <th className="text-right py-2 font-medium">Tags</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {filtered.map((asset) => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  baseCurrency={store.baseCurrency}
                  onEdit={() => setEditingAsset(asset)}
                  onDelete={() => removeAsset(asset.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddAssetModal onClose={() => setShowAdd(false)} />}
      {editingAsset && (
        <AddAssetModal
          onClose={() => setEditingAsset(null)}
          initialData={editingAsset}
        />
      )}
    </div>
  );
}

function AssetRow({
  asset,
  baseCurrency,
  onEdit,
  onDelete,
}: {
  asset: EnrichedPublicAsset;
  baseCurrency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPositive = (asset.changePercent24h ?? 0) >= 0;
  const isLoading = asset.currentPrice === null && !asset.error;

  return (
    <tr className="group hover:bg-surface-hover/50 transition-colors">
      {/* Ticker + Name */}
      <td className="py-2.5 pr-3">
        <div>
          <span className="font-mono font-semibold text-slate-200">{asset.ticker}</span>
          <p className="text-slate-600 truncate max-w-[100px]">{asset.name}</p>
        </div>
        {asset.sector && (
          <p className="text-slate-700 text-[10px]">{asset.sector}</p>
        )}
      </td>

      {/* Price */}
      <td className="py-2.5 pr-3 text-right">
        {isLoading ? (
          <span className="text-slate-700 animate-pulse">…</span>
        ) : asset.error ? (
          <span title={asset.error}><AlertCircle size={12} className="text-down inline" /></span>
        ) : (
          <span className="font-mono text-slate-200">
            {formatCurrency(asset.currentPrice!, asset.currency)}
          </span>
        )}
      </td>

      {/* 24h Change */}
      <td className="py-2.5 pr-3 text-right">
        {asset.changePercent24h != null ? (
          <span
            className={`font-mono flex items-center justify-end gap-0.5 ${
              isPositive ? 'text-up' : 'text-down'
            }`}
          >
            {isPositive ? (
              <TrendingUp size={10} />
            ) : (
              <TrendingDown size={10} />
            )}
            {formatPercent(asset.changePercent24h)}
          </span>
        ) : (
          <span className="text-slate-700">—</span>
        )}
      </td>

      {/* Quantity */}
      <td className="py-2.5 pr-3 text-right font-mono text-slate-400">
        {asset.quantity.toLocaleString()}
      </td>

      {/* Value */}
      <td className="py-2.5 pr-3 text-right">
        {asset.valueUSD != null ? (
          <span className="font-mono font-medium text-slate-200">
            {formatCurrency(asset.valueUSD, baseCurrency, true)}
          </span>
        ) : (
          <span className="text-slate-700">—</span>
        )}
      </td>

      {/* Dividend Yield */}
      <td className="py-2.5 pr-3 text-right">
        {asset.dividendYield != null && asset.dividendYield > 0 ? (
          <span className="text-amber-400 font-mono">
            {asset.dividendYield.toFixed(2)}%
          </span>
        ) : (
          <span className="text-slate-700">—</span>
        )}
      </td>

      {/* Tags */}
      <td className="py-2.5 text-right">
        <div className="flex flex-wrap gap-1 justify-end">
          {asset.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent-light text-[10px]"
            >
              {t}
            </span>
          ))}
          {asset.tags.length > 2 && (
            <span className="px-1.5 py-0.5 rounded-full bg-surface text-slate-500 text-[10px]">
              +{asset.tags.length - 2}
            </span>
          )}
        </div>
      </td>

      {/* Actions — hover on desktop */}
      <td className="py-2.5 pl-1">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="text-slate-500 hover:text-slate-200 p-1 rounded">
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => { if (confirm(`Remove ${asset.ticker}?`)) onDelete(); }}
            className="text-slate-500 hover:text-down p-1 rounded"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AssetCard({
  asset,
  baseCurrency,
  onEdit,
  onDelete,
}: {
  asset: EnrichedPublicAsset;
  baseCurrency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPositive = (asset.changePercent24h ?? 0) >= 0;
  const isLoading = asset.currentPrice === null && !asset.error;

  return (
    <div className="bg-surface rounded-xl p-3 border border-surface-border">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-slate-200">{asset.ticker}</span>
            {asset.changePercent24h != null && (
              <span className={`text-xs font-mono flex items-center gap-0.5 ${isPositive ? 'text-up' : 'text-down'}`}>
                {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {formatPercent(asset.changePercent24h)}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">{asset.name}</p>
        </div>
        <div className="text-right">
          {isLoading ? (
            <span className="text-slate-700 animate-pulse text-xs">…</span>
          ) : asset.error ? (
            <span title={asset.error}><AlertCircle size={12} className="text-down" /></span>
          ) : (
            <p className="font-mono text-sm text-slate-200">{formatCurrency(asset.currentPrice!, asset.currency)}</p>
          )}
          {asset.valueUSD != null && (
            <p className="font-mono font-semibold text-xs text-slate-300 mt-0.5">
              {formatCurrency(asset.valueUSD, baseCurrency, true)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>×{asset.quantity.toLocaleString()}</span>
          {asset.dividendYield != null && asset.dividendYield > 0 && (
            <span className="text-amber-400">{asset.dividendYield.toFixed(2)}% yield</span>
          )}
          <div className="flex gap-1">
            {asset.tags.slice(0, 2).map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent-light text-[10px]">{t}</span>
            ))}
            {asset.tags.length > 2 && (
              <span className="px-1.5 py-0.5 rounded-full bg-surface-hover text-slate-500 text-[10px]">+{asset.tags.length - 2}</span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="text-slate-500 hover:text-slate-200 p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => { if (confirm(`Remove ${asset.ticker}?`)) onDelete(); }}
            className="text-slate-500 hover:text-down p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
