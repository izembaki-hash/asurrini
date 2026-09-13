import { NextResponse } from 'next/server';

// Public endpoint (no auth) exposing ONLY the site's public contact info
// for the footer. Reads the `contact` field of settings/insurance_config.
export const dynamic = 'force-dynamic';

export interface SiteContact {
  phone: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  twitter: string;
  whatsapp: string;
}

export const DEFAULT_CONTACT: SiteContact = {
  phone: '+213 (0)XX XX XX XX',
  email: 'support@assurini.dz',
  address: '',
  facebook: '',
  instagram: '',
  twitter: '',
  whatsapp: '',
};

export async function GET() {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    const snap = await adminDb.collection('settings').doc('insurance_config').get();
    const data = snap.exists ? (snap.data() as any) : {};
    const contact: SiteContact = { ...DEFAULT_CONTACT, ...(data?.contact || {}) };
    return NextResponse.json({ contact });
  } catch (e) {
    console.error('[site-settings] Firestore unavailable, returning defaults', e);
    return NextResponse.json({ contact: DEFAULT_CONTACT });
  }
}
