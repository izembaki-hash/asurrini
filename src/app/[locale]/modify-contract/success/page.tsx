"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, ROUTES, DEFAULT_CURRENCY } from "@/lib/constants";
import { getContractByPolicyNumber } from "@/lib/firestore-service";
import { CheckCircle, FileText, Home, AlertTriangle, Edit, Mail } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import type { ContractPlanDetails } from "@/lib/types";
import { DownloadContractButton } from "@/components/checkout/insurance-contract";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr, enUS, ar } from "date-fns/locale";
import type { Locale } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const dateLocaleMap: Record<string, Locale> = {
  fr,
  en: enUS,
  ar,
};

function ModifySuccessContent() {
  const t = useTranslations('modify');
  const c = useTranslations('common');
  const locale = useLocale();
  const dateLocale = dateLocaleMap[locale] || fr;
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [contractDisplayDetails, setContractDisplayDetails] = useState<ContractPlanDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [actualCostPaid, setActualCostPaid] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const policyNumber = searchParams.get("policyNumber");
    const costPaidParam = searchParams.get("actualModificationCostPaid");
    if(costPaidParam) setActualCostPaid(costPaidParam);

    if (policyNumber) {
      getContractByPolicyNumber(policyNumber)
        .then((foundContract) => {
          if (foundContract && (!user || foundContract.userEmail === user.email)) {
            setContractDisplayDetails({
              policyNumber: foundContract.policyNumber,
              planName: foundContract.planName,
              price: foundContract.originalPrice,
              currency: foundContract.currency,
              provider: foundContract.provider,
              startDate: foundContract.startDate,
              endDate: foundContract.endDate,
              destination: foundContract.destination,
              policyDocumentLink: foundContract.policyDocumentLink,
              userFullName: foundContract.userFullName,
              userEmail: foundContract.userEmail,
              userPassportNumber: foundContract.userPassportNumber,
              issueDate: foundContract.issueDate,
              lastModifiedDate: foundContract.lastModifiedDate,
              coverageDetails: foundContract.coverageDetails,
              actualModificationCostPaid: costPaidParam || undefined,
            });
          }
        })
        .catch((error) => {
          console.error("Failed to load modified contract from Firestore", error);
        })
        .finally(() => {
          setDetailsLoading(false);
        });
    } else {
      setDetailsLoading(false);
    }
  }, [searchParams, user]);

  const handleSendEmail = () => {
    if (!contractDisplayDetails || !user) return;
    console.log("Simulating sending modified contract by email:", {
      to: user.email,
      policyNumber: contractDisplayDetails.policyNumber,
      planName: contractDisplayDetails.planName,
    });
    toast({
      title: t('emailSentTitle'),
      description: t('emailSentDesc', { policyNumber: contractDisplayDetails.policyNumber, email: user.email }),
    });
  };

  if (authLoading || detailsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t('searching')}</p>
      </div>
    );
  }

  if (!contractDisplayDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <CardTitle className="text-2xl font-semibold mb-2">{t('dateError')}</CardTitle>
        <CardDescription className="text-muted-foreground mb-6">{t('dateErrorDesc')}</CardDescription>
        <Button asChild>
          <Link href={ROUTES.HOME}>
            <Home className="me-2 h-4 w-4" />
            {t('searching')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
      <Card className="w-full max-w-lg shadow-xl p-4 md:p-8">
        <CardHeader className="items-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">{t('successTitle')}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2"
            dangerouslySetInnerHTML={{
              __html: t('successDesc', {
                policyNumber: contractDisplayDetails.policyNumber,
                planName: contractDisplayDetails.planName,
              }),
            }}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {actualCostPaid && (
            <p className="text-md"
              dangerouslySetInnerHTML={{
                __html: t('successAmountPaid', { amount: actualCostPaid, currency: DEFAULT_CURRENCY }),
              }}
            />
          )}
          <div className="text-start bg-muted/50 p-4 rounded-md text-sm">
            <p className="font-semibold mb-2">{t('newTripDetails')}</p>
            <p><strong>{t('plan')}:</strong> {contractDisplayDetails.planName} ({contractDisplayDetails.provider})</p>
            <p><strong>{t('newTotalPlanPrice')}:</strong> {contractDisplayDetails.price} {DEFAULT_CURRENCY}</p>
            <p><strong>{t('destination')}:</strong> {contractDisplayDetails.destination}</p>
            <p><strong>{t('period')}:</strong> {contractDisplayDetails.startDate ? format(parseISO(contractDisplayDetails.startDate), "dd MMMM yyyy", { locale: dateLocale }) : 'N/A'} - {contractDisplayDetails.endDate ? format(parseISO(contractDisplayDetails.endDate), "dd MMMM yyyy", { locale: dateLocale }) : 'N/A'}</p>
            {contractDisplayDetails.lastModifiedDate && (
              <p><strong>{t('modificationDate')}:</strong> {format(parseISO(contractDisplayDetails.lastModifiedDate), "dd MMMM yyyy HH:mm", { locale: dateLocale })}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {user && contractDisplayDetails && (
              <DownloadContractButton
                user={{
                  email: contractDisplayDetails.userEmail || user.email,
                  fullName: contractDisplayDetails.userFullName || user.fullName,
                  passportNumber: contractDisplayDetails.userPassportNumber || user.passportNumber,
                }}
                planDetails={contractDisplayDetails}
              />
            )}
            <Button onClick={handleSendEmail} variant="outline" className="w-full sm:w-auto">
              <Mail className="me-2 h-4 w-4" />
              {t('sendEmail')}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href={ROUTES.HOME}>
                <Home className="me-2 h-4 w-4" />
                {t('backHome')}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href={ROUTES.PROFILE}>
                <FileText className="me-2 h-4 w-4" />
                {t('viewProfile')}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href={ROUTES.MODIFY_CONTRACT}>
                <Edit className="me-2 h-4 w-4" />
                {t('modifyAnother')}
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-4">
            {t('thankYou', { appName: APP_NAME })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ModifyContractSuccessPage() {
  const t = useTranslations('common');
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t('loading')}</p>
      </div>
    }>
      <ModifySuccessContent />
    </Suspense>
  );
}
