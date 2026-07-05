'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { adminFetch } from '@/lib/admin-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Ban, CheckCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function AdminUserDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const t = useTranslations('admin');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch(`/api/admin/users/${uid}`)
      .then((res) => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [uid]);

  const handleToggleDisable = async () => {
    try {
      await adminFetch(`/api/admin/users/${uid}`, {
        method: 'PUT',
        body: JSON.stringify({ disabled: true }),
      });
      alert(t('userDisabled'));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!data) {
    return <p className="text-destructive text-center py-8">{t('notFound')}</p>;
  }

  const { user, contracts } = data;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">{user.fullName || user.email}</h1>
        <div className="ml-auto">
          <Button variant="destructive" size="sm" onClick={handleToggleDisable} className="gap-2">
            <Ban className="h-4 w-4" /> {t('disableUser')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-lg">{t('userDetails')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><span className="text-sm text-muted-foreground">{t('email')}:</span> <span className="text-sm font-medium">{user.email}</span></div>
            <div><span className="text-sm text-muted-foreground">{t('name')}:</span> <span className="text-sm font-medium">{user.fullName || '-'}</span></div>
            <div><span className="text-sm text-muted-foreground">{t('passport')}:</span> <span className="text-sm font-medium">{user.passportNumber || '-'}</span></div>
            <div><span className="text-sm text-muted-foreground">{t('phone')}:</span> <span className="text-sm font-medium">{user.phoneNumber || '-'}</span></div>
            <div><span className="text-sm text-muted-foreground">{t('address')}:</span> <span className="text-sm font-medium">{user.address || '-'}</span></div>
            <div><span className="text-sm text-muted-foreground">{t('registeredAt')}:</span> <span className="text-sm font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span></div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">{t('userContracts')} ({contracts.length})</CardTitle></CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('noContracts')}</p>
            ) : (
              <div className="space-y-2">
                {contracts.map((c: any) => (
                  <Link key={c.id} href={`/admin/contracts/${c.policyNumber}`}>
                    <div className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/30 cursor-pointer">
                      <div>
                        <div className="font-mono text-xs font-medium">{c.policyNumber}</div>
                        <div className="text-sm">{c.planName} - {c.destination}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{parseFloat(c.originalPrice).toLocaleString()} DZD</span>
                        <Badge variant={c.paymentStatus === 'paid' ? 'default' : 'secondary'} className={c.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : ''}>
                          {c.paymentStatus || '-'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
