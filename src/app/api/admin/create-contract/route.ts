import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  const decoded = await verifyAdmin(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { policyNumber, userEmail, userFullName, planName, originalPrice, startDate, endDate, destination, coverageDetails, travelerCount, travelerAge, preExistingConditions, tripPurpose, originalBudget } = body;

    if (!policyNumber || !userEmail || !userFullName || !planName || !originalPrice || !startDate || !endDate || !destination) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const contract = {
      policyNumber,
      userEmail,
      userFullName,
      planName,
      originalPrice: String(originalPrice),
      currency: 'DZD',
      startDate,
      endDate,
      destination,
      coverageDetails: coverageDetails || '',
      travelerCount: travelerCount || 1,
      travelerAge: travelerAge || 30,
      preExistingConditions: preExistingConditions || '',
      tripPurpose: tripPurpose || '',
      originalBudget: originalBudget || 0,
      issueDate: new Date().toISOString().split('T')[0],
      lastModifiedDate: new Date().toISOString(),
      paymentStatus: 'paid',
      paidAt: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection('contracts').doc(policyNumber).set(contract);

    await adminDb.collection('audit_logs').add({
      action: 'create_contract_manual',
      performedBy: decoded.uid,
      targetType: 'contract',
      targetId: policyNumber,
      changes: contract,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, policyNumber });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
