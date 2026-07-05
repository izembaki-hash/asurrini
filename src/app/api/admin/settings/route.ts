import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminDb } from '@/lib/firebase-admin';

const SETTINGS_DOC_ID = 'insurance_config';

export async function GET(req: NextRequest) {
  const decoded = await verifyAdmin(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const doc = await adminDb.collection('settings').doc(SETTINGS_DOC_ID).get();
    return NextResponse.json({ settings: doc.exists ? doc.data() : null });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const decoded = await verifyAdmin(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    await adminDb.collection('settings').doc(SETTINGS_DOC_ID).set(body, { merge: true });

    await adminDb.collection('audit_logs').add({
      action: 'update_settings',
      performedBy: decoded.uid,
      targetType: 'settings',
      targetId: SETTINGS_DOC_ID,
      changes: body,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
