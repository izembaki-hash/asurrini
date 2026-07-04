"use client";

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { UserCircle, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './language-switcher';

export function Navbar() {
  const t = useTranslations('nav');
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.HOME);
  };

  const getInitials = (name?: string) => {
    if (!name) return APP_NAME.substring(0,2).toUpperCase();
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={ROUTES.HOME} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="logo de assurance voyage" width={32} height={32} className="h-8 w-auto" priority />
          <h1 className="text-xl font-bold tracking-tight text-accent">{APP_NAME}</h1>
        </Link>
        <nav className="hidden md:flex items-center gap-x-6 lg:gap-x-8">
          <Link href={ROUTES.HOME} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
            {t('home')}
          </Link>
          <Link href={ROUTES.GET_QUOTE} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
            {t('getQuote')}
          </Link>
          {user && (
            <Link href={ROUTES.PROFILE} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
              {t('myProfile')}
            </Link>
          )}
          <Link href={ROUTES.MODIFY_CONTRACT} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
            {t('modifyContract')}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {isLoading ? (
            <div className="h-8 w-20 bg-muted rounded-md animate-pulse"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.fullName || user.email} />
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.fullName || t('user')}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.PROFILE}>
                    <UserCircle className="me-2 h-4 w-4" />
                    <span>{t('profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="me-2 h-4 w-4" />
                  <span>{t('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.LOGIN}>
                  <LogIn className="me-2 h-4 w-4" /> {t('login')}
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href={ROUTES.SIGNUP}>{t('signup')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
