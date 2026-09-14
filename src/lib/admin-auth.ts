import { NextRequest } from 'next/server';
import { verifyFirebaseToken } from '@/lib/verify-firebase-token';

export async function verifyAdmin(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) return null;

    const decoded = await verifyFirebaseToken(token);

    if (decoded.admin === true) {
      return decoded;
    }

    return null;
  } catch (e: any) {
    console.error('[admin-auth] verifyAdmin FAILED:', e?.message || e);
    return null;
  }
}
