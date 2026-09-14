import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const decoded = await verifyAdmin(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '100');

  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('audit_logs').orderBy('timestamp', 'desc').limit(limit).get();
    const logs = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: typeof data.timestamp?.toDate === 'function' ? data.timestamp.toDate().toISOString() : data.timestamp,
      };
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
