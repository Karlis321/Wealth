// ─── Data Models ─────────────────────────────────────────────────────────────

export interface PublicAsset {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  currency: string;
  tags: string[];
  sector?: string;
  notes?: string;
  addedAt: string;
}

export type BondStructure = 'bullet' | 'balloon' | 'amortizing' | 'zero-coupon';

export interface PrivateObligation {
  id: string;
  name: string;
  obligationType: 'loan' | 'bond' | 'mortgage' | 'credit';
  bondStructure?: BondStructure; // required when obligationType === 'bond'
  principal: number;
  apr: number; // Annual Percentage Rate in %
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, optional
  currency: string;
  tags: string[];
  notes?: string;
  addedAt: string;
}

// ─── Enriched (fetched) Types ─────────────────────────────────────────────────

export interface EnrichedPublicAsset extends PublicAsset {
  currentPrice: number | null;
  change24h: number | null;
  changePercent24h: number | null;
  valueNative: number | null; // in asset's native currency
  valueUSD: number | null;
  dividendYield: number | null; // %
  exDividendDate: string | null;
  paymentDate: string | null;
  annualDividendPerShare: number | null;
  annualDividendTotal: number | null; // quantity * annual dividend per share
  error?: string;
}

export interface EnrichedPrivateObligation extends PrivateObligation {
  currentBalance: number; // principal + accrued interest earned
  accruedInterest: number; // total interest earned since start date
  dailyInterestRate: number;
  daysElapsed: number;
  progressPercent: number | null; // 0–100, how far through the term; null if no end date
  monthlyInterestIncome: number; // expected monthly income, structure-aware
  valueUSD: number | null;
}

// ─── API Responses ─────────────────────────────────────────────────────────────

export interface PriceData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  name: string;
  sector?: string;
  dividendYield?: number;
  exDividendDate?: string;
  paymentDate?: string;
  annualDividendRate?: number;
  marketCap?: number;
}

export interface FxRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

export interface DividendEvent {
  ticker: string;
  name: string;
  exDividendDate: string;
  paymentDate?: string;
  amount?: number;
  quantity: number;
  totalPayment?: number;
  daysUntil: number;
}

// ─── Mintos ────────────────────────────────────────────────────────────────────

export interface MintosAccount {
  id: string;
  nickname: string;           // user-defined label, e.g. "Main Mintos"
  currency: string;           // account currency, typically EUR
  totalInvested: number;      // funds currently deployed in loans
  availableFunds: number;     // uninvested cash in the account
  totalInterestEarned: number; // all-time interest received
  netAnnualReturn: number;    // NAR in % (e.g. 11.5)
  pendingPayments: number;    // payments in transit
  lastSynced: string | null;  // ISO datetime of last successful sync
  addedAt: string;
}

// ─── Portfolio Summary ─────────────────────────────────────────────────────────

export interface PortfolioSummary {
  totalValueUSD: number;
  publicValueUSD: number;
  privateValueUSD: number;
  mintosValueUSD: number;
  totalChange24hUSD: number;
  totalChangePercent24h: number;
  estimatedMonthlyDividend: number;
  assetCount: number;
  obligationCount: number;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export interface AppStore {
  publicAssets: PublicAsset[];
  privateObligations: PrivateObligation[];
  mintosAccounts: MintosAccount[];
  baseCurrency: string;
  tags: string[];
  lastUpdated: string | null;
}
