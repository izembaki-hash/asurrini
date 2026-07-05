import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { uid, secretCode } = await req.json();

    if (secretCode !== process.env.ADMIN_SECRET_CODE) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!uid) {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 });
    }

    await adminAuth.setCustomUserClaims(uid, { admin: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting admin claims:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
