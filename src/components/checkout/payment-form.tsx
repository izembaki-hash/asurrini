"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useLocale, useTranslations } from "next-intl";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { APP_NAME, ROUTES, INSURANCE_POLICY_NUMBER_PREFIX } from "@/lib/constants";
import type { UserContract, SelectedPlanWithTripDetails } from "@/lib/types";
import { addContract } from "@/lib/firestore-service";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

const paymentSchema = z.object({
  paymentMethod: z.enum(["cib", "edahabia", "bank_transfer", "baridi_mob"], {
    required_error: "paymentMethodRequired",
  }),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "agreeTermsRequired",
  }),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  planName: string;
  price: number;
  currency: string;
  provider: string;
  selectedPlanData: SelectedPlanWithTripDetails;
}

function generatePolicyNumber(): string {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  const timestampPart = Date.now().toString().slice(-4);
  return `${INSURANCE_POLICY_NUMBER_PREFIX}-${timestampPart}-${randomNumber}`;
}

export function PaymentForm({
  selectedPlanData
}: PaymentFormProps) {
  const t = useTranslations('checkout');
  const v = useTranslations('validation');
  const e = useTranslations('errors');
  const { toast } = useToast();
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const { plan: aiPlan, userInput } = selectedPlanData;
  const { currency, price, planName } = aiPlan;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(
      z.object({
        paymentMethod: z.enum(["cib", "edahabia", "bank_transfer", "baridi_mob"], {
          required_error: v('paymentMethodRequired'),
        }),
        cardNumber: z.string().optional(),
        expiryDate: z.string().optional(),
        cvv: z.string().optional(),
        agreeToTerms: z.boolean().refine(val => val === true, {
          message: v('agreeTermsRequired'),
        }),
      })
    ),
    defaultValues: {
      paymentMethod: "cib",
      agreeToTerms: false,
    },
  });

  const onSubmit = async (values: PaymentFormValues) => {
    setIsProcessing(true);

    if (!user) {
      toast({ title: t('authError'), description: t('authErrorDesc'), variant: "destructive" });
      setIsProcessing(false);
      router.push(ROUTES.LOGIN);
      return;
    }

    if (!selectedPlanData || !userInput || !aiPlan) {
      toast({ title: t('planError'), description: t('planErrorDesc'), variant: "destructive" });
      setIsProcessing(false);
      router.push(ROUTES.GET_QUOTE);
      return;
    }

    const policyNumber = generatePolicyNumber();
    const newContract: UserContract = {
      policyNumber,
      planName: aiPlan.planName,
      provider: aiPlan.provider,
      originalPrice: aiPlan.price.toString(),
      currency,
      startDate: userInput.startDate,
      endDate: userInput.endDate,
      destination: userInput.destination,
      travelerCount: userInput.travelerCount,
      travelerAge: userInput.travelerAge,
      preExistingConditions: userInput.preExistingConditions,
      tripPurpose: userInput.tripPurpose,
      originalBudget: userInput.budget,
      coverageDetails: aiPlan.coverageDetails,
      policyDocumentLink: aiPlan.policyDocumentLink,
      userEmail: user.email,
      userFullName: user.fullName || user.email,
      userPassportNumber: user.passportNumber,
      issueDate: format(new Date(), "yyyy-MM-dd"),
    };

    try {
      await addContract({ ...newContract, paymentStatus: 'pending' });
    } catch (error) {
      console.error("Failed to save contract to Firestore", error);
      toast({ title: t('saveError'), description: t('saveErrorDesc'), variant: "destructive" });
      setIsProcessing(false);
      return;
    }

    try {
      const origin = window.location.origin;
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: aiPlan.price,
          currency: currency.toLowerCase(),
          locale,
          successUrl: `${origin}/${locale}/checkout/success?policyNumber=${policyNumber}`,
          failureUrl: `${origin}/${locale}/checkout`,
          metadata: { policyNumber },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment creation failed');
      }

      localStorage.removeItem('selectedInsurancePlan');
      window.location.href = data.paymentUrl;
    } catch (error: any) {
      console.error("Chargily checkout error:", error);
      toast({ title: t('paymentError'), description: e('paymentError'), variant: "destructive" });
      setIsProcessing(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-lg font-semibold">{t('paymentMethod')}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-2 md:flex-row md:flex-wrap md:space-y-0 md:space-x-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <FormControl>
                      <RadioGroupItem value="cib" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      {t('cib')}
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <FormControl>
                      <RadioGroupItem value="edahabia" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      {t('edahabia')}
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <FormControl>
                      <RadioGroupItem value="baridi_mob" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      {t('baridiMob')}
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <FormControl>
                      <RadioGroupItem value="bank_transfer" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      {t('bankTransfer')}
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("paymentMethod") === "cib" && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <p className="text-sm text-muted-foreground">{t('simulationNotice')}</p>
            <Input placeholder={t('cibNumber')} disabled />
            <div className="flex gap-4">
              <Input placeholder={t('expiryDate')} className="w-1/2" disabled />
              <Input placeholder={t('cvv')} className="w-1/2" disabled />
            </div>
          </div>
        )}
        {form.watch("paymentMethod") === "edahabia" && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <p className="text-sm text-muted-foreground">{t('simulationNotice')}</p>
            <Input placeholder={t('edahabiaNumber')} disabled />
            <Input placeholder={t('pinCode')} type="password" disabled />
          </div>
        )}
        {form.watch("paymentMethod") === "baridi_mob" && (
          <div className="p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium mb-2">{t('baridiMobTitle')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('baridiMobStep1')}<br />
              {t('baridiMobStep2')}<br />
              {t('baridiMobStep3', { price, currency })}<br />
              {t('baridiMobStep4')}<br />
              {t('baridiMobMerchant', { appName: APP_NAME })}.
            </p>
            <p className="text-xs mt-2">{t('baridiMobNote')}</p>
          </div>
        )}
        {form.watch("paymentMethod") === "bank_transfer" && (
          <div className="p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium mb-2">{t('bankTransferTitle')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('bankTransferDesc', { price, currency })}<br />
              <strong>{t('bankName')}:</strong> {t('bankValue')}<br />
              <strong>{t('rib')}:</strong> 001 00203 0300400500 06<br />
              <strong>{t('beneficiary')}:</strong> {APP_NAME}<br />
              <strong>{t('reason')}:</strong> {t('reasonValue', { planName })}
            </p>
            <p className="text-xs mt-2">{t('baridiMobNote')}</p>
          </div>
        )}

        <FormField
          control={form.control}
          name="agreeToTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {t('agreeTerms')}
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="me-2 h-5 w-5 animate-spin" />
              {t('processing')}
            </>
          ) : (
            <>
              <Lock className="me-2 h-5 w-5" />
              {t('pay', { price, currency })}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
