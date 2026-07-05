'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { adminFetch } from '@/lib/admin-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';

const FIELDS = [
  { key: 'policyNumber', label: 'policyNumber' },
  { key: 'planName', label: 'planName' },
  { key: 'provider', label: 'provider' },
  { key: 'originalPrice', label: 'price' },
  { key: 'currency', label: 'currency' },
  { key: 'startDate', label: 'startDate' },
  { key: 'endDate', label: 'endDate' },
  { key: 'destination', label: 'destination' },
  { key: 'userEmail', label: 'userEmail' },
  { key: 'userFullName', label: 'userFullName' },
  { key: 'travelerCount', label: 'travelerCount' },
  { key: 'travelerAge', label: 'travelerAge' },
  { key: 'tripPurpose', label: 'tripPurpose' },
  { key: 'paymentStatus', label: 'paymentStatus' },
  { key: 'paidAt', label: 'paidAt' },
  { key: 'checkoutId', label: 'checkoutId' },
];

export default function AdminContractDetailPage() {
  const { policyNumber } = useParams<{ policyNumber: string }>();
  const t = useTranslations('admin');
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  useEffect(() => {
    adminFetch(`/api/admin/contracts/${policyNumber}`)
      .then((data) => {
        setContract(data);
        setNotes(data.notes || '');
        setPaymentStatus(data.paymentStatus || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [policyNumber]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch(`/api/admin/contracts/${policyNumber}`, {
        method: 'PUT',
        body: JSON.stringify({ notes, paymentStatus }),
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!contract) {
    return <p className="text-destructive text-center py-8">{t('notFound')}</p>;
  }

  const statusBadge = (s?: string) => {
    if (s === 'paid') return <Badge className="bg-green-100 text-green-800">{t('paid')}</Badge>;
    if (s === 'pending') return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t('pending')}</Badge>;
    return <Badge variant="outline">{s || '-'}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/contracts">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold font-mono text-sm">{policyNumber}</h1>
        <div className="ml-auto">{statusBadge(contract.paymentStatus)}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('contractDetails')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center py-1 border-b border-muted/30 last:border-0">
                <span className="text-sm text-muted-foreground">{t(label)}</span>
                <span className="text-sm font-medium">
                  {key === 'paymentStatus' ? statusBadge(contract[key]) : contract[key]?.toString() || '-'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t('adminNotes')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('paymentStatus')}</label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="paid">{t('paid')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('notes')}</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? t('saving') : t('saveChanges')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
