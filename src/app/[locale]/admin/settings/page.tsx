'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminFetch } from '@/lib/admin-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';

interface SiteContact {
  phone: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  twitter: string;
  whatsapp: string;
}

interface Settings {
  baseRate: number;
  modificationFee: number;
  destinationCoefficients: Record<string, number>;
  ageCoefficients: Record<string, number>;
  budgetOptions: number[];
  contact?: SiteContact;
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

const DEFAULT_SETTINGS: Settings = {
  baseRate: 80,
  modificationFee: 290,
  destinationCoefficients: { schengen: 1.5, maghreb: 1.1, usa: 1.7, africa: 1.3, other: 1.0 },
  ageCoefficients: { '60+': 1.5, '40-59': 1.2, '19-39': 1.0, '0-18': 0.9 },
  budgetOptions: [150000, 300000, 600000],
  contact: DEFAULT_CONTACT,
};

export default function AdminSettingsPage() {
  const t = useTranslations('admin');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch('/api/admin/settings')
      .then((data) => {
        if (data.settings) {
          setSettings((s) => ({
            ...s,
            ...data.settings,
            contact: { ...DEFAULT_CONTACT, ...(data.settings.contact || {}) },
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateContact = (key: keyof SiteContact, value: string) => {
    setSettings((s) => ({ ...s, contact: { ...(s.contact || DEFAULT_CONTACT), [key]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updateDestCoeff = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setSettings((s) => ({ ...s, destinationCoefficients: { ...s.destinationCoefficients, [key]: num } }));
    }
  };

  const updateAgeCoeff = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setSettings((s) => ({ ...s, ageCoefficients: { ...s.ageCoefficients, [key]: num } }));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('settings')}</h1>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('pricingSettings')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('baseRate')} (DZD/day)</label>
              <Input type="number" value={settings.baseRate} onChange={(e) => setSettings((s) => ({ ...s, baseRate: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('modificationFee')} (DZD)</label>
              <Input type="number" value={settings.modificationFee} onChange={(e) => setSettings((s) => ({ ...s, modificationFee: parseInt(e.target.value) || 0 }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t('destinationCoefficients')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(settings.destinationCoefficients).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm w-24 capitalize">{key}</span>
                <Input type="number" step="0.1" value={val} onChange={(e) => updateDestCoeff(key, e.target.value)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t('ageCoefficients')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(settings.ageCoefficients).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm w-24">{key}</span>
                <Input type="number" step="0.1" value={val} onChange={(e) => updateAgeCoeff(key, e.target.value)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t('contactSettings')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('contactSettingsDesc')}</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('phone')}</label>
              <Input value={settings.contact?.phone || ''} onChange={(e) => updateContact('phone', e.target.value)} placeholder="+213 ..." />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('email')}</label>
              <Input type="email" value={settings.contact?.email || ''} onChange={(e) => updateContact('email', e.target.value)} placeholder="support@..." />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground mb-1 block">{t('address')}</label>
              <Input value={settings.contact?.address || ''} onChange={(e) => updateContact('address', e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('facebookUrl')}</label>
              <Input value={settings.contact?.facebook || ''} onChange={(e) => updateContact('facebook', e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('instagramUrl')}</label>
              <Input value={settings.contact?.instagram || ''} onChange={(e) => updateContact('instagram', e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('twitterUrl')}</label>
              <Input value={settings.contact?.twitter || ''} onChange={(e) => updateContact('twitter', e.target.value)} placeholder="https://x.com/..." />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('whatsappNumber')}</label>
              <Input value={settings.contact?.whatsapp || ''} onChange={(e) => updateContact('whatsapp', e.target.value)} placeholder="+213 ..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t('budgetOptions')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {settings.budgetOptions.map((val, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm w-24">Option {i + 1}</span>
                <Input type="number" value={val} onChange={(e) => {
                  const newOpts = [...settings.budgetOptions];
                  newOpts[i] = parseInt(e.target.value) || 0;
                  setSettings((s) => ({ ...s, budgetOptions: newOpts }));
                }} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
