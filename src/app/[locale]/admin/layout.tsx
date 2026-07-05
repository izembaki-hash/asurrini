'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useAdminGuard } from '@/components/admin/admin-guard';
import { ROUTES } from '@/lib/constants';
import { LayoutDashboard, FileText, Users, CreditCard, Settings, History, Building2, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const NAV_ITEMS = [
  { href: '/admin', label: 'admin.dashboard', icon: LayoutDashboard },
  { href: '/admin/contracts', label: 'admin.contracts', icon: FileText },
  { href: '/admin/users', label: 'admin.users', icon: Users },
  { href: '/admin/payments', label: 'admin.payments', icon: CreditCard },
  { href: '/admin/providers', label: 'admin.providers', icon: Building2 },
  { href: '/admin/settings', label: 'admin.settings', icon: Settings },
  { href: '/admin/audit', label: 'admin.audit', icon: History },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const isAdmin = useAdminGuard();

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = ROUTES.HOME;
  };

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-[60vh]">
      <div className="flex flex-wrap items-center gap-1 mb-8 pb-4 border-b">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <Button variant={isActive ? 'default' : 'ghost'} size="sm" className="gap-2">
                <Icon className="h-4 w-4" />
                {t(item.label)}
              </Button>
            </Link>
          );
        })}
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-destructive">
            <LogOut className="h-4 w-4" />
            {t('nav.logout')}
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
