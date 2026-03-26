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

  // ── Financial health metrics ──────────────────────────────────────────────
  const portfolioYield =
    summary.publicValueUSD > 0
      ? (summary.estimatedMonthlyDividend * 12) / summary.publicValueUSD * 100
      : 0;
  const totalMonthlyInterest = enrichedObligations.reduce(
    (sum, o) => sum + o.monthlyInterestIncome,
    0
  );
  const incomeRatio =
    totalMonthlyInterest > 0
      ? summary.estimatedMonthlyDividend / totalMonthlyInterest
      : null;

  const hasObligations = summary.privateValueUSD > 0;

  return (
    <div className="border-b border-surface-border p-4 sm:p-5 bg-surface-card/60 backdrop-blur-md relative overflow-hidden">
      {/* Ambient glow behind the hero number */}
      <div
        className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-40 opacity-30"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 70%)' }}
      />

      {/* Title row */}
      <div className="flex items-center gap-2 mb-4 relative">
        <div className="w-5 h-5 rounded-md bg-accent/20 flex items-center justify-center">
          <Zap size={11} className="text-accent-light" />
        </div>
        <span className="text-[10px] font-bold text-accent-light/70 uppercase tracking-[0.18em]">
          The Pulse
        </span>
      </div>

      {/* Main metrics row */}
      <div className="flex items-end gap-5 sm:gap-8 flex-wrap mb-4 relative">
        {/* Total Value — hero */}
        <div>
          <p className="text-[11px] text-slate-500 mb-1 font-medium uppercase tracking-wider">Total Portfolio</p>
          <p className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-gradient leading-none">
            {formatCurrency(summary.totalValueUSD, store.baseCurrency, true)}
          </p>
        </div>

        {/* Vertical divider */}
        <div className="hidden sm:block w-px h-12 bg-surface-border self-end mb-1" />

        {/* 24h Change */}
        <div>
          <p className="text-[11px] text-slate-500 mb-1 font-medium uppercase tracking-wider">24h Change</p>
          <div className={`flex items-center gap-2 ${isPositive ? 'text-up' : 'text-down'}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isPositive ? 'bg-up/10' : 'bg-down/10'}`}>
              {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            </div>
            <span className="text-xl font-bold font-mono tracking-tight leading-none">
              {isPositive ? '+' : ''}{formatCurrency(summary.totalChange24hUSD, store.baseCurrency)}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
            }`}>
              {formatPercent(summary.totalChangePercent24h)}
            </span>
          </div>
        </div>

        {/* Monthly Dividend */}
        <div>
          <p className="text-[11px] text-slate-500 mb-1 font-medium uppercase tracking-wider">Monthly Div.</p>
          <div className="flex items-center gap-2 text-amber-400">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-amber-400/10">
              <DollarSign size={13} />
            </div>
            <span className="text-xl font-bold font-mono tracking-tight leading-none">
              {formatCurrency(summary.estimatedMonthlyDividend, store.baseCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Financial Health strip ──────────────────────────────────────────── */}
      {(summary.publicValueUSD > 0 || hasObligations) && (
        <div className="flex flex-wrap gap-x-5 gap-y-2 px-3 py-2.5 mb-4 rounded-xl bg-surface/50 border border-surface-border/60">
          {portfolioYield > 0 && (
            <HealthMetric
              icon={<Percent size={10} />}
              label="Portfolio Yield"
              value={`${portfolioYield.toFixed(2)}%`}
              valueClass="text-amber-400"
              hint="Annual dividends ÷ public asset value"
            />
          )}
          {incomeRatio !== null && (
            <HealthMetric
              icon={<Shield size={10} />}
              label="Div / Bond"
              value={`${incomeRatio.toFixed(2)}x`}
              valueClass="text-accent-light"
              hint="Monthly dividend income ÷ monthly bond/loan interest income"
            />
          )}
          {totalMonthlyInterest > 0 && (
            <HealthMetric
              icon={<TrendingUp size={10} />}
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
        <div className="space-y-2 relative">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">
              Public{' '}
              <span className="text-slate-300 font-mono font-medium">
                {formatCurrency(summary.publicValueUSD, store.baseCurrency, true)}
              </span>
              <span className="text-slate-600 ml-1">({publicPct.toFixed(1)}%)</span>
            </span>
            {hasObligations && (
              <span className="text-slate-500">
                <span className="text-slate-600 mr-1">({privatePct.toFixed(1)}%)</span>
                <span className="text-slate-300 font-mono font-medium">
                  {formatCurrency(summary.privateValueUSD, store.baseCurrency, true)}
                </span>
                {' '}Obligations
              </span>
            )}
          </div>
          <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${publicPct}%`,
                background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                boxShadow: '0 0 8px rgba(99,102,241,0.5)',
              }}
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
    <div className="flex items-center gap-1.5" title={hint}>
      <span className="text-slate-600 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-slate-600 leading-none mb-0.5">{label}</p>
        <p className={`text-xs font-mono font-semibold leading-none ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
