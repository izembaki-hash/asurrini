import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';

const CHARGILY_SECRET_KEY = process.env.CHARGILY_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const rawBody = await req.text();
    const computedSignature = crypto
      .createHmac('sha256', CHARGILY_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    if (computedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const event = JSON.parse(rawBody);

    if (event.type === 'checkout.paid') {
      const checkout = event.data;
      const metadata = checkout.metadata || {};

      if (metadata.policyNumber) {
        await adminDb
          .collection('contracts')
          .doc(metadata.policyNumber)
          .update({
            paymentStatus: 'paid',
            paidAt: new Date().toISOString(),
            checkoutId: checkout.id,
          });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
