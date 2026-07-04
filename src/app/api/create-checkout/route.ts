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

    const chargilyPayload: Record<string, unknown> = {
      amount: Math.round(amount * 100),
      currency: currency?.toLowerCase() || 'dzd',
      success_url: successUrl || `${origin}/${locale || 'fr'}/checkout/success`,
      failure_url: failureUrl || `${origin}/${locale || 'fr'}/checkout`,
      metadata: metadata || {},
      locale: locale || 'fr',
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

    if (!response.ok) {
      console.error('Chargily API error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to create checkout' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      checkoutId: data.id,
      paymentUrl: data.url,
    });
  } catch (error: any) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
