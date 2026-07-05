import { NextRequest, NextResponse } from 'next/server';

const CHARGILY_API_KEY = process.env.CHARGILY_API_KEY!;
const CHARGILY_SECRET_KEY = process.env.CHARGILY_SECRET_KEY!;
const CHARGILY_BASE_URL = process.env.CHARGILY_BASE_URL!;

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, locale, metadata, successUrl, failureUrl } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const validLocales = ['fr', 'en', 'ar'];
    const safeLocale = validLocales.includes(locale) ? locale : 'fr';

    const fixUrl = (url: string) => {
      if (!url) return '';
      try {
        const u = new URL(url);
        const segments = u.pathname.split('/').filter(Boolean);
        if (!validLocales.includes(segments[0] || '')) {
          u.pathname = `/${safeLocale}${u.pathname}`;
        }
        return u.toString();
      } catch {
        return url;
      }
    };

    const chargilyPayload: Record<string, unknown> = {
      amount: Math.round(amount * 100),
      currency: currency?.toLowerCase() || 'dzd',
      success_url: fixUrl(successUrl) || `${origin}/${safeLocale}/checkout/success`,
      failure_url: fixUrl(failureUrl) || `${origin}/${safeLocale}/checkout`,
      metadata: metadata || {},
      locale: safeLocale,
    };

    const response = await fetch(`${CHARGILY_BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHARGILY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chargilyPayload),
    });

    const data = await response.json();

    console.log('Chargily response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Chargily API error:', data);
      return NextResponse.json(
        { error: data.message || data.detail || 'Failed to create checkout' },
        { status: response.status }
      );
    }

    const paymentUrl = data.url || data.payment_url || data.checkout_url || data.redirect_url;

    if (!paymentUrl) {
      console.error('Chargily response missing payment URL:', data);
      return NextResponse.json(
        { error: 'Payment URL not found in Chargily response' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      checkoutId: data.id,
      paymentUrl,
    });
  } catch (error: any) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
