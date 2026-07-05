'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminFetch } from '@/lib/admin-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download } from 'lucide-react';

interface Payment {
  policyNumber: string;
  userEmail: string;
  userFullName: string;
  originalPrice: string;
  currency: string;
  paymentStatus: string;
  paidAt: string | null;
  checkoutId: string | null;
  createdAt: string | null;
}

export default function AdminPaymentsPage() {
  const t = useTranslations('admin');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    adminFetch(`/api/admin/payments?${params}`)
      .then((data) => setPayments(data.payments))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  const exportCsv = () => {
    const headers = ['Policy Number', 'User', 'Email', 'Amount', 'Status', 'Paid At', 'Checkout ID'];
    const rows = payments.map((p) => [
      p.policyNumber, p.userFullName, p.userEmail,
      `${p.originalPrice} ${p.currency}`, p.paymentStatus,
      p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '-', p.checkoutId || '-',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (s: string) => {
    if (s === 'paid') return <Badge className="bg-green-100 text-green-800 border-green-300">{t('paid')}</Badge>;
    if (s === 'pending') return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t('pending')}</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('payments')}</h1>
        <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
          <Download className="h-4 w-4" /> CSV
        </Button>
      </div>

      <div className="mb-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="paid">{t('paid')}</SelectItem>
            <SelectItem value="pending">{t('pending')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {payments.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">{t('noPayments')}</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left p-3 font-medium">{t('policyNumber')}</th>
                <th className="text-left p-3 font-medium">{t('user')}</th>
                <th className="text-right p-3 font-medium">{t('amount')}</th>
                <th className="text-center p-3 font-medium">{t('status')}</th>
                <th className="text-left p-3 font-medium">{t('date')}</th>
                <th className="text-left p-3 font-medium">Checkout ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.policyNumber} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{p.policyNumber}</td>
                  <td className="p-3">
                    <div className="font-medium">{p.userFullName}</div>
                    <div className="text-xs text-muted-foreground">{p.userEmail}</div>
                  </td>
                  <td className="p-3 text-right font-medium">{parseFloat(p.originalPrice).toLocaleString()} {p.currency}</td>
                  <td className="p-3 text-center">{statusBadge(p.paymentStatus)}</td>
                  <td className="p-3 text-muted-foreground">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-')}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{p.checkoutId || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
