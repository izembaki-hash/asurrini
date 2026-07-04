"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { FindContractForm } from "@/components/modify-contract/find-contract-form";
import { ContractModificationDetails } from "@/components/modify-contract/contract-modification-details";
import { useTranslations } from "next-intl";
import type { UserContract } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

export function ModifyContractPageClient() {
  const t = useTranslations('modify');
  const c = useTranslations('common');
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [contract, setContract] = useState<UserContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isContractFound, setIsContractFound] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(ROUTES.LOGIN);
    }
  }, [authLoading, user, router]);

  if (authLoading) return null;
  if (!user) return null;

  const handleContractFound = (foundContract: UserContract) => {
    setContract(foundContract);
    setIsContractFound(true);
    setError(null);
    setIsLoading(false);
  };

  const handleContractNotFound = (message: string) => {
    setContract(null);
    setIsContractFound(false);
    setError(message);
    setIsLoading(false);
  };

  const handleSearchStart = () => {
    setIsLoading(true);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('desc')}
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

          {!isContractFound ? (
            <FindContractForm
              onContractFound={handleContractFound}
              onContractNotFound={handleContractNotFound}
              onSearchStart={handleSearchStart}
              isLoading={isLoading}
            />
          ) : contract && (
            <ContractModificationDetails contract={contract} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
