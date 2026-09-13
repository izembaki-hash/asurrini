import { NextResponse } from 'next/server';

// Public diagnostics endpoint – exposes ONLY booleans, never secret values.
// Used to determine why admin/SofizPay APIs fail on Netlify
// (missing env vars vs firebase-admin failing to load).
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '';
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
    const sofiz = process.env.SOFIZPAY_ACCOUNT || process.env.NEXT_PUBLIC_SOFIZPAY_ACCOUNT || '';

    // Never let this route crash – it must always return JSON
    const keyTrim = raw.trim();
    const keyLooksJson = keyTrim.startsWith('{') && keyTrim.endsWith('}');
    let keyJsonOk: string = 'not-checked';
    try {
      if (keyTrim) JSON.parse(keyTrim);
      keyJsonOk = 'json-ok';
    } catch (e: any) {
      keyJsonOk = 'json-fail: ' + String(e?.message || e).slice(0, 200);
    }

    let firebaseAdmin = 'not-tried';
    try {
      const mod = await import('@/lib/firebase-admin');
      mod.getAdminDb();
      firebaseAdmin = 'db-ok';
    } catch (e: any) {
      firebaseAdmin = 'fail: ' + String(e?.message || e).slice(0, 500);
    }

    return NextResponse.json({
      node: process.version,
      hasServiceAccountKey: raw.length > 0,
      serviceAccountKeyLength: raw.length,
      keyLooksJson,
      keyJsonOk,
      keyFirst20: keyTrim.slice(0, 20),
      keyLast20: keyTrim.slice(-20),
      hasProjectId: projectId.length > 0,
      hasSofizpayAccount: sofiz.length > 0,
      sofizpaySandbox: process.env.SOFIZPAY_SANDBOX || 'unset',
      hasAdminSecretCode: !!process.env.ADMIN_SECRET_CODE,
      firebaseAdmin,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'diag-crashed', message: String(e?.message || e).slice(0, 500), stack: String(e?.stack || '').slice(0, 800) }, { status: 500 });
  }
}
