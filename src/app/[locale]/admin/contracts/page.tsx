'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { adminFetch } from '@/lib/admin-client';
import { Loader2, Search, ChevronLeft, ChevronRight, ExternalLink, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Contract {
  id: string;
  policyNumber: string;
  userEmail: string;
  userFullName: string;
  planName: string;
  originalPrice: string;
  paymentStatus?: string;
  createdAt?: string;
  destination: string;
}

export default function AdminContractsPage() {
  const t = useTranslations('admin');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const data = await adminFetch(`/api/admin/contracts?${params}`);
      setContracts(data.contracts);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const totalPages = Math.ceil(total / limit);

  const exportCsv = () => {
    const headers = ['Policy Number', 'User', 'Email', 'Plan', 'Price', 'Status', 'Destination', 'Date'];
    const rows = contracts.map((c) => [
      c.policyNumber, c.userFullName, c.userEmail, c.planName,
      c.originalPrice, c.paymentStatus || '-', c.destination,
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (s?: string) => {
    if (!s || s === 'unknown') return <Badge variant="secondary">-</Badge>;
    if (s === 'paid') return <Badge className="bg-green-100 text-green-800 border-green-300">{t('paid')}</Badge>;
    if (s === 'pending') return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">{t('pending')}</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('contracts')}</h1>
        <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
          <Download className="h-4 w-4" /> CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchContracts')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
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

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : contracts.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">{t('noContracts')}</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left p-3 font-medium">{t('policyNumber')}</th>
                <th className="text-left p-3 font-medium">{t('user')}</th>
                <th className="text-left p-3 font-medium">{t('plan')}</th>
                <th className="text-right p-3 font-medium">{t('price')}</th>
                <th className="text-center p-3 font-medium">{t('status')}</th>
                <th className="text-left p-3 font-medium">{t('destination')}</th>
                <th className="text-center p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{c.policyNumber}</td>
                  <td className="p-3">
                    <div className="font-medium">{c.userFullName}</div>
                    <div className="text-xs text-muted-foreground">{c.userEmail}</div>
                  </td>
                  <td className="p-3">{c.planName}</td>
                  <td className="p-3 text-right">{parseFloat(c.originalPrice).toLocaleString()} DZD</td>
                  <td className="p-3 text-center">{statusBadge(c.paymentStatus)}</td>
                  <td className="p-3">{c.destination}</td>
                  <td className="p-3 text-center">
                    <Link href={`/admin/contracts/${c.policyNumber}`}>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">{total} {t('total')}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
