'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { adminFetch } from '@/lib/admin-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, ExternalLink, Trash2 } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  isActive: boolean;
  products?: any[];
  createdAt?: string;
}

export default function AdminProvidersPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = () => {
    setLoading(true);
    adminFetch('/api/admin/providers')
      .then((data) => setProviders(data.providers))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('deleteConfirm', { name }))) return;
    try {
      await adminFetch(`/api/admin/providers/${id}`, { method: 'DELETE' });
      fetchProviders();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('providers')}</h1>
        <Link href="/admin/providers/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> {t('addProvider')}
          </Button>
        </Link>
      </div>

      {providers.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">{t('noProviders')}</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left p-3 font-medium">{t('providerName')}</th>
                <th className="text-center p-3 font-medium">{t('active')}</th>
                <th className="text-center p-3 font-medium">{t('products')}</th>
                <th className="text-center p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-center">
                    <Badge variant={p.isActive ? 'default' : 'secondary'} className={p.isActive ? 'bg-green-100 text-green-800' : ''}>
                      {p.isActive ? t('yes') : t('no')}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">{(p.products || []).length}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/admin/providers/${p.id}`}>
                        <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id, p.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
