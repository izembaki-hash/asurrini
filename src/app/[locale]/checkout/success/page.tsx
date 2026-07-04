"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { CheckCircle, FileText, Home, AlertTriangle, Mail } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import type { ContractPlanDetails } from "@/lib/types";
import { getContractByPolicyNumberWithStatus } from "@/lib/firestore-service";
import { DownloadContractButton } from "@/components/checkout/insurance-contract";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function SuccessContent() {
  const t = useTranslations('checkoutSuccess');
  const e = useTranslations('errors');
  const c = useTranslations('common');
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [contractDisplayDetails, setContractDisplayDetails] = useState<ContractPlanDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [paymentPending, setPaymentPending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const policyNumber = searchParams.get("policyNumber");

    if (!policyNumber) {
      setDetailsLoading(false);
      return;
    }

    let cancelled = false;

    const loadContract = async () => {
      while (!cancelled) {
        try {
          const foundContract = await getContractByPolicyNumberWithStatus(policyNumber);

          if (foundContract) {
            const paymentStatus = (foundContract as any).paymentStatus;

            if (paymentStatus === 'paid' || !paymentStatus) {
              if (!cancelled) {
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
                  coverageDetails: foundContract.coverageDetails,
                });
                setDetailsLoading(false);
              }
              return;
            }

            setPaymentPending(true);
            setDetailsLoading(false);
          }
        } catch (error) {
          console.error("Failed to load contract from Firestore", error);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    };

    loadContract();

    return () => { cancelled = true; };
  }, [searchParams, user]);

  const handleSendEmail = () => {
    if (!contractDisplayDetails || !user) return;
    console.log("Simulating sending contract by email:", {
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
        <p className="mt-4 text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (paymentPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <CardTitle className="text-2xl font-semibold mb-2">{t('paymentPending')}</CardTitle>
        <CardDescription className="text-muted-foreground mb-6">{t('paymentPendingDesc')}</CardDescription>
      </div>
    );
  }

  if (!contractDisplayDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <CardTitle className="text-2xl font-semibold mb-2">{t('loadError')}</CardTitle>
        <CardDescription className="text-muted-foreground mb-6">{t('loadErrorDesc')}</CardDescription>
        <Button asChild>
          <Link href={ROUTES.HOME}>
            <Home className="me-2 h-4 w-4" />
            {t('backHome')}
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
          <CardTitle className="text-3xl font-bold text-primary">{t('congratulations')}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2"
            dangerouslySetInnerHTML={{
              __html: t('subscriptionConfirmed', { planName: contractDisplayDetails.planName }),
            }}
          />
          <CardDescription className="text-base text-muted-foreground pt-1">
            {t('policyNumber')} <strong>{contractDisplayDetails.policyNumber}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {contractDisplayDetails.price && contractDisplayDetails.currency && (
            <p className="text-md"
              dangerouslySetInnerHTML={{
                __html: t('amountDebited', { price: contractDisplayDetails.price, currency: contractDisplayDetails.currency }),
              }}
            />
          )}
          <p className="text-md">
            {t('emailNotice')}
          </p>

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
          </div>
          <p className="text-xs text-muted-foreground pt-4">
            {t('thankYou', { appName: APP_NAME })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  const t = useTranslations('checkoutSuccess');
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t('loadingFallback')}</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
