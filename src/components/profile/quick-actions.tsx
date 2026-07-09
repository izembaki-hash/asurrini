'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus, Pencil } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export function QuickActions() {
  const t = useTranslations('profile');
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('quickActions')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button onClick={() => router.push(ROUTES.GET_QUOTE)}>
          <FilePlus className="h-4 w-4 mr-2" />
          {t('getQuote')}
        </Button>
        <Button variant="outline" onClick={() => router.push(ROUTES.MODIFY_CONTRACT)}>
          <Pencil className="h-4 w-4 mr-2" />
          {t('modifyContract')}
        </Button>
      </CardContent>
    </Card>
  );
}
