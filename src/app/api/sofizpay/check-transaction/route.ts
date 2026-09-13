import { NextRequest, NextResponse } from 'next/server';
import { checkCibTransaction, mapSofizpayToPaymentStatus } from '@/lib/sofizpay';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { policyNumber, order_number, orderNumber, cibTransactionId, transactionId } = body;

    // Resolve order_number to check – priority: explicit order_number > cibTransactionId > transactionId > lookup from contract
    let orderToCheck: string | null = order_number || orderNumber || cibTransactionId || transactionId || null;

    if (!orderToCheck && policyNumber) {
      const snap = await adminDb.collection('contracts').doc(policyNumber).get();
      if (snap.exists) {
        const data = snap.data() as any;
        orderToCheck = data.cibTransactionId || data.sofizTransactionId || data.checkoutId || null;
      }
    }

    if (!orderToCheck) {
      return NextResponse.json({ error: 'order_number / cibTransactionId required (or provide policyNumber with stored transaction)' }, { status: 400 });
    }

    const check = await checkCibTransaction(orderToCheck);
    const paymentStatus = mapSofizpayToPaymentStatus(check);

    // Update contract if policyNumber provided
    if (policyNumber) {
      try {
        const updates: Record<string, any> = {
          sofizLastCheckAt: new Date().toISOString(),
          sofizLastStatus: check.status,
          sofizLastRaw: check.raw,
        };
        if (paymentStatus === 'paid') {
          updates.paymentStatus = 'paid';
          updates.paidAt = new Date().toISOString();
          updates.sofizStatus = check.status;
        } else if (paymentStatus === 'failed') {
          updates.paymentStatus = 'failed';
          updates.sofizStatus = check.status;
        } else {
          // pending stays pending
          if (!check.isPending) {
            updates.paymentStatus = 'pending';
          }
        }
        await adminDb.collection('contracts').doc(policyNumber).set(updates, { merge: true });

        // Also update payments collection if exists
        if (check.raw?.transaction_id || orderToCheck) {
          const payId = (check.raw?.transaction_id as string) || orderToCheck;
          try {
            await adminDb.collection('payments').doc(payId).set(
              {
                lastCheckAt: new Date().toISOString(),
                lastStatus: check.status,
                paymentStatus,
                rawCheck: check.raw,
              },
              { merge: true }
            );
          } catch {}
        }
      } catch (e) {
        console.error('[SofizPay] check update Firestore failed', e);
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: orderToCheck,
      status: check.status,
      paymentStatus,
      isPaid: check.isPaid,
      isFailed: check.isFailed,
      isPending: check.isPending,
      raw: check.raw,
    });
  } catch (error: any) {
    console.error('[SofizPay] check-transaction error', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const policyNumber = searchParams.get('policyNumber');
    const order_number = searchParams.get('order_number') || searchParams.get('orderNumber') || searchParams.get('cibTransactionId') || searchParams.get('transactionId');

    if (!policyNumber && !order_number) {
      return NextResponse.json({ error: 'policyNumber or order_number required' }, { status: 400 });
    }

    let orderToCheck: string | null = order_number;

    if (!orderToCheck && policyNumber) {
      const snap = await adminDb.collection('contracts').doc(policyNumber).get();
      if (snap.exists) {
        const data = snap.data() as any;
        orderToCheck = data.cibTransactionId || data.sofizTransactionId || null;
      }
    }

    if (!orderToCheck) {
      return NextResponse.json({ error: 'No transaction id found for policy', status: 'unknown', paymentStatus: 'pending' }, { status: 404 });
    }

    const check = await checkCibTransaction(orderToCheck);
    const paymentStatus = mapSofizpayToPaymentStatus(check);

    if (policyNumber) {
      try {
        const updates: Record<string, any> = {
          sofizLastCheckAt: new Date().toISOString(),
          sofizLastStatus: check.status,
          sofizLastRaw: check.raw,
        };
        if (paymentStatus === 'paid') {
          updates.paymentStatus = 'paid';
          updates.paidAt = new Date().toISOString();
        } else if (paymentStatus === 'failed') {
          updates.paymentStatus = 'failed';
        }
        await adminDb.collection('contracts').doc(policyNumber).set(updates, { merge: true });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      orderNumber: orderToCheck,
      status: check.status,
      paymentStatus,
      isPaid: check.isPaid,
      isFailed: check.isFailed,
      isPending: check.isPending,
      raw: check.raw,
    });
  } catch (error: any) {
    console.error('[SofizPay] check GET error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
