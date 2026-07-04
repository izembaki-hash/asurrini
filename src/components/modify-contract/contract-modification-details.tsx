"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, parseISO, isValid, differenceInMilliseconds, differenceInDays } from "date-fns";
import { fr, enUS, ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, Edit3, DollarSign, ShieldCheck, FileText, AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import type { UserContract, ModifiableContractFields, InsurancePlan, RecommendInsurancePlanInput } from "@/lib/types";
import { DEFAULT_CURRENCY, MODIFICATION_FEE, ROUTES } from "@/lib/constants";
import { updateContract } from "@/lib/firestore-service";
import { getInsuranceRecommendationAction } from "@/app/actions/insurance-actions";
import { COMMON_COUNTRIES } from "@/lib/countries";

const dateLocaleMap: Record<string, Locale> = {
  fr,
  en: enUS,
  ar,
};

interface ContractModificationDetailsProps {
  contract: UserContract;
  onModificationSuccess: () => void;
}

export function ContractModificationDetails({ contract, onModificationSuccess }: ContractModificationDetailsProps) {
  const locale = useLocale();
  const t = useTranslations('modify');
  const v = useTranslations('validation');
  const dateLocale = dateLocaleMap[locale] || fr;
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [canModify, setCanModify] = useState(false);
  const [modificationDisabledReason, setModificationDisabledReason] = useState<string | null>(null);

  const [newPlanRecommendation, setNewPlanRecommendation] = useState<InsurancePlan | null>(null);
  const [calculatedPaymentDue, setCalculatedPaymentDue] = useState<number | null>(null);
  const [modificationCostBreakdown, setModificationCostBreakdown] = useState<{
    fixedFee: number;
    additionalDaysSurcharge: number;
    totalDue: number;
    newBasePlanPrice: number;
    additionalDays: number;
    dailyRateForNewPlan?: number;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const initialStartDate = isValid(parseISO(contract.startDate)) ? parseISO(contract.startDate) : new Date();
  const initialEndDate = isValid(parseISO(contract.endDate)) ? parseISO(contract.endDate) : new Date();

  const modificationSchema = z.object({
    startDate: z.date({ required_error: v('startDateRequired') }),
    endDate: z.date({ required_error: v('endDateRequired') }),
    destination: z.string().min(2, { message: v('destinationRequired') }),
  }).refine(data => data.endDate >= data.startDate, {
    message: v('endDateBeforeStart'),
    path: ["endDate"],
  });

  const form = useForm<ModifiableContractFields>({
    resolver: zodResolver(modificationSchema),
    defaultValues: {
      startDate: initialStartDate,
      endDate: initialEndDate,
      destination: contract.destination,
    },
  });

  useEffect(() => {
    const contractStartDateObj = parseISO(contract.startDate);
    if (!isValid(contractStartDateObj)) {
      setModificationDisabledReason(t('dateErrorDesc'));
      setCanModify(false);
      return;
    }

    const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
    const now = new Date();

    if (differenceInMilliseconds(contractStartDateObj, now) < fortyEightHoursInMs) {
      setModificationDisabledReason(t('modificationUnavailableDesc'));
      setCanModify(false);
    } else {
      setModificationDisabledReason(null);
      setCanModify(true);
    }
  }, [contract.startDate, t]);

  const handleCalculateModificationCost = async (values: ModifiableContractFields) => {
    setIsCalculatingCost(true);
    setAiError(null);
    setNewPlanRecommendation(null);
    setCalculatedPaymentDue(null);
    setModificationCostBreakdown(null);

    const inputForAI: RecommendInsurancePlanInput = {
      destination: values.destination,
      startDate: format(values.startDate, "yyyy-MM-dd"),
      endDate: format(values.endDate, "yyyy-MM-dd"),
      travelerCount: contract.travelerCount,
      travelerAge: contract.travelerAge,
      preExistingConditions: contract.preExistingConditions,
      tripPurpose: contract.tripPurpose,
      budget: contract.originalBudget,
    };

    const result = await getInsuranceRecommendationAction(inputForAI);
    setIsCalculatingCost(false);

    if (result && "planName" in result) {
      const newAiPlanPrice = result.price;
      setNewPlanRecommendation(result);

      const originalContractStartDate = parseISO(contract.startDate);
      const originalContractEndDate = parseISO(contract.endDate);

      let originalDurationInDays = -1;
      if (isValid(originalContractStartDate) && isValid(originalContractEndDate)) {
        originalDurationInDays = differenceInDays(originalContractEndDate, originalContractStartDate) + 1;
      } else {
        setAiError(t('dateErrorDesc'));
        toast({ title: t('dateError'), description: t('dateErrorDesc'), variant: "destructive" });
        return;
      }

      const newProposedStartDate = values.startDate;
      const newProposedEndDate = values.endDate;
      const newProposedDurationInDays = differenceInDays(newProposedEndDate, newProposedStartDate) + 1;

      let additionalDaysSurcharge = 0;
      const additionalDays = newProposedDurationInDays - originalDurationInDays;
      let dailyRateForNewPlan: number | undefined = undefined;

      if (additionalDays > 0) {
        if (newProposedDurationInDays > 0) {
          dailyRateForNewPlan = newAiPlanPrice / newProposedDurationInDays;
          additionalDaysSurcharge = additionalDays * dailyRateForNewPlan;
        }
      }

      const totalDueForModification = MODIFICATION_FEE + additionalDaysSurcharge;

      setCalculatedPaymentDue(totalDueForModification);
      setModificationCostBreakdown({
        fixedFee: MODIFICATION_FEE,
        additionalDaysSurcharge,
        totalDue: totalDueForModification,
        newBasePlanPrice: newAiPlanPrice,
        additionalDays: additionalDays > 0 ? additionalDays : 0,
        dailyRateForNewPlan: dailyRateForNewPlan,
      });

      toast({
        title: t('costBreakdown'),
        description: `${t('totalDue')}: ${totalDueForModification.toFixed(2)} ${DEFAULT_CURRENCY}. ${t('newTotalPrice')}: ${newAiPlanPrice.toFixed(2)} ${DEFAULT_CURRENCY}.`,
        duration: 10000,
      });
    } else if (result && "error" in result) {
      setAiError(result.error || t('calculationError'));
      toast({ title: t('calculationError'), description: result.error, variant: "destructive" });
    } else {
      setAiError(t('calculationError'));
      toast({ title: t('calculationError'), description: t('calculationError'), variant: "destructive" });
    }
  };

  const handleConfirmAndPay = async () => {
    if (!newPlanRecommendation || calculatedPaymentDue === null || !modificationCostBreakdown) {
      toast({ title: t('calculationError'), description: t('modificationErrorDesc'), variant: "destructive" });
      return;
    }
    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const modifiedValues = form.getValues();
      const updatedData: Partial<UserContract> = {
        startDate: format(modifiedValues.startDate, "yyyy-MM-dd"),
        endDate: format(modifiedValues.endDate, "yyyy-MM-dd"),
        destination: modifiedValues.destination,
        planName: newPlanRecommendation.planName,
        provider: newPlanRecommendation.provider,
        originalPrice: newPlanRecommendation.price.toString(),
        coverageDetails: newPlanRecommendation.coverageDetails,
        policyDocumentLink: newPlanRecommendation.policyDocumentLink,
        lastModifiedDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      };

      await updateContract(contract.policyNumber, updatedData);

      toast({
        title: t('modificationSuccess'),
        description: t('modificationSuccessDesc', { policyNumber: contract.policyNumber, amount: calculatedPaymentDue.toFixed(2), currency: DEFAULT_CURRENCY }),
      });

      router.push(`${ROUTES.MODIFY_CONTRACT_SUCCESS}?policyNumber=${contract.policyNumber}&actualModificationCostPaid=${calculatedPaymentDue.toFixed(2)}`);
      onModificationSuccess();
    } catch (error: any) {
      console.error("Error modifying contract:", error);
      toast({ title: t('modificationError'), description: t('modificationErrorDesc'), variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center text-primary"><ShieldCheck className="me-2"/>{t('currentContract')}: {contract.policyNumber}</CardTitle>
          <CardDescription>{t('plan')}: {contract.planName} ({contract.provider})</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>{t('insured')}:</strong> {contract.userFullName} ({contract.userEmail})</p>
          <p><strong>{t('passport')}:</strong> {contract.userPassportNumber || "N/A"}</p>
          <p><strong>{t('currentDestination')}:</strong> {contract.destination}</p>
          <p><strong>{t('currentDates')}:</strong> {isValid(parseISO(contract.startDate)) ? format(parseISO(contract.startDate), "dd/MM/yyyy", { locale: dateLocale }) : "N/A"} - {isValid(parseISO(contract.endDate)) ? format(parseISO(contract.endDate), "dd/MM/yyyy", { locale: dateLocale }) : "N/A"}</p>
          <p><strong>{t('currentPrice')}:</strong> {parseFloat(contract.originalPrice).toFixed(2)} {contract.currency}</p>
          <p><strong>{t('issueDate')}:</strong> {isValid(parseISO(contract.issueDate)) ? format(parseISO(contract.issueDate), "dd/MM/yyyy", { locale: dateLocale }) : "N/A"}</p>
          {contract.lastModifiedDate && <p><strong>{t('lastModified')}:</strong> {isValid(parseISO(contract.lastModifiedDate)) ? format(parseISO(contract.lastModifiedDate), "dd/MM/yyyy HH:mm", { locale: dateLocale }) : "N/A"}</p>}
        </CardContent>
      </Card>

      <Separator />

      {!canModify && modificationDisabledReason && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('modificationUnavailable')}</AlertTitle>
          <AlertDescription>{modificationDisabledReason}</AlertDescription>
        </Alert>
      )}

      <h3 className="text-xl font-semibold text-primary flex items-center"><Edit3 className="me-2"/>{t('modifyTripDetails')}</h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCalculateModificationCost)} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('newStartDate')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          disabled={!canModify || isCalculatingCost || isProcessing}
                        >
                          {field.value ? format(field.value, "PPP", { locale: dateLocale }) : <span>{t('modifyTripDetails')}</span>}
                          <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => { field.onChange(date); setNewPlanRecommendation(null); setCalculatedPaymentDue(null); setModificationCostBreakdown(null); }}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || !canModify || isCalculatingCost || isProcessing}
                        initialFocus
                        locale={dateLocale}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('newEndDate')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          disabled={!canModify || isCalculatingCost || isProcessing}
                        >
                          {field.value ? format(field.value, "PPP", { locale: dateLocale }) : <span>{t('modifyTripDetails')}</span>}
                          <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => { field.onChange(date); setNewPlanRecommendation(null); setCalculatedPaymentDue(null); setModificationCostBreakdown(null); }}
                        disabled={(date) => date < (form.getValues("startDate") || new Date(new Date().setHours(0,0,0,0))) || !canModify || isCalculatingCost || isProcessing}
                        initialFocus
                        locale={dateLocale}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('newDestination')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('newDestination')}
                    {...field}
                    disabled={!canModify || isCalculatingCost || isProcessing}
                    onChange={(e) => { field.onChange(e); setNewPlanRecommendation(null); setCalculatedPaymentDue(null); setModificationCostBreakdown(null); }}
                    list="country-suggestions-modify"
                  />
                </FormControl>
                <datalist id="country-suggestions-modify">
                  {COMMON_COUNTRIES.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" variant="outline" disabled={!canModify || isCalculatingCost || isProcessing || !!newPlanRecommendation}>
            {isCalculatingCost ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}
            {newPlanRecommendation ? t('costCalculated') : t('calculateCost')}
          </Button>

          {aiError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('calculationError')}</AlertTitle>
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
          )}

          {modificationCostBreakdown && newPlanRecommendation && (
            <Card className="mt-4 bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-green-700 flex items-center"><CheckCircle className="me-2"/>{t('costBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-green-600">
                <p><strong>{t('newSuggestedPlan')}:</strong> {newPlanRecommendation.planName} ({newPlanRecommendation.provider})</p>
                <p><strong>{t('newTotalPrice')}:</strong> {modificationCostBreakdown.newBasePlanPrice.toFixed(2)} {DEFAULT_CURRENCY}</p>
                <Separator className="bg-green-200" />
                <div className="space-y-1">
                  <p>{t('fixedFee')}: <span className="font-semibold">{modificationCostBreakdown.fixedFee.toFixed(2)} {DEFAULT_CURRENCY}</span></p>
                </div>
                <Separator className="bg-green-200" />
                <p className="font-bold text-md text-green-700">{t('totalDue')}: {modificationCostBreakdown.totalDue.toFixed(2)} {DEFAULT_CURRENCY}</p>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>

      {newPlanRecommendation && calculatedPaymentDue !== null && modificationCostBreakdown && (
        <Button onClick={handleConfirmAndPay} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-6" disabled={isProcessing || isCalculatingCost || !canModify}>
          {isProcessing ? (
            <> <Loader2 className="me-2 h-4 w-4 animate-spin" /> {t('processing')} </>
          ) : (
            <> <FileText className="me-2 h-4 w-4" /> {t('confirmAndPay', { amount: calculatedPaymentDue.toFixed(2), currency: DEFAULT_CURRENCY })} </>
          )}
        </Button>
      )}

      <Alert className="mt-6">
        <DollarSign className="h-4 w-4" />
        <AlertTitle>{t('feeInfoTitle')}</AlertTitle>
        <AlertDescription>
          {t('feeInfoDesc', { fee: MODIFICATION_FEE, currency: DEFAULT_CURRENCY })}
        </AlertDescription>
      </Alert>
    </div>
  );
}
