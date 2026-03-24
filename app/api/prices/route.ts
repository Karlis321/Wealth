import { NextRequest, NextResponse } from 'next/server';

// Map "SYMBOL:EXCHANGE" colon format → Yahoo Finance dot suffix
const EXCHANGE_SUFFIX_MAP: Record<string, string> = {
  RG: '.RG',   // Nasdaq Baltic Riga
  TL: '.TL',   // Nasdaq Baltic Tallinn
  VS: '.VS',   // Nasdaq Baltic Vilnius
};

function resolveSymbol(ticker: string): string {
  if (ticker.includes(':')) {
    const [sym, exchange] = ticker.split(':');
    const suffix = EXCHANGE_SUFFIX_MAP[exchange.toUpperCase()];
    return suffix ? `${sym}${suffix}` : sym;
  }
  return ticker;
}

const YF_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

async function fetchYahoo(symbol: string): Promise<Response> {
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const res = await fetch(`https://query1.finance.yahoo.com${path}`, {
    headers: YF_HEADERS,
    cache: 'no-store',
  });
  if (res.ok) return res;
  // Retry on query2 host
  return fetch(`https://query2.finance.yahoo.com${path}`, {
    headers: YF_HEADERS,
    cache: 'no-store',
  });
}

async function fetchFromYahooFinance(ticker: string): Promise<Record<string, unknown>> {
  const symbol = resolveSymbol(ticker);
  const res = await fetchYahoo(symbol);

  if (!res.ok) throw new Error(`Yahoo Finance responded with HTTP ${res.status}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];

  if (!result) {
    const errMsg = json?.chart?.error?.description ?? `Ticker not found: ${symbol}`;
    throw new Error(errMsg);
  }

  const meta = result.meta;
  const price: number = meta.regularMarketPrice;
  const previousClose: number | undefined = meta.chartPreviousClose ?? meta.previousClose;

  if (!isFinite(price) || price <= 0) {
    throw new Error(`Could not extract price for ${ticker} from Yahoo Finance`);
  }

  const change = previousClose != null ? price - previousClose : null;
  const changePercent =
    previousClose != null ? ((price - previousClose) / previousClose) * 100 : null;

  // Yahoo chart meta returns dividend yield as decimal (0.005 = 0.5%) — convert to %
  const rawYield = meta.trailingAnnualDividendYield ?? meta.dividendYield ?? null;
  const exDivRaw = meta.exDividendDate ?? null;

  return {
    ticker: ticker.toUpperCase(),
    price,
    change,
    changePercent,
    currency: meta.currency ?? 'USD',
    name: meta.shortName ?? meta.longName ?? ticker.toUpperCase(),
    sector: null,
    dividendYield: rawYield != null && rawYield > 0 ? rawYield * 100 : null,
    exDividendDate: exDivRaw ? new Date(exDivRaw * 1000).toISOString().split('T')[0] : null,
    annualDividendRate: meta.trailingAnnualDividendRate ?? meta.dividendRate ?? null,
    marketCap: null,
    source: 'yahoo-finance',
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tickers = searchParams.get('tickers')?.split(',').filter(Boolean) ?? [];

  if (tickers.length === 0) {
    return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
  }

  const results: Record<string, unknown> = {};

  await Promise.allSettled(
    tickers.map(async (ticker) => {
      const t = ticker.trim().toUpperCase();
      try {
        results[ticker] = await fetchFromYahooFinance(t);
      } catch (err) {
        results[ticker] = {
          ticker,
          error: err instanceof Error ? err.message : 'Failed to fetch',
          price: null,
        };
      }
    })
  );

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
