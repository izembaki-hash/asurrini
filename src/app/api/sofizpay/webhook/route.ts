import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { checkCibTransaction, mapSofizpayToPaymentStatus } from '@/lib/sofizpay';

/**
 * SofizPay return callback / webhook.
 * SofizPay redirects user to return_url with query params: order_number, transaction_id, cib_transaction_id, signature, status, etc.
 * When keep_return_url=True, SofizPay signs the callback. We verify by re-checking via cib-transaction-check endpoint.
 *
 * This endpoint can be used as return_url itself if you prefer server-side handling, then redirect to /checkout/success.
 * Alternatively, success page calls check-transaction directly.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const policyNumber = searchParams.get('policyNumber') || searchParams.get('memo') || searchParams.get('order_id') || '';
    const order_number = searchParams.get('order_number') || searchParams.get('cib_transaction_id') || searchParams.get('transaction_id') || searchParams.get('orderId') || '';
    const signature = searchParams.get('signature') || searchParams.get('sign') || '';

    // Log webhook call
    console.log('[SofizPay webhook] hit', { policyNumber, order_number, signature: signature ? 'present' : 'missing', url: req.url });

    if (!order_number && !policyNumber) {
      return NextResponse.json({ error: 'Missing order_number or policyNumber' }, { status: 400 });
    }

    let orderToCheck = order_number;
    let resolvedPolicy = policyNumber;

    // If only policyNumber provided, lookup cibTransactionId
    if (!orderToCheck && resolvedPolicy) {
      try {
        const snap = await adminDb.collection('contracts').doc(resolvedPolicy).get();
        if (snap.exists) {
          const data = snap.data() as any;
          orderToCheck = data.cibTransactionId || data.sofizTransactionId || null;
        }
      } catch (dbErr) {
        console.error('[SofizPay webhook] Firestore lookup failed', dbErr);
      }
    }

    // Reverse lookup: if only order_number provided, find contract by cibTransactionId
    if (!resolvedPolicy && orderToCheck) {
      try {
        const q = await adminDb.collection('contracts').where('cibTransactionId', '==', orderToCheck).limit(1).get();
        if (!q.empty) resolvedPolicy = q.docs[0].id;
        else {
          const q2 = await adminDb.collection('contracts').where('sofizTransactionId', '==', orderToCheck).limit(1).get();
          if (!q2.empty) resolvedPolicy = q2.docs[0].id;
        }
      } catch {}
    }

    // If still no orderToCheck, we can't verify
    if (!orderToCheck) {
      return NextResponse.json({ error: 'No transaction id to verify', policyNumber: resolvedPolicy }, { status: 400 });
    }

    const check = await checkCibTransaction(orderToCheck);
    const paymentStatus = mapSofizpayToPaymentStatus(check);

    if (resolvedPolicy) {
      try {
        await adminDb.collection('contracts').doc(resolvedPolicy).set(
          {
            sofizLastCheckAt: new Date().toISOString(),
            sofizLastStatus: check.status,
            sofizLastRaw: check.raw,
            sofizWebhookAt: new Date().toISOString(),
            sofizWebhookSignature: signature || null,
            paymentStatus,
            ...(paymentStatus === 'paid' ? { paidAt: new Date().toISOString(), sofizStatus: check.status } : {}),
            ...(paymentStatus === 'failed' ? { sofizStatus: check.status } : {}),
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.error('[SofizPay webhook] Firestore update failed', dbErr);
      }
    }

    // If this is a browser redirect (return_url), redirect to success page
    const accept = req.headers.get('accept') || '';
    const isBrowser = accept.includes('text/html');
    if (isBrowser && resolvedPolicy) {
      // Extract locale from referer or default to fr
      const host = req.headers.get('host') || '';
      // Try to preserve locale – redirect to /fr/checkout/success
      const locale = searchParams.get('locale') || 'fr';
      const redirectUrl = `/${locale}/checkout/success?policyNumber=${encodeURIComponent(resolvedPolicy)}&order_number=${encodeURIComponent(orderToCheck)}&status=${encodeURIComponent(check.status)}`;
      // Use absolute redirect if possible
      const origin = req.headers.get('origin') || `https://${host}` || 'http://localhost:3000';
      // NextResponse.redirect needs absolute URL
      try {
        const abs = new URL(redirectUrl, origin.startsWith('http') ? origin : `https://${origin}`);
        return NextResponse.redirect(abs.toString(), 302);
      } catch {
        return NextResponse.redirect(redirectUrl, 302);
      }
    }

    return NextResponse.json({
      received: true,
      policyNumber: resolvedPolicy,
      orderNumber: orderToCheck,
      status: check.status,
      paymentStatus,
      isPaid: check.isPaid,
    });
  } catch (error: any) {
    console.error('[SofizPay webhook] error', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // SofizPay may POST webhook in some configurations
  try {
    const body = await req.text();
    let data: any = {};
    try { data = JSON.parse(body); } catch { data = Object.fromEntries(new URLSearchParams(body)); }

    const policyNumber = data.policyNumber || data.memo || data.order_id || '';
    const order_number = data.order_number || data.cib_transaction_id || data.transaction_id || data.orderId || '';

    console.log('[SofizPay webhook POST]', { policyNumber, order_number, data });

    if (order_number) {
      const check = await checkCibTransaction(order_number);
      const paymentStatus = mapSofizpayToPaymentStatus(check);
      if (policyNumber) {
        try {
          await adminDb.collection('contracts').doc(policyNumber).set(
            {
              paymentStatus,
              sofizLastStatus: check.status,
              sofizLastRaw: check.raw,
              paidAt: paymentStatus === 'paid' ? new Date().toISOString() : undefined,
            },
            { merge: true }
          );
        } catch (dbErr) {
          console.error('[SofizPay webhook POST] Firestore update failed', dbErr);
        }
      }
      return NextResponse.json({ received: true, status: check.status, paymentStatus });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
