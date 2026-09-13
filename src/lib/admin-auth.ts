import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function verifyAdmin(req: NextRequest) {
  // Must NEVER throw: every admin route calls this outside try/catch,
  // and a throw becomes an HTML 500 page instead of a JSON error.
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) return null;

    try {
      const decoded = await adminAuth.verifyIdToken(token);
      if (decoded.admin === true) {
        return decoded;
      }
      return null;
    } catch {
      return null;
    }
  } catch (e) {
    console.error('[admin-auth] verifyAdmin failed', e);
    return null;
  }
}
