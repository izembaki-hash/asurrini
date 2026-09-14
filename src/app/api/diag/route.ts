import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Minimal diag – does NOT import firebase-admin at all.
// This must never crash; it only checks env var presence/format.
export async function GET() {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '';
    const keyTrim = raw.trim();
    const hasKey = keyTrim.length > 0;
    const keyLooksJson = hasKey && keyTrim.startsWith('{') && keyTrim.endsWith('}');
    let keyJsonOk = 'skipped';
    let keyParseError = '';
    let keyHasPrivateKey = false;
    let keyProjectId = '';
    if (hasKey) {
      try {
        const parsed = JSON.parse(keyTrim);
        keyJsonOk = 'json-ok';
        keyHasPrivateKey = typeof parsed.private_key === 'string' && parsed.private_key.includes('BEGIN PRIVATE KEY');
        keyProjectId = parsed.project_id || '';
      } catch (e: any) {
        keyJsonOk = 'json-fail';
        keyParseError = String(e?.message || e).slice(0, 400);
      }
    }

    // Test if firebase-admin can actually initialize (not just import)
    let firebaseAdminInit = 'not-tested';
    try {
      const { getAdminDb } = await import('@/lib/firebase-admin');
      getAdminDb();
      firebaseAdminInit = 'db-ok';
    } catch (e: any) {
      firebaseAdminInit = 'fail: ' + String(e?.message || e).slice(0, 300);
    }

    let firebaseAdminAuth = 'not-tested';
    try {
      const { getAdminAuth } = await import('@/lib/firebase-admin');
      getAdminAuth();
      firebaseAdminAuth = 'auth-ok';
    } catch (e: any) {
      firebaseAdminAuth = 'fail: ' + String(e?.message || e).slice(0, 300);
    }

    return NextResponse.json({
      node: process.version,
      hasServiceAccountKey: hasKey,
      serviceAccountKeyLength: raw.length,
      keyLooksJson,
      keyJsonOk,
      keyParseError,
      keyHasPrivateKey,
      keyProjectId,
      keyFirst30: keyTrim.slice(0, 30),
      keyLast30: keyTrim.slice(-30),
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      hasSofizpayAccount: !!(process.env.SOFIZPAY_ACCOUNT || process.env.NEXT_PUBLIC_SOFIZPAY_ACCOUNT),
      sofizpaySandbox: process.env.SOFIZPAY_SANDBOX || 'unset',
      hasAdminSecretCode: !!process.env.ADMIN_SECRET_CODE,
      hasGroqKey: !!process.env.GROQ_API_KEY,
      groqKeyLength: (process.env.GROQ_API_KEY || '').length,
      firebaseAdminInit,
      firebaseAdminAuth,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'diag-crashed', message: String(e?.message || e).slice(0, 800) }, { status: 500 });
  }
}
