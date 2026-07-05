import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = await verifyAdmin(req);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  try {
    const doc = await adminDb.collection('insurance_providers').doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = await verifyAdmin(req);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, logo, isActive, apiConfig, products } = body;

    if (!name) return NextResponse.json({ error: 'Provider name is required' }, { status: 400 });

    await adminDb.collection('insurance_providers').doc(id).update({
      name,
      logo: logo || '',
      isActive: isActive ?? true,
      apiConfig: apiConfig || { baseUrl: '', authType: 'bearer', apiKey: '', timeout: 10000 },
      products: products || [],
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = await verifyAdmin(req);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  try {
    await adminDb.collection('insurance_providers').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
