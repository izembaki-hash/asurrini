import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const decoded = await verifyAdmin(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const usersSnap = await adminDb.collection('users').get();
    const users = usersSnap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));

    const contractsSnap = await adminDb.collection('contracts').get();
    const contractCountByEmail: Record<string, number> = {};
    contractsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.userEmail) {
        contractCountByEmail[data.userEmail] = (contractCountByEmail[data.userEmail] || 0) + 1;
      }
    });

    const enriched = users.map((user: any) => ({
      ...user,
      createdAt: user.createdAt instanceof Timestamp ? user.createdAt.toDate().toISOString() : user.createdAt,
      contractCount: contractCountByEmail[user.email] || 0,
    }));

    return NextResponse.json({ users: enriched });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
