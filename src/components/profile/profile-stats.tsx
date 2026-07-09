'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Loader2 } from 'lucide-react';
import { getContractsByEmail } from '@/lib/firestore-service';

export function ProfileStats() {
  const t = useTranslations('profile');
  const { user } = useAuth();
  const [total, setTotal] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    getContractsByEmail(user.email).then((contracts) => {
      setTotal(contracts.length);
      setActive(contracts.filter((c) => c.status === 'active' || c.status === 'confirmed').length);
    });
  }, [user?.email]);

  if (total === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('statsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('statsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-sm text-muted-foreground">{t('totalContracts')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{active}</p>
              <p className="text-sm text-muted-foreground">{t('activeContracts')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
