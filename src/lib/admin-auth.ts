import { NextRequest } from 'next/server';

export async function verifyAdmin(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[admin-auth] no bearer token');
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) return null;

    console.log('[admin-auth] token length:', token.length);

    // Dynamic import — never at top level
    const { getAdminAuth } = await import('@/lib/firebase-admin');
    console.log('[admin-auth] getAdminAuth imported ok');

    const adminAuth = getAdminAuth();
    console.log('[admin-auth] getAdminAuth() returned ok');

    const decoded = await adminAuth.verifyIdToken(token);
    console.log('[admin-auth] verifyIdToken ok, uid:', decoded.uid, 'admin:', decoded.admin);

    if (decoded.admin === true) {
      return decoded;
    }
    console.log('[admin-auth] user is NOT admin, claims:', JSON.stringify(decoded).slice(0, 300));
    return null;
  } catch (e: any) {
    console.error('[admin-auth] verifyAdmin FAILED:', e?.message || e);
    console.error('[admin-auth] stack:', e?.stack?.slice(0, 500));
    return null;
  }
}
