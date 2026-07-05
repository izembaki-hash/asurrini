import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const decoded = await verifyAdmin(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const status = url.searchParams.get('status') || '';
  const search = url.searchParams.get('search') || '';

  try {
    let query: FirebaseFirestore.Query = adminDb.collection('contracts').orderBy('createdAt', 'desc');

    const allSnap = await query.get();
    let contracts = allSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (status) {
      contracts = contracts.filter((c: any) => c.paymentStatus === status);
    }

    if (search) {
      const s = search.toLowerCase();
      contracts = contracts.filter((c: any) =>
        (c.policyNumber?.toLowerCase().includes(s)) ||
        (c.userEmail?.toLowerCase().includes(s)) ||
        (c.userFullName?.toLowerCase().includes(s)) ||
        (c.planName?.toLowerCase().includes(s))
      );
    }

    const total = contracts.length;
    const start = (page - 1) * limit;
    const paginated = contracts.slice(start, start + limit);

    return NextResponse.json({ contracts: paginated, total, page, limit });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
