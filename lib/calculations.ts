import { differenceInDays, parseISO } from 'date-fns';
import type { PrivateObligation, EnrichedPrivateObligation } from './types';

/**
 * Calculate accrued interest using simple (not compound) interest.
 * For compound daily: balance = principal * (1 + daily_rate)^days
 */
export function enrichObligation(
  ob: PrivateObligation,
  fxRates: Record<string, number>,
  baseCurrency: string
): EnrichedPrivateObligation {
  const now = new Date();
  const start = parseISO(ob.startDate);
  const end = ob.endDate ? parseISO(ob.endDate) : null;

  const daysElapsed = Math.max(0, differenceInDays(now, start));
  const totalDays = end ? differenceInDays(end, start) : null;
  const dailyRate = ob.apr / 100 / 365;

  // Compound daily interest: balance = P * (1 + r)^n
  const currentBalance = ob.principal * Math.pow(1 + dailyRate, daysElapsed);
  const accruedInterest = currentBalance - ob.principal;

  // Monthly interest on current (compounded) balance: balance * ((1 + r)^30 - 1)
  const monthlyInterestCost = currentBalance * (Math.pow(1 + dailyRate, 30) - 1);

  // Progress only meaningful when there's a known end date
  const progressPercent = totalDays
    ? Math.min(100, (daysElapsed / totalDays) * 100)
    : null;

  // Convert to base currency
  let valueUSD: number | null = null;
  if (ob.currency === baseCurrency) {
    valueUSD = currentBalance;
  } else if (fxRates[ob.currency] && fxRates[baseCurrency]) {
    // rates are relative to USD
    const inUSD = currentBalance / fxRates[ob.currency];
    const inBase = inUSD * fxRates[baseCurrency];
    valueUSD = inBase;
  }

  return {
    ...ob,
    currentBalance,
    accruedInterest,
    dailyInterestRate: dailyRate,
    daysElapsed,
    progressPercent,
    monthlyInterestCost,
    valueUSD,
  };
}

export function formatCurrency(
  value: number,
  currency = 'USD',
  compact = false
): string {
  if (!isFinite(value)) return '—';
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  if (compact && Math.abs(value) >= 1_000_000) {
    return (
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: 2,
      }).format(value)
    );
  }
  return new Intl.NumberFormat('en-US', opts).format(value);
}

export function formatPercent(value: number, digits = 2): string {
  if (!isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

export function convertToBase(
  amount: number,
  fromCurrency: string,
  rates: Record<string, number>
): number {
  // rates are USD-based (1 USD = X currency)
  if (fromCurrency === 'USD') return amount;
  const rate = rates[fromCurrency];
  if (!rate) return amount; // fallback: assume 1:1
  return amount / rate; // convert to USD
}
