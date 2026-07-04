"use client";

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { PaymentForm } from '@/components/checkout/payment-form';
import { useLocale, useTranslations } from 'next-intl';
import type { SelectedPlanWithTripDetails } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ShieldCheck, Users, CalendarDays, Tag, AlertTriangle, Loader2, MapPin, Building } from 'lucide-react';
import { ROUTES, DEFAULT_CURRENCY } from '@/lib/constants';
import { Link } from '@/i18n/routing';
import { format } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale';
import type { Locale } from 'date-fns';

const dateLocaleMap: Record<string, Locale> = {
  fr,
  en: enUS,
  ar,
};

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const e = useTranslations('errors');
  const locale = useLocale();
  const dateLocale = dateLocaleMap[locale] || fr;
  const [selectedPlanData, setSelectedPlanData] = useState<SelectedPlanWithTripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedPlan = localStorage.getItem('selectedInsurancePlan');
      if (storedPlan) {
        const parsedPlan: SelectedPlanWithTripDetails = JSON.parse(storedPlan);
        setSelectedPlanData(parsedPlan);
      } else {
        router.replace(ROUTES.GET_QUOTE);
      }
    } catch (error) {
        console.error("Failed to parse plan from localStorage", error);
        router.replace(ROUTES.GET_QUOTE);
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (!selectedPlanData) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">{t('noPlanSelected')}</h2>
        <p className="text-muted-foreground mb-6">{t('noPlanSelectedDesc')}</p>
        <Button asChild>
          <Link href={ROUTES.GET_QUOTE}>{t('backToRecommendations')}</Link>
        </Button>
      </div>
    );
  }

  const { plan, userInput } = selectedPlanData;

  const formattedStartDate = userInput.startDate ? format(new Date(userInput.startDate), "dd MMMM yyyy", { locale: dateLocale }) : "N/A";
  const formattedEndDate = userInput.endDate ? format(new Date(userInput.endDate), "dd MMMM yyyy", { locale: dateLocale }) : "N/A";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Button variant="outline" onClick={() => router.push(ROUTES.GET_QUOTE)} className="mb-4">
        <ArrowLeft className="me-2 h-4 w-4" /> {t('backToRecommendations')}
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="text-2xl flex items-center">
              <ShieldCheck className="me-3 h-7 w-7" /> {t('planSummary')}
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">{t('planSummaryDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-primary">{plan.planName}</h3>
              <p className="text-sm text-muted-foreground flex items-center"><Building className="h-4 w-4 me-2"/>{t('provider')}: {plan.provider}</p>
            </div>

            {userInput.destination && (
              <p className="text-sm text-muted-foreground flex items-center"><MapPin className="h-4 w-4 me-2"/>{t('destination')}: {userInput.destination}</p>
            )}
            {(userInput.startDate || userInput.endDate) && (
              <p className="text-sm text-muted-foreground flex items-center">
                <CalendarDays className="h-4 w-4 me-2"/>
                {t('period')}: {formattedStartDate} - {formattedEndDate}
              </p>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium mb-1">{t('coverageTitle')}</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {plan.coverageDetails.split('\n').slice(0, 4).map((detail, index) => detail.trim() && <li key={index}>{detail.trim().replace(/^- /, '')}</li>)}
                {plan.coverageDetails.split('\n').length > 4 && <li>{t('andMore')}</li>}
              </ul>
            </div>
            <div className="border-t pt-4">
              <a
                href={plan.policyDocumentLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                <FileText className="me-2 h-4 w-4" /> {t('viewPolicy')}
              </a>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 p-6">
            <div className="w-full flex justify-between items-center">
              <p className="text-lg font-semibold">{t('totalToPay')}</p>
              <p className="text-2xl font-bold text-accent">
                {plan.price} {DEFAULT_CURRENCY}
              </p>
            </div>
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">{t('paymentInfo')}</CardTitle>
            <CardDescription>{t('paymentInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm
              planName={plan.planName}
              price={plan.price}
              currency={DEFAULT_CURRENCY}
              provider={plan.provider}
              selectedPlanData={selectedPlanData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
