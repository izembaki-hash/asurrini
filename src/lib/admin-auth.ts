import { NextRequest } from 'next/server';

export async function verifyAdmin(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) return null;

    // Dynamic import — never at top level
    const { getAdminAuth } = await import('@/lib/firebase-admin');
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.admin === true) {
      return decoded;
    }
    return null;
  } catch (e: any) {
    // Log the actual error so we can debug
    console.error('[admin-auth] verifyAdmin failed:', e?.message || e);
    return null;
  }
}
