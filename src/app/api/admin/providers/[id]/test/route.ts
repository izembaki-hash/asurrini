import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = await verifyAdmin(req);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  try {
    const doc = await adminDb.collection('insurance_providers').doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    const provider = doc.data()!;
    const { baseUrl, authType, apiKey, timeout } = provider.apiConfig || {};

    if (!baseUrl) {
      return NextResponse.json({ success: false, error: 'No base URL configured' });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authType === 'bearer') headers['Authorization'] = `Bearer ${apiKey}`;
    if (authType === 'api_key') headers['X-API-Key'] = apiKey;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout || 10000);

    const start = Date.now();
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/health`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latency = Date.now() - start;

    return NextResponse.json({
      success: res.ok,
      statusCode: res.status,
      latency,
      message: res.ok ? 'API is reachable' : `HTTP ${res.status}: ${res.statusText}`,
    });
  } catch (error: any) {
    const message = error.name === 'AbortError' ? 'Request timed out' : error.message;
    return NextResponse.json({ success: false, error: message });
  }
}
