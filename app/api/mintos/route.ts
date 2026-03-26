import { NextResponse } from 'next/server';

const MINTOS_BASE = 'https://www.mintos.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * POST /api/mintos
 * Body: { sessionCookie: string }
 *
 * Uses the caller's live browser session cookie to call Mintos's internal REST API.
 * The cookie is never stored — it is only forwarded to mintos.com for this request.
 *
 * How to get the cookie:
 *   1. Log in to mintos.com in your browser
 *   2. Open DevTools → Network tab → refresh the page
 *   3. Click any request to www.mintos.com → Headers → Request Headers
 *   4. Copy the full value of the "Cookie" header
 *   5. Paste it into the sync modal
 */
export async function POST(req: Request) {
  let sessionCookie: string;

  try {
    const body = await req.json() as { sessionCookie?: string };
    sessionCookie = (body.sessionCookie ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Session cookie is required.' }, { status: 400 });
  }

  const headers = {
    'Cookie': sessionCookie,
    'User-Agent': UA,
    'Accept': 'application/json, text/plain, */*',
    'Referer': `${MINTOS_BASE}/en/overview/`,
    'X-Requested-With': 'XMLHttpRequest',
  };

  // ── Try each known Mintos internal endpoint until one succeeds ────────────
  // Mintos's SPA calls different endpoints depending on their frontend version.
  // We probe the most likely ones in order.

  const endpoints = [
    `${MINTOS_BASE}/api/v1/investor-profile/overview`,
    `${MINTOS_BASE}/api/v1/investor/portfolio/summary`,
    `${MINTOS_BASE}/api/v1/account/summary`,
    `${MINTOS_BASE}/en/api/v1/investor-profile/overview`,
  ];

  let lastStatus = 0;
  let rawData: Record<string, unknown> | null = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers });
      lastStatus = res.status;

      if (res.ok) {
        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          rawData = (await res.json()) as Record<string, unknown>;
          break;
        }
        // Got HTML back — session cookie is valid but endpoint is wrong
        // (Mintos returns the SPA shell for unknown routes)
        continue;
      }

      if (res.status === 401 || res.status === 403) {
        // Cookie is rejected — expired or wrong
        return NextResponse.json(
          {
            error:
              'Mintos rejected the session cookie (expired or invalid). ' +
              'Please log in to Mintos again in your browser and copy a fresh cookie.',
          },
          { status: 401 }
        );
      }
    } catch {
      // Network error on this endpoint — try next
    }
  }

  if (!rawData) {
    return NextResponse.json(
      {
        error:
          `Could not find a working Mintos API endpoint (last HTTP status: ${lastStatus}). ` +
          'Mintos may have changed their internal API. ' +
          'See the instructions in the sync modal to find the correct endpoint from your browser network tab.',
      },
      { status: 502 }
    );
  }

  // ── Map response fields → MintosAccount shape ─────────────────────────────
  // Mintos's field names vary by API version — cover known variants.
  function pick(obj: Record<string, unknown>, ...keys: string[]): number {
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === 'number') return v;
      // Some endpoints nest values as { amount: number, currency: string }
      if (v && typeof v === 'object' && 'amount' in (v as object)) {
        const amount = (v as Record<string, unknown>).amount;
        if (typeof amount === 'number') return amount;
      }
    }
    return 0;
  }

  function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === 'string') return v;
    }
    return 'EUR';
  }

  // Mintos sometimes nests portfolio data one level deeper
  const data: Record<string, unknown> = (rawData.data ?? rawData.portfolio ?? rawData) as Record<string, unknown>;

  return NextResponse.json({
    totalInvested: pick(data,
      'invested_funds', 'investedFunds', 'total_invested', 'totalInvested',
      'outstanding_principal', 'outstandingPrincipal'
    ),
    availableFunds: pick(data,
      'available_funds', 'availableFunds', 'cash', 'balance', 'available_balance'
    ),
    totalInterestEarned: pick(data,
      'interest_received', 'interestReceived', 'total_interest', 'totalInterest',
      'earned_interest', 'earnedInterest', 'interest_income', 'interestIncome'
    ),
    netAnnualReturn: pick(data,
      'nar', 'net_annual_return', 'netAnnualReturn', 'xirr', 'annual_return'
    ),
    pendingPayments: pick(data,
      'pending_payments', 'pendingPayments', 'scheduled_payments', 'pending'
    ),
    currency: pickStr(data,
      'currency', 'account_currency', 'accountCurrency', 'base_currency'
    ),
    // Include raw keys to help debug if values come back as 0
    _rawKeys: Object.keys(rawData),
  });
}
