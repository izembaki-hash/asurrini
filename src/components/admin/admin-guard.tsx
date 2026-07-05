'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/hooks/use-admin';

export function useAdminGuard() {
  const { user, isLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || isAdmin === null) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (!isAdmin) {
      router.replace('/admin/unauthorized');
    }
  }, [user, isLoading, isAdmin, router]);

  return isAdmin;
}
