import { NextResponse } from 'next/server';

const MINTOS_BASE = 'https://www.mintos.com';

/**
 * POST /api/mintos
 * Body: { email: string; password: string }
 *
 * Attempts to authenticate with Mintos and return account overview data.
 *
 * Note: Mintos uses reCAPTCHA on their login page, which may block automated
 * requests. If sync fails, use manual entry in the UI instead.
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json() as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    // Step 1: GET the login page to collect cookies / CSRF token
    const loginPageRes = await fetch(`${MINTOS_BASE}/en/login/`, {
      headers: { 'User-Agent': userAgent },
      redirect: 'follow',
    });

    const rawCookies = loginPageRes.headers.getSetCookie?.() ?? [];
    const cookieHeader = rawCookies
      .map((c) => c.split(';')[0])
      .join('; ');

    // Extract CSRF token from the page HTML (Mintos may include it as a meta tag or hidden input)
    const html = await loginPageRes.text();
    const csrfMatch =
      html.match(/name="csrfmiddlewaretoken"[^>]*value="([^"]+)"/) ??
      html.match(/<meta[^>]+name="csrf-token"[^>]+content="([^"]+)"/);
    const csrfToken = csrfMatch?.[1] ?? '';

    // Step 2: Attempt login — try JSON API first, fall back to form POST
    const loginRes = await fetch(`${MINTOS_BASE}/api/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        'User-Agent': userAgent,
        'Referer': `${MINTOS_BASE}/en/login/`,
        'X-CSRFToken': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ email, password }),
      redirect: 'follow',
    });

    // Build cookie jar from login response
    const loginCookies = loginRes.headers.getSetCookie?.() ?? [];
    const sessionCookies = [
      ...rawCookies,
      ...loginCookies,
    ]
      .map((c) => c.split(';')[0])
      .join('; ');

    if (!loginRes.ok) {
      // Mintos may respond with 4xx when CAPTCHA is needed
      return NextResponse.json(
        {
          error:
            `Mintos login failed (HTTP ${loginRes.status}). ` +
            'This usually means CAPTCHA verification is required. ' +
            'Please enter your data manually.',
        },
        { status: 401 }
      );
    }

    let loginJson: Record<string, unknown> = {};
    try {
      loginJson = (await loginRes.json()) as Record<string, unknown>;
    } catch {
      // non-JSON response — login may still have succeeded via cookie redirect
    }

    if (loginJson.captcha_required || loginJson.error) {
      return NextResponse.json(
        { error: 'Mintos requires CAPTCHA. Please enter your data manually.' },
        { status: 401 }
      );
    }

    const bearerToken =
      typeof loginJson.token === 'string'
        ? loginJson.token
        : typeof loginJson.access_token === 'string'
        ? loginJson.access_token
        : '';

    // Step 3: Fetch account overview
    const overviewRes = await fetch(`${MINTOS_BASE}/api/v1/investor-profile/overview`, {
      headers: {
        'Cookie': sessionCookies,
        'User-Agent': userAgent,
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!overviewRes.ok) {
      return NextResponse.json(
        {
          error:
            `Could not fetch account data (HTTP ${overviewRes.status}). ` +
            'Mintos may have updated their API. Please enter your data manually.',
        },
        { status: 502 }
      );
    }

    const overview = (await overviewRes.json()) as Record<string, unknown>;

    // Map Mintos API fields → our MintosAccount shape.
    // Field names are inferred from Mintos's frontend — update here if they change.
    const result = {
      totalInvested:
        (overview.invested_funds as number) ??
        (overview.investedFunds as number) ??
        (overview.total_invested as number) ??
        0,
      availableFunds:
        (overview.available_funds as number) ??
        (overview.availableFunds as number) ??
        0,
      totalInterestEarned:
        (overview.interest_received as number) ??
        (overview.interestReceived as number) ??
        (overview.total_interest as number) ??
        0,
      netAnnualReturn:
        (overview.nar as number) ??
        (overview.net_annual_return as number) ??
        (overview.netAnnualReturn as number) ??
        0,
      pendingPayments:
        (overview.pending_payments as number) ??
        (overview.pendingPayments as number) ??
        0,
      currency:
        typeof overview.currency === 'string' ? overview.currency : 'EUR',
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[mintos sync error]', err);
    return NextResponse.json(
      { error: 'Could not reach Mintos. Check your connection or enter data manually.' },
      { status: 500 }
    );
  }
}
