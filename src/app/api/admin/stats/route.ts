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
    const contractsSnap = await adminDb.collection('contracts').get();
    const usersSnap = await adminDb.collection('users').get();

    const totalContracts = contractsSnap.size;
    const totalUsers = usersSnap.size;

    let totalRevenue = 0;
    let paidContracts = 0;
    const dailyCounts: Record<string, number> = {};

    contractsSnap.forEach((doc) => {
      const data = doc.data();
      const price = parseFloat(data.originalPrice || '0');

      if (data.paymentStatus === 'paid') {
        paidContracts++;
        totalRevenue += price;
      }

      const created = data.createdAt;
      if (created && typeof created.toDate === 'function') {
        const dateKey = created.toDate().toISOString().split('T')[0];
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
      }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysKey = thirtyDaysAgo.toISOString().split('T')[0];

    const recentDailyContracts = Object.entries(dailyCounts)
      .filter(([date]) => date >= thirtyDaysKey)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const successRate = totalContracts > 0 ? Math.round((paidContracts / totalContracts) * 100) : 0;

    return NextResponse.json({
      totalContracts,
      totalUsers,
      totalRevenue,
      paidContracts,
      successRate,
      recentDailyContracts,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
