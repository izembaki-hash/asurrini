import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const decoded = await verifyAdmin(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';

  try {
    const contractsSnap = await adminDb.collection('contracts').get();
    let payments = contractsSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          policyNumber: doc.id,
          userEmail: data.userEmail,
          userFullName: data.userFullName,
          originalPrice: data.originalPrice,
          currency: data.currency,
          paymentStatus: data.paymentStatus || 'unknown',
          paidAt: data.paidAt || null,
          checkoutId: data.checkoutId || null,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        };
      })
      .filter((p) => p.paymentStatus !== 'unknown');

    if (status) {
      payments = payments.filter((p) => p.paymentStatus === status);
    }

    payments.sort((a, b) => {
      const dateA = a.paidAt || a.createdAt || '';
      const dateB = b.paidAt || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
