'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ShieldX, Home } from 'lucide-react';

export default function AdminUnauthorizedPage() {
  const t = useTranslations('admin');

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <ShieldX className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">{t('unauthorized')}</h1>
        <p className="text-muted-foreground max-w-md">
          {t('unauthorizedDesc')}
        </p>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" /> {t('backToHome')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
