import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/verify-firebase-token';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;
    if (!token) {
      return NextResponse.json({ error: 'no token provided' }, { status: 400 });
    }

    try {
      const decoded = await verifyFirebaseToken(token);
      return NextResponse.json({
        success: true,
        uid: decoded.uid,
        email: decoded.email || null,
        hasAdminClaim: decoded.admin === true,
        allClaims: Object.keys(decoded).filter(k => !k.startsWith('firebase')),
      });
    } catch (verifyErr: any) {
      return NextResponse.json({
        success: false,
        verifyError: String(verifyErr?.message || verifyErr).slice(0, 500),
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: 'route-crashed', message: String(e?.message || e).slice(0, 500) }, { status: 500 });
  }
}
