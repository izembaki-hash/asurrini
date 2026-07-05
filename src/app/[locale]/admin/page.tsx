'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { adminFetch } from '@/lib/admin-client';
import { Loader2, FileText, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminChart = lazy(() => import('./admin-chart').then(m => ({ default: m.AdminChart })));

interface Stats {
  totalContracts: number;
  totalUsers: number;
  totalRevenue: number;
  paidContracts: number;
  successRate: number;
  recentDailyContracts: { date: string; count: number }[];
}

export default function AdminDashboardPage() {
  const t = useTranslations('admin');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch('/api/admin/stats')
      .then((data) => setStats(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive text-center py-8">{error}</div>;
  }

  if (!stats) return null;

  const cards = [
    { label: t('totalContracts'), value: stats.totalContracts, icon: FileText, color: 'text-blue-600' },
    { label: t('totalUsers'), value: stats.totalUsers, icon: Users, color: 'text-green-600' },
    { label: t('totalRevenue'), value: `${stats.totalRevenue.toLocaleString()} DZD`, icon: DollarSign, color: 'text-yellow-600' },
    { label: t('successRate'), value: `${stats.successRate}%`, icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('dashboard')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('contractsLast30Days')}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentDailyContracts.length > 0 ? (
            <Suspense fallback={<div className="h-72 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
              <AdminChart data={stats.recentDailyContracts} />
            </Suspense>
          ) : (
            <p className="text-muted-foreground text-center py-8">{t('noData')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
