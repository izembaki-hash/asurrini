'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { adminFetch } from '@/lib/admin-client';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface User {
  uid: string;
  email: string;
  fullName?: string;
  createdAt?: string;
  contractCount?: number;
}

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/admin/users')
      .then((data) => setUsers(data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('users')}</h1>

      {users.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">{t('noUsers')}</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left p-3 font-medium">{t('email')}</th>
                <th className="text-left p-3 font-medium">{t('name')}</th>
                <th className="text-left p-3 font-medium">{t('registeredAt')}</th>
                <th className="text-center p-3 font-medium">{t('contracts')}</th>
                <th className="text-center p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className="border-b hover:bg-muted/30">
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.fullName || '-'}</td>
                  <td className="p-3 text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-3 text-center">{user.contractCount}</td>
                  <td className="p-3 text-center">
                    <Link href={`/admin/users/${user.uid}`}>
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
    </div>
  );
}
