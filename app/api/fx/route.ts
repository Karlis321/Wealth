import { NextResponse } from 'next/server';

// Uses open.er-api.com — free, no API key required, updated every 24h
const FX_URL = 'https://open.er-api.com/v6/latest/USD';

let cache: { rates: Record<string, number>; ts: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ base: 'USD', rates: cache.rates });
  }

  try {
    const res = await fetch(FX_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`FX API error: ${res.status}`);
    const data = await res.json();

    cache = { rates: data.rates, ts: Date.now() };
    return NextResponse.json({ base: 'USD', rates: data.rates });
  } catch (err) {
    // Fallback rates if API is unreachable
    const fallback: Record<string, number> = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 157,
      CHF: 0.9,
      CAD: 1.36,
      AUD: 1.52,
      SEK: 10.6,
      NOK: 10.5,
      DKK: 6.88,
    };
    return NextResponse.json(
      { base: 'USD', rates: fallback, fallback: true, error: String(err) },
      { status: 200 }
    );
  }
}
