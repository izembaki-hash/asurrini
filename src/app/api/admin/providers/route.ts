import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const decoded = await verifyAdmin(req);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const snap = await adminDb.collection('insurance_providers').orderBy('name').get();
    const providers = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const decoded = await verifyAdmin(req);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const body = await req.json();
    const { name, logo, isActive, apiConfig, products } = body;

    if (!name) return NextResponse.json({ error: 'Provider name is required' }, { status: 400 });

    const doc = {
      name,
      logo: logo || '',
      isActive: isActive ?? true,
      apiConfig: apiConfig || { baseUrl: '', authType: 'bearer', apiKey: '', timeout: 10000 },
      products: products || [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const ref = await adminDb.collection('insurance_providers').add(doc);

    return NextResponse.json({ success: true, id: ref.id });
  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
