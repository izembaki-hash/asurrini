'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { adminFetch } from '@/lib/admin-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Save, Plus, Trash2, Play, CheckCircle, XCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { InsuranceProvider, InsuranceProduct } from '@/lib/types';

const EMPTY_PRODUCT: InsuranceProduct = {
  id: '',
  name: '',
  description: '',
  maxCoverage: 300000,
  destinationType: 'worldwide',
  pricePerDay: 100,
  coverageDetails: '',
  minAge: 1,
  maxAge: 70,
  maxDuration: 90,
};

export default function AdminProviderEditPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('admin');
  const router = useRouter();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency?: number; message?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const [form, setForm] = useState<InsuranceProvider>({
    name: '',
    logo: '',
    isActive: true,
    apiConfig: { baseUrl: '', authType: 'bearer', apiKey: '', timeout: 10000 },
    products: [],
  });

  useEffect(() => {
    if (isNew) return;
    adminFetch(`/api/admin/providers/${id}`)
      .then((data) => {
        setForm({
          name: data.name || '',
          logo: data.logo || '',
          isActive: data.isActive ?? true,
          apiConfig: data.apiConfig || { baseUrl: '', authType: 'bearer', apiKey: '', timeout: 10000 },
          products: data.products || [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = isNew ? '/api/admin/providers' : `/api/admin/providers/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      await adminFetch(url, { method, body: JSON.stringify(form) });
      router.push('/admin/providers');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await adminFetch(`/api/admin/providers/${id}/test`, { method: 'POST' });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const addProduct = () => {
    const product = { ...EMPTY_PRODUCT, id: `prod-${Date.now()}` };
    setForm((f) => ({ ...f, products: [...f.products, product] }));
  };

  const updateProduct = (idx: number, field: keyof InsuranceProduct, value: any) => {
    setForm((f) => {
      const products = [...f.products];
      products[idx] = { ...products[idx], [field]: value };
      return { ...f, products };
    });
  };

  const removeProduct = (idx: number) => {
    setForm((f) => ({ ...f, products: f.products.filter((_, i) => i !== idx) }));
  };

  const updateApiConfig = (field: string, value: any) => {
    setForm((f) => ({ ...f, apiConfig: { ...f.apiConfig, [field]: value } }));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/providers">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">{isNew ? t('addProvider') : t('editProvider')}</h1>
        <div className="ml-auto flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-2">
              <Play className="h-4 w-4" /> {testing ? t('testing') : t('testConnection')}
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      </div>

      {testResult && (
        <div className={`p-4 rounded-md border mb-6 flex items-center gap-3 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {testResult.success ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
          <div>
            <p className="text-sm font-medium">{testResult.success ? t('testSuccess') : t('testFailed')}</p>
            <p className="text-xs text-muted-foreground">
              {testResult.message}
              {testResult.latency != null && ` (${testResult.latency}ms)`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('providerInfo')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('providerName')} *</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('logoUrl')}</label>
              <Input value={form.logo} onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">{t('active')}</label>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t('apiConfig')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('baseUrl')}</label>
              <Input value={form.apiConfig.baseUrl} onChange={(e) => updateApiConfig('baseUrl', e.target.value)} placeholder="https://api.example.com/v1" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('authType')}</label>
              <select
                value={form.apiConfig.authType}
                onChange={(e) => updateApiConfig('authType', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="bearer">Bearer Token</option>
                <option value="api_key">API Key</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('apiKey')}</label>
              <Input value={form.apiConfig.apiKey} onChange={(e) => updateApiConfig('apiKey', e.target.value)} type="password" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('timeout')} (ms)</label>
              <Input type="number" value={form.apiConfig.timeout} onChange={(e) => updateApiConfig('timeout', parseInt(e.target.value) || 10000)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('products')} ({form.products.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={addProduct} className="gap-2">
            <Plus className="h-4 w-4" /> {t('addProduct')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.products.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('noProducts')}</p>
          ) : (
            form.products.map((product, idx) => (
              <div key={product.id || idx} className="p-4 rounded-md border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{product.name || t('product') + ' ' + (idx + 1)}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeProduct(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('productName')}</label>
                    <Input value={product.name} onChange={(e) => updateProduct(idx, 'name', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('destType')}</label>
                    <select
                      value={product.destinationType}
                      onChange={(e) => updateProduct(idx, 'destinationType', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="worldwide">Worldwide</option>
                      <option value="schengen">Schengen</option>
                      <option value="europe">Europe</option>
                      <option value="africa">Africa</option>
                      <option value="asia">Asia</option>
                      <option value="america">America</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('pricePerDay')} (DZD)</label>
                    <Input type="number" value={product.pricePerDay} onChange={(e) => updateProduct(idx, 'pricePerDay', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('maxCoverage')} (DZD)</label>
                    <Input type="number" value={product.maxCoverage} onChange={(e) => updateProduct(idx, 'maxCoverage', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('minAge')}</label>
                    <Input type="number" value={product.minAge} onChange={(e) => updateProduct(idx, 'minAge', parseInt(e.target.value) || 1)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('maxAge')}</label>
                    <Input type="number" value={product.maxAge} onChange={(e) => updateProduct(idx, 'maxAge', parseInt(e.target.value) || 70)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('maxDuration')} ({t('days')})</label>
                    <Input type="number" value={product.maxDuration} onChange={(e) => updateProduct(idx, 'maxDuration', parseInt(e.target.value) || 90)} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-xs text-muted-foreground mb-1 block">{t('description')}</label>
                    <Input value={product.description} onChange={(e) => updateProduct(idx, 'description', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('coverageDetails')}</label>
                  <Textarea value={product.coverageDetails} onChange={(e) => updateProduct(idx, 'coverageDetails', e.target.value)} rows={3} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
