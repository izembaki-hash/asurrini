"use client";

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Edit, MessageCircle, MapPin, Phone, Mail } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { useTranslations } from 'next-intl';

interface SiteContact {
  phone: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  twitter: string;
  whatsapp: string;
}

const DEFAULT_CONTACT: SiteContact = {
  phone: '+213 (0)XX XX XX XX',
  email: 'support@assurini.dz',
  address: '',
  facebook: '',
  instagram: '',
  twitter: '',
  whatsapp: '',
};

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();
  const [contact, setContact] = useState<SiteContact>(DEFAULT_CONTACT);

  useEffect(() => {
    fetch('/api/public/site-settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.contact) setContact({ ...DEFAULT_CONTACT, ...data.contact });
      })
      .catch(() => {});
  }, []);

  const waLink = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`
    : null;

  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href={ROUTES.HOME} prefetch={false} className="flex items-center gap-2 mb-2">
              <Image src="/logo.png" alt="logo de assurance voyage" width={28} height={28} className="h-7 w-auto" />
              <h2 className="text-lg font-semibold">{APP_NAME}</h2>
            </Link>
            <p className="text-sm">
              {t('description')}
            </p>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3">{t('quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={ROUTES.HOME} prefetch={false} className="hover:text-primary transition-colors">{t('home')}</Link></li>
              <li><Link href={ROUTES.GET_QUOTE} prefetch={false} className="hover:text-primary transition-colors">{t('getQuote')}</Link></li>
              <li><Link href={ROUTES.MODIFY_CONTRACT} prefetch={false} className="hover:text-primary transition-colors flex items-center"><Edit size={16} className="me-1.5"/> {t('modifyContract')}</Link></li>
              <li><Link href="#" prefetch={false} className="hover:text-primary transition-colors">{t('terms')}</Link></li>
              <li><Link href="#" prefetch={false} className="hover:text-primary transition-colors">{t('privacy')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3">{t('followUs')}</h3>
            <div className="flex space-x-4">
              <Link href={contact.facebook || '#'} prefetch={false} aria-label="Facebook" className="hover:text-primary transition-colors"><Facebook size={20} /></Link>
              <Link href={contact.twitter || '#'} prefetch={false} aria-label="Twitter" className="hover:text-primary transition-colors"><Twitter size={20} /></Link>
              <Link href={contact.instagram || '#'} prefetch={false} aria-label="Instagram" className="hover:text-primary transition-colors"><Instagram size={20} /></Link>
              {waLink && (
                <Link href={waLink} prefetch={false} aria-label="WhatsApp" className="hover:text-primary transition-colors"><MessageCircle size={20} /></Link>
              )}
            </div>
            <h3 className="text-md font-semibold mt-6 mb-3">{t('contactUs')}</h3>
            <p className="text-sm flex items-center gap-1.5"><Mail size={14} className="shrink-0" /> {contact.email}</p>
            <p className="text-sm flex items-center gap-1.5 mt-1"><Phone size={14} className="shrink-0" /> {contact.phone}</p>
            {contact.address && (
              <p className="text-sm flex items-center gap-1.5 mt-1"><MapPin size={14} className="shrink-0" /> {contact.address}</p>
            )}
          </div>
        </div>
        <div className="border-t border-border/50 pt-6 text-center text-sm">
          <p>&copy; {currentYear} {APP_NAME}. {t('allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}
