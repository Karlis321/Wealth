'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type {
  AppStore,
  PublicAsset,
  PrivateObligation,
  MintosAccount,
  EnrichedPublicAsset,
  EnrichedPrivateObligation,
  PriceData,
  FxRates,
  PortfolioSummary,
  DividendEvent,
} from './types';
import {
  DEFAULT_STORE,
  loadEncryptedStore,
  saveEncryptedStore,
  addPublicAsset,
  updatePublicAsset,
  deletePublicAsset,
  addPrivateObligation,
  updatePrivateObligation,
  deletePrivateObligation,
  addMintosAccount,
  updateMintosAccount,
  deleteMintosAccount,
} from './store';
import { enrichObligation, convertToBase } from './calculations';
import { differenceInDays, parseISO } from 'date-fns';

// End-of-day pricing — fetch once per calendar day only
function todayDateString() {
  return new Date().toISOString().split('T')[0];
}

interface PortfolioContextType {
  store: AppStore;
  profileName: string;
  enrichedAssets: EnrichedPublicAsset[];
  enrichedObligations: EnrichedPrivateObligation[];
  summary: PortfolioSummary;
  dividendEvents: DividendEvent[];
  fxRates: Record<string, number>;
  pricesLoading: boolean;
  lastRefreshed: Date | null;
  activeTagFilter: string | null;

  // Actions
  setActiveTagFilter: (tag: string | null) => void;
  addAsset: (data: Omit<PublicAsset, 'id' | 'addedAt'>) => void;
  editAsset: (id: string, data: Partial<Omit<PublicAsset, 'id' | 'addedAt'>>) => void;
  removeAsset: (id: string) => void;
  addObligation: (data: Omit<PrivateObligation, 'id' | 'addedAt'>) => void;
  editObligation: (id: string, data: Partial<Omit<PrivateObligation, 'id' | 'addedAt'>>) => void;
  removeObligation: (id: string) => void;
  addMintos: (data: Omit<MintosAccount, 'id' | 'addedAt'>) => void;
  editMintos: (id: string, data: Partial<Omit<MintosAccount, 'id' | 'addedAt'>>) => void;
  removeMintos: (id: string) => void;
  refreshPrices: () => Promise<void>;
  setBaseCurrency: (currency: string) => void;
  switchProfile: () => void;
}

const Ctx = createContext<PortfolioContextType | null>(null);

export function usePortfolio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}

export function PortfolioProvider({
  children,
  profileName,
  cryptoKey,
  switchProfile,
}: {
  children: React.ReactNode;
  profileName: string;
  cryptoKey: CryptoKey;
  switchProfile: () => void;
}) {
  // Start with DEFAULT_STORE on both server and client to avoid hydration mismatch.
  // The real store is loaded from localStorage in useEffect (client-only).
  const [store, setStore] = useState<AppStore>(DEFAULT_STORE);
  // mounted is STATE (not a ref) — closure-captured correctly in the save effect below
  const [mounted, setMounted] = useState(false);

  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [fxRates, setFxRates] = useState<Record<string, number>>({ USD: 1 });
  const [pricesLoading, setPricesLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const lastFetchedDay = useRef<string | null>(null);

  // Load localStorage after mount (avoids SSR/client hydration mismatch).
  // Both setStore and setMounted are batched into one re-render by React 18.
  useEffect(() => {
    let cancelled = false;
    loadEncryptedStore(profileName, cryptoKey).then((s) => {
      if (!cancelled) {
        setStore(s);
        setMounted(true);
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileName]);

  // Persist store on change — mounted is closure-captured as false during the
  // initial render, so this skips until the real store has been loaded.
  useEffect(() => {
    if (!mounted) return;
    saveEncryptedStore(store, profileName, cryptoKey).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, mounted]);

  // Fetch FX rates on mount
  useEffect(() => {
    fetch('/api/fx')
      .then((r) => r.json())
      .then((data: FxRates) => setFxRates(data.rates ?? { USD: 1 }))
      .catch(console.error);
  }, []);

  // Fetch prices (manual or on new calendar day)
  const refreshPrices = useCallback(async () => {
    const tickers = store.publicAssets.map((a) => a.ticker);
    if (tickers.length === 0) {
      setLastRefreshed(new Date());
      return;
    }
    setPricesLoading(true);
    try {
      const res = await fetch(`/api/prices?tickers=${tickers.join(',')}`);
      const data = await res.json();
      setPrices(data);
      const now = new Date();
      setLastRefreshed(now);
      lastFetchedDay.current = now.toISOString().split('T')[0];
    } catch (err) {
      console.error('Price fetch error:', err);
    } finally {
      setPricesLoading(false);
    }
  }, [store.publicAssets]);

  // Fetch once per calendar day on mount / asset list change
  useEffect(() => {
    const today = todayDateString();
    if (lastFetchedDay.current !== today) {
      refreshPrices();
    }
  }, [refreshPrices]);

  // ─── Enriched Assets ───────────────────────────────────────────────────────
  const enrichedAssets: EnrichedPublicAsset[] = store.publicAssets.map((asset) => {
    const p = prices[asset.ticker] as PriceData | undefined;
    if (!p || p.price == null) {
      return {
        ...asset,
        currentPrice: null,
        change24h: null,
        changePercent24h: null,
        valueNative: null,
        valueUSD: null,
        dividendYield: null,
        exDividendDate: null,
        paymentDate: null,
        annualDividendPerShare: null,
        annualDividendTotal: null,
        error: (p as { error?: string } | undefined)?.error,
      };
    }
    const valueNative = asset.quantity * p.price;
    const assetCurrency = p.currency ?? asset.currency ?? 'USD';
    const valueUSD = convertToBase(valueNative, assetCurrency, fxRates);
    const annualDividendTotal =
      p.annualDividendRate != null ? asset.quantity * p.annualDividendRate : null;

    return {
      ...asset,
      currentPrice: p.price,
      change24h: p.change,
      changePercent24h: p.changePercent,
      valueNative,
      valueUSD,
      dividendYield: p.dividendYield ?? null,
      exDividendDate: p.exDividendDate ?? null,
      paymentDate: null,
      annualDividendPerShare: p.annualDividendRate ?? null,
      annualDividendTotal,
      currency: assetCurrency,
    };
  });

  // ─── Enriched Obligations ──────────────────────────────────────────────────
  // Only compute after mount to avoid new Date() SSR/client mismatch
  const enrichedObligations: EnrichedPrivateObligation[] = mounted
    ? store.privateObligations.map((ob) => enrichObligation(ob, fxRates, 'USD'))
    : [];

  // ─── Portfolio Summary ─────────────────────────────────────────────────────
  const publicValueUSD = enrichedAssets.reduce((sum, a) => sum + (a.valueUSD ?? 0), 0);
  const privateValueUSD = enrichedObligations.reduce((sum, o) => sum + (o.valueUSD ?? 0), 0);

  // Mintos total = invested in loans + available cash (interest already in invested figure)
  const mintosValueUSD = (store.mintosAccounts ?? []).reduce((sum, a) => {
    const total = a.totalInvested + a.availableFunds;
    if (a.currency === 'USD') return sum + total;
    const rate = fxRates[a.currency];
    return sum + (rate ? total / rate : total);
  }, 0);

  const totalValueUSD = publicValueUSD + privateValueUSD + mintosValueUSD;

  const totalChange24hUSD = enrichedAssets.reduce(
    (sum, a) =>
      sum + (a.change24h != null && a.currentPrice != null ? a.quantity * a.change24h : 0),
    0
  );
  const totalChangePercent24h =
    totalValueUSD > 0 ? (totalChange24hUSD / (totalValueUSD - totalChange24hUSD)) * 100 : 0;

  const estimatedMonthlyDividend = enrichedAssets.reduce((sum, a) => {
    if (a.annualDividendTotal == null) return sum;
    // Convert to USD before summing — dividends are in the asset's native currency
    const inUSD = convertToBase(a.annualDividendTotal, a.currency, fxRates);
    return sum + inUSD / 12;
  }, 0);

  const summary: PortfolioSummary = {
    totalValueUSD,
    publicValueUSD,
    privateValueUSD,
    mintosValueUSD,
    totalChange24hUSD,
    totalChangePercent24h,
    estimatedMonthlyDividend,
    assetCount: store.publicAssets.length,
    obligationCount: store.privateObligations.length,
  };

  // ─── Dividend Events ───────────────────────────────────────────────────────
  // Only compute after mount to avoid new Date() SSR/client mismatch
  const dividendEvents: DividendEvent[] = mounted ? enrichedAssets
    .filter((a) => a.exDividendDate != null)
    .map((a) => {
      const daysUntil = differenceInDays(parseISO(a.exDividendDate!), new Date());
      return {
        ticker: a.ticker,
        name: a.name,
        exDividendDate: a.exDividendDate!,
        paymentDate: a.paymentDate ?? undefined,
        // Payment frequency unknown from API — show annual totals only
        amount: a.annualDividendPerShare ?? undefined,
        quantity: a.quantity,
        totalPayment:
          a.annualDividendTotal != null ? a.annualDividendTotal : undefined,
        daysUntil,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    : [];

  // ─── Store Mutations ───────────────────────────────────────────────────────
  const ctxAddAsset = useCallback(
    (data: Omit<PublicAsset, 'id' | 'addedAt'>) => setStore((s) => addPublicAsset(s, data)),
    []
  );
  const ctxEditAsset = useCallback(
    (id: string, data: Partial<Omit<PublicAsset, 'id' | 'addedAt'>>) =>
      setStore((s) => updatePublicAsset(s, id, data)),
    []
  );
  const ctxRemoveAsset = useCallback(
    (id: string) => setStore((s) => deletePublicAsset(s, id)),
    []
  );
  const ctxAddObligation = useCallback(
    (data: Omit<PrivateObligation, 'id' | 'addedAt'>) =>
      setStore((s) => addPrivateObligation(s, data)),
    []
  );
  const ctxEditObligation = useCallback(
    (id: string, data: Partial<Omit<PrivateObligation, 'id' | 'addedAt'>>) =>
      setStore((s) => updatePrivateObligation(s, id, data)),
    []
  );
  const ctxRemoveObligation = useCallback(
    (id: string) => setStore((s) => deletePrivateObligation(s, id)),
    []
  );
  const ctxAddMintos = useCallback(
    (data: Omit<MintosAccount, 'id' | 'addedAt'>) =>
      setStore((s) => addMintosAccount(s, data)),
    []
  );
  const ctxEditMintos = useCallback(
    (id: string, data: Partial<Omit<MintosAccount, 'id' | 'addedAt'>>) =>
      setStore((s) => updateMintosAccount(s, id, data)),
    []
  );
  const ctxRemoveMintos = useCallback(
    (id: string) => setStore((s) => deleteMintosAccount(s, id)),
    []
  );
  const setBaseCurrency = useCallback(
    (currency: string) => setStore((s) => ({ ...s, baseCurrency: currency })),
    []
  );

  return (
    <Ctx.Provider
      value={{
        store,
        profileName,
        enrichedAssets,
        enrichedObligations,
        summary,
        dividendEvents,
        fxRates,
        pricesLoading,
        lastRefreshed,
        activeTagFilter,
        setActiveTagFilter,
        addAsset: ctxAddAsset,
        editAsset: ctxEditAsset,
        removeAsset: ctxRemoveAsset,
        addObligation: ctxAddObligation,
        editObligation: ctxEditObligation,
        removeObligation: ctxRemoveObligation,
        addMintos: ctxAddMintos,
        editMintos: ctxEditMintos,
        removeMintos: ctxRemoveMintos,
        refreshPrices,
        setBaseCurrency,
        switchProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
