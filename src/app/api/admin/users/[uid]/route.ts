import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const decoded = await verifyAdmin(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { uid } = await params;

  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const adminDb = getAdminDb();
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const contractsSnap = await adminDb.collection('contracts').where('userEmail', '==', userDoc.data()?.email).get();
    const contracts = contractsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ user: { uid, ...userDoc.data() }, contracts });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const decoded = await verifyAdmin(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { uid } = await params;

  try {
    const body = await req.json();
    const allowedFields = ['fullName', 'passportNumber', 'phoneNumber', 'address'];
    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { getAdminDb } = await import('@/lib/firebase-admin');
    const adminDb = getAdminDb();

    if (Object.keys(updates).length > 0) {
      await adminDb.collection('users').doc(uid).update(updates);
    }

    if (body.disabled !== undefined) {
      const { getAdminAuth } = await import('@/lib/firebase-admin');
      const adminAuth = getAdminAuth();
      await adminAuth.updateUser(uid, { disabled: body.disabled });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
