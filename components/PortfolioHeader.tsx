'use client';

import React from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import { TrendingUp, TrendingDown, DollarSign, Zap, Percent, Shield } from 'lucide-react';

export default function PortfolioHeader() {
  const { summary, store, enrichedObligations } = usePortfolio();

  const isPositive = summary.totalChange24hUSD >= 0;
  const publicPct =
    summary.totalValueUSD > 0
      ? (summary.publicValueUSD / summary.totalValueUSD) * 100
      : 0;
  const privatePct = 100 - publicPct;

  // ── Financial health metrics ────────────────────────────────────────────────
  const portfolioYield =
    summary.publicValueUSD > 0
      ? (summary.estimatedMonthlyDividend * 12) / summary.publicValueUSD * 100
      : 0;
  const totalMonthlyInterest = enrichedObligations.reduce(
    (sum, o) => sum + o.monthlyInterestCost,
    0
  );
  const debtCoverageRatio =
    totalMonthlyInterest > 0
      ? summary.estimatedMonthlyDividend / totalMonthlyInterest
      : null;

  const hasObligations = summary.privateValueUSD > 0;

  return (
    <div className="border-b border-surface-border p-4 bg-surface-card/50 backdrop-blur-sm">
      {/* Title row */}
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} className="text-accent" />
        <span className="text-xs font-semibold text-accent uppercase tracking-widest">
          The Pulse
        </span>
      </div>

      {/* Main metrics row */}
      <div className="flex items-end gap-4 sm:gap-6 flex-wrap mb-3">
        {/* Total Value — hero number */}
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Total Portfolio</p>
          <p className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
            {formatCurrency(summary.totalValueUSD, store.baseCurrency, true)}
          </p>
        </div>

        {/* 24h Change */}
        <div>
          <p className="text-xs text-slate-500 mb-0.5">24h Change</p>
          <div className={`flex items-center gap-1.5 ${isPositive ? 'text-up' : 'text-down'}`}>
            {isPositive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            <span className="text-lg sm:text-xl font-bold font-mono">
              {isPositive ? '+' : ''}
              {formatCurrency(summary.totalChange24hUSD, store.baseCurrency)}
            </span>
            <span className="text-sm font-medium px-1.5 py-0.5 rounded bg-current/10">
              {formatPercent(summary.totalChangePercent24h)}
            </span>
          </div>
        </div>

        {/* Monthly Dividend */}
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Est. Monthly Div.</p>
          <div className="flex items-center gap-1.5 text-amber-400">
            <DollarSign size={14} />
            <span className="text-lg sm:text-xl font-bold font-mono">
              {formatCurrency(summary.estimatedMonthlyDividend, store.baseCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Financial Health strip ─────────────────────────────────────────── */}
      {(summary.publicValueUSD > 0 || hasObligations) && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 py-2.5 px-3 mb-3 rounded-lg bg-surface/60 border border-surface-border/60">
            {/* Portfolio Yield */}
          {portfolioYield > 0 && (
            <HealthMetric
              icon={<Percent size={11} />}
              label="Portfolio Yield"
              value={`${portfolioYield.toFixed(2)}%`}
              valueClass="text-amber-400"
              hint="Annual dividends ÷ asset value"
            />
          )}

          {/* Income mix ratio */}
          {debtCoverageRatio !== null && (
            <HealthMetric
              icon={<Shield size={11} />}
              label="Div / Bond"
              value={`${debtCoverageRatio.toFixed(2)}x`}
              valueClass="text-amber-400"
              hint="Monthly dividend income ÷ monthly bond/loan interest income"
            />
          )}

          {/* Monthly interest income from obligations */}
          {totalMonthlyInterest > 0 && (
            <HealthMetric
              icon={<TrendingUp size={11} />}
              label="Monthly Interest"
              value={`+${formatCurrency(totalMonthlyInterest, store.baseCurrency)}`}
              valueClass="text-up"
              hint="Total monthly interest income from obligations"
            />
          )}
        </div>
      )}

      {/* Portfolio split bar */}
      {summary.totalValueUSD > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>
              Public{' '}
              <span className="text-slate-300 font-mono">
                {formatCurrency(summary.publicValueUSD, store.baseCurrency, true)}
              </span>{' '}
              <span className="text-slate-600">({publicPct.toFixed(1)}%)</span>
            </span>
            {hasObligations && (
              <span>
                Obligations{' '}
                <span className="text-slate-300 font-mono">
                  {formatCurrency(summary.privateValueUSD, store.baseCurrency, true)}
                </span>{' '}
                <span className="text-slate-600">({privatePct.toFixed(1)}%)</span>
              </span>
            )}
          </div>
          <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500"
              style={{ width: `${publicPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function HealthMetric({
  icon,
  label,
  value,
  valueClass,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-1.5 group relative" title={hint}>
      <span className="text-slate-600 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-slate-600 leading-none mb-0.5">{label}</p>
        <p className={`text-xs font-mono font-semibold leading-none ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
