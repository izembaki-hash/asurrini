"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { TripDetailsForm } from "@/components/quote/trip-details-form";
import { PlanCard } from "@/components/quote/plan-card";
import { useTranslations } from "next-intl";
import type { SelectedPlanWithTripDetails } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QuotePage() {
  const t = useTranslations('quote');
  const e = useTranslations('errors');
  const c = useTranslations('common');
  const [recommendedPlanData, setRecommendedPlanData] = useState<SelectedPlanWithTripDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handlePlanRecommended = (data: SelectedPlanWithTripDetails) => {
    setRecommendedPlanData(data);
    setError(null);
    toast({
      title: t('recommendationReady'),
      description: t('recommendationReadyDesc'),
    });
  };

  const handleFormError = (errorMessage: string) => {
    setError(errorMessage);
    setRecommendedPlanData(null);
  };

  const handleSelectPlan = (selectedData: SelectedPlanWithTripDetails) => {
    try {
      localStorage.setItem('selectedInsurancePlan', JSON.stringify(selectedData));
      router.push(ROUTES.CHECKOUT);
    } catch (e) {
      console.error("Failed to save plan to localStorage", e);
      toast({
        title: c('error'),
        description: e('paymentError'),
        variant: "destructive",
      });
    }
  };

  const resetFormAndPlan = () => {
    setRecommendedPlanData(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            {recommendedPlanData ? t('recommendedTitle') : `${t('title')} ${APP_NAME}`}
          </CardTitle>
          <CardDescription>
            {recommendedPlanData
              ? t('recommendedDesc')
              : t('formDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('errorTitle')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!recommendedPlanData ? (
            <TripDetailsForm onPlanRecommended={handlePlanRecommended} onError={handleFormError} />
          ) : (
            <div className="space-y-6">
              <PlanCard
                plan={recommendedPlanData.plan}
                onSelectPlan={() => handleSelectPlan(recommendedPlanData)}
              />
              <Button variant="outline" onClick={resetFormAndPlan} className="w-full md:w-auto">
                <ArrowLeft className="me-2 h-4 w-4" />
                {t('modifyInfo')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
