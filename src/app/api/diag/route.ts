import { NextResponse } from 'next/server';

// Public diagnostics endpoint – exposes ONLY booleans, never secret values.
// Used to determine why admin/SofizPay APIs fail on Netlify
// (missing env vars vs firebase-admin failing to load).
export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
  const sofiz = process.env.SOFIZPAY_ACCOUNT || process.env.NEXT_PUBLIC_SOFIZPAY_ACCOUNT || '';

  let firebaseAdmin = 'not-tried';
  try {
    const mod = await import('@/lib/firebase-admin');
    mod.getAdminDb();
    firebaseAdmin = 'db-ok';
  } catch (e: any) {
    firebaseAdmin = 'fail: ' + String(e?.message || e).slice(0, 300);
  }

  return NextResponse.json({
    node: process.version,
    hasServiceAccountKey: key.length > 0,
    serviceAccountKeyLength: key.length,
    hasProjectId: projectId.length > 0,
    hasSofizpayAccount: sofiz.length > 0,
    sofizpaySandbox: process.env.SOFIZPAY_SANDBOX || 'unset',
    hasAdminSecretCode: !!process.env.ADMIN_SECRET_CODE,
    firebaseAdmin,
  });
}
