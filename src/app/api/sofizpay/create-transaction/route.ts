import { NextRequest, NextResponse } from 'next/server';
import { createCibTransaction, getSofizpayConfig } from '@/lib/sofizpay';

// NOTE: firebase-admin is intentionally NOT imported at top level.
// On Netlify, a failing top-level import crashes the whole route with an HTML 500 page.
// We dynamic-import it inside the handler so failures degrade to JSON errors instead.
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      currency,
      locale,
      policyNumber,
      fullName,
      phone,
      email,
      successUrl,
      failureUrl,
      memo,
    } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (!policyNumber) {
      return NextResponse.json({ error: 'policyNumber is required' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const { account } = getSofizpayConfig();
    if (!account) {
      return NextResponse.json(
        { error: 'SofizPay is not configured (SOFIZPAY_ACCOUNT missing). Contact administrator.' },
        { status: 500 }
      );
    }

    const origin = req.headers.get('origin') || req.headers.get('x-forwarded-host') || 'http://localhost:3000';
    // origin may be without protocol when using x-forwarded-host
    const baseOrigin = origin.startsWith('http') ? origin : `https://${origin}`;

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

    const returnUrl =
      fixUrl(successUrl) ||
      `${baseOrigin}/${safeLocale}/checkout/success?policyNumber=${encodeURIComponent(policyNumber)}`;

    // Ensure return_url contains policyNumber for verification after redirect
    let finalReturnUrl = returnUrl;
    try {
      const u = new URL(returnUrl);
      if (!u.searchParams.get('policyNumber')) {
        u.searchParams.set('policyNumber', policyNumber);
      }
      finalReturnUrl = u.toString();
    } catch {
      // fallback
      finalReturnUrl = returnUrl.includes('policyNumber=') ? returnUrl : `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}policyNumber=${encodeURIComponent(policyNumber)}`;
    }

    const full_name = (fullName || 'Client ASSURINI').trim() || 'Client ASSURINI';
    // SofizPay requires phone – use provided or placeholder (Algerian format)
    let phoneNormalized = (phone || '').trim();
    if (!phoneNormalized) phoneNormalized = '+213000000000';
    // Ensure phone starts with +213 or 0 – SofizPay accepts international format
    if (!phoneNormalized.startsWith('+')) {
      if (phoneNormalized.startsWith('0')) phoneNormalized = '+213' + phoneNormalized.slice(1);
      else if (!phoneNormalized.startsWith('213')) phoneNormalized = '+213' + phoneNormalized;
      else phoneNormalized = '+' + phoneNormalized;
    }

    const result = await createCibTransaction({
      amount: Number(amount),
      full_name,
      phone: phoneNormalized,
      email,
      return_url: finalReturnUrl,
      memo: memo || policyNumber,
      redirect: 'no',
      keep_return_url: 'True',
    });

    // Update contract in Firestore with SofizPay transaction ids and pending status
    // (best-effort: payment_url is returned even if Firestore/Firebase is unavailable)
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      await adminDb.collection('contracts').doc(policyNumber).set(
        {
          paymentStatus: 'pending',
          paymentProvider: 'sofizpay',
          sofizTransactionId: result.transaction_id,
          cibTransactionId: result.cib_transaction_id,
          sofizStatus: result.status,
          sofizPaymentUrl: result.payment_url,
          sofizMoreInfoUrl: result.more_info_url,
          sofizCreatedAt: new Date().toISOString(),
          currency: currency || 'DZD',
          amount: Number(amount),
        },
        { merge: true }
      );

      // Also create a payment log for audit
      await adminDb.collection('payments').doc(result.transaction_id || policyNumber).set({
        policyNumber,
        provider: 'sofizpay',
        amount: Number(amount),
        currency: currency || 'DZD',
        email,
        fullName: full_name,
        phone: phoneNormalized,
        sofizTransactionId: result.transaction_id,
        cibTransactionId: result.cib_transaction_id,
        paymentUrl: result.payment_url,
        status: result.status,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        returnUrl: finalReturnUrl,
        rawResponse: result.raw,
      });
    } catch (dbErr) {
      console.error('[SofizPay] Firestore update failed', dbErr);
      // Don't fail the request – payment_url is still usable, but log
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transaction_id,
      cibTransactionId: result.cib_transaction_id,
      paymentUrl: result.payment_url,
      moreInfoUrl: result.more_info_url,
      status: result.status,
    });
  } catch (error: any) {
    console.error('[SofizPay] create-transaction error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use POST' }, { status: 405 });
}
