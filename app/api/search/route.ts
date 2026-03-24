import { NextRequest, NextResponse } from 'next/server';

// Map Yahoo Finance exchange codes → colon-format exchange suffix stored in the ticker
// (prices/route.ts converts SYMBOL:SUFFIX back to Yahoo Finance dot-suffix format)
const EXCHANGE_MAP: Record<string, string> = {
  NMS: 'NASDAQ', NGM: 'NASDAQ', NCM: 'NASDAQ', NMF: 'NASDAQ',
  NYQ: 'NYSE',
  ASE: 'NYSEAMERICAN',
  PCX: 'NYSEARCA', BTS: 'NYSEARCA',
  LSE: 'LON',
  FRA: 'FRA', GER: 'ETR',
  PAR: 'EPA',
  AMS: 'AMS',
  STO: 'STO',
  HEL: 'HEL',
  CPH: 'CPH',
  OSL: 'OSL',
  TSX: 'TSX',
  TOR: 'TSX',
};

// Yahoo Finance exchange codes for Nasdaq Baltic — symbol already includes dot suffix
const BALTIC_EXCHANGE_DISPLAY: Record<string, string> = {
  LIT: 'Nasdaq Baltic Vilnius',
  RIS: 'Nasdaq Baltic Riga',
  TLS: 'Nasdaq Baltic Tallinn',
};

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') ?? '';
  if (q.length < 2) return NextResponse.json([]);

  const url =
    `https://query2.finance.yahoo.com/v1/finance/search` +
    `?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&listsCount=0&enableFuzzyQuery=false&enableCb=false`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!res.ok) return NextResponse.json([]);

    const json = await res.json();
    const quotes: Record<string, string>[] = json?.quotes ?? [];

    const filtered = quotes.filter((q) =>
      ['EQUITY', 'ETF', 'MUTUALFUND'].includes(q.quoteType)
    );

    // Sort Baltic listings first so they appear at the top for Baltic stocks
    const sorted = [
      ...filtered.filter((q) => q.exchange in BALTIC_EXCHANGE_DISPLAY),
      ...filtered.filter((q) => !(q.exchange in BALTIC_EXCHANGE_DISPLAY)),
    ];

    const results = sorted.slice(0, 7).map((q) => {
      const balticLabel = BALTIC_EXCHANGE_DISPLAY[q.exchange];
      const googleExchange = EXCHANGE_MAP[q.exchange] ?? '';
      // Baltic symbols already have the dot suffix (e.g. IGN1L.VS) — use as-is
      const ticker = balticLabel
        ? q.symbol
        : googleExchange
        ? `${q.symbol}:${googleExchange}`
        : q.symbol;
      return {
        ticker,
        name: q.longname || q.shortname || q.symbol,
        exchange: balticLabel || q.exchDisp || q.exchange || '',
        type: q.quoteType,
      };
    });

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
