"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { Loader2, Lock, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, ROUTES, INSURANCE_POLICY_NUMBER_PREFIX } from "@/lib/constants";
import type { UserContract, SelectedPlanWithTripDetails } from "@/lib/types";
import { addContract } from "@/lib/firestore-service";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

const paymentSchema = z.object({
  paymentMethod: z.enum(["cib", "edahabia"], {
    required_error: "paymentMethodRequired",
  }),
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

const CHARGILY_METHODS = ['cib', 'edahabia'];
const COMING_SOON_METHODS = ['baridi_mob', 'bank_transfer'];

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
  const currency = 'DZD';
  const { price, planName } = aiPlan;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "cib",
      agreeToTerms: false,
    },
  });

  const selectedMethod = form.watch('paymentMethod');

  const onSubmit = async (values: PaymentFormValues) => {
    if (COMING_SOON_METHODS.includes(values.paymentMethod)) {
      toast({
        title: t('comingSoon'),
        description: t('comingSoonDesc'),
      });
      return;
    }

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

      if (!data.paymentUrl) {
        throw new Error('No payment URL received');
      }

      localStorage.removeItem('selectedInsurancePlan');
      window.location.href = data.paymentUrl;
    } catch (error: any) {
      console.error("Chargily checkout error:", error);
      toast({ title: t('paymentError'), description: e('paymentError'), variant: "destructive" });
      setIsProcessing(false);
    }
  };

  const handleComingSoon = () => {
    toast({
      title: t('comingSoon'),
      description: t('comingSoonDesc'),
    });
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
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {CHARGILY_METHODS.map((method) => (
                    <FormItem key={method} className="flex items-center gap-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 cursor-pointer">
                      <FormControl>
                        <RadioGroupItem value={method} />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {t(method)}
                      </FormLabel>
                    </FormItem>
                  ))}
                  {COMING_SOON_METHODS.map((method) => (
                    <div key={method} className="flex items-center gap-3 p-3 border rounded-md opacity-50 cursor-not-allowed bg-muted/30" onClick={handleComingSoon}>
                      <RadioGroupItem value={method} disabled className="cursor-not-allowed" />
                      <span className="text-sm font-medium flex items-center gap-2">
                        {t(method)}
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 me-1" />
                          {t('comingSoon')}
                        </Badge>
                      </span>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="p-4 border rounded-md bg-accent/5 text-sm text-muted-foreground">
          {t('chargilyNotice')}
        </div>

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
