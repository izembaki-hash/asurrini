import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ policyNumber: string }> }) {
  const decoded = await verifyAdmin(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { policyNumber } = await params;

  try {
    const doc = await adminDb.collection('contracts').doc(policyNumber).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ policyNumber: string }> }) {
  const decoded = await verifyAdmin(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { policyNumber } = await params;

  try {
    const body = await req.json();
    const updates: Record<string, any> = {};
    const allowedFields = ['paymentStatus', 'planName', 'provider', 'originalPrice', 'startDate', 'endDate', 'destination', 'coverageDetails', 'notes'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    updates.lastModifiedDate = new Date().toISOString();

    await adminDb.collection('contracts').doc(policyNumber).update(updates);

    await adminDb.collection('audit_logs').add({
      action: 'update_contract',
      performedBy: decoded.uid,
      targetType: 'contract',
      targetId: policyNumber,
      changes: updates,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
