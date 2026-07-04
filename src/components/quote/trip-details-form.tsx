"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { fr, enUS, ar } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { TRIP_PURPOSES, DEFAULT_CURRENCY } from "@/lib/constants";
import type { TripDetailsFormData, SelectedPlanWithTripDetails } from "@/lib/types";
import { useState } from "react";
import { getInsuranceRecommendationAction } from "@/app/actions/insurance-actions";
import type { RecommendInsurancePlanInput } from "@/ai/flows/recommend-insurance-plan";
import { COMMON_COUNTRIES } from "@/lib/countries";

const dateLocaleMap: Record<string, Locale> = {
  fr,
  en: enUS,
  ar,
};

const BUDGET_OPTIONS = [
  { value: 150000, label: `150,000 ${DEFAULT_CURRENCY}` },
  { value: 300000, label: `300,000 ${DEFAULT_CURRENCY}` },
  { value: 600000, label: `600,000 ${DEFAULT_CURRENCY}` },
];

interface TripDetailsFormProps {
  onPlanRecommended: (data: SelectedPlanWithTripDetails) => void;
  onError: (errorMessage: string) => void;
}

const purposeKeyMap: Record<string, string> = {
  loisirs: 'leisure',
  affaires: 'business',
  etudes: 'studies',
  visite_familiale: 'familyVisit',
  autre: 'other',
};

export function TripDetailsForm({ onPlanRecommended, onError }: TripDetailsFormProps) {
  const locale = useLocale();
  const t = useTranslations('quote');
  const tp = useTranslations('tripPurposes');
  const v = useTranslations('validation');
  const e = useTranslations('errors');
  const [isLoading, setIsLoading] = useState(false);

  const dateLocale = dateLocaleMap[locale] || fr;

  const tripDetailsSchema = z.object({
    destination: z.string().min(2, { message: v('destinationRequired') }),
    startDate: z.date({ required_error: v('startDateRequired') }),
    endDate: z.date({ required_error: v('endDateRequired') }),
    travelerCount: z.coerce.number().min(1, { message: v('travelerCountMin') }).int(),
    travelerAge: z.coerce.number().min(1, { message: v('travelerAgeMin') }).max(100, { message: v('travelerAgeMax') }).int(),
    preExistingConditions: z.string().optional(),
    tripPurpose: z.string({ required_error: v('tripPurposeRequired') }),
    budget: z.coerce
      .number({ required_error: v('budgetRequired') })
      .refine(value => BUDGET_OPTIONS.map(opt => opt.value).includes(value), {
        message: v('budgetInvalid'),
      }),
  }).refine(data => data.endDate >= data.startDate, {
    message: v('endDateBeforeStart'),
    path: ["endDate"],
  });

  const form = useForm<TripDetailsFormData>({
    resolver: zodResolver(tripDetailsSchema),
    defaultValues: {
      destination: "",
      travelerCount: 1,
      travelerAge: 30,
      preExistingConditions: "",
      tripPurpose: TRIP_PURPOSES[0].value,
      budget: BUDGET_OPTIONS[0].value,
    },
  });

  const onSubmit = async (values: TripDetailsFormData) => {
    setIsLoading(true);
    onError("");

    try {
      if (!values.startDate || !values.endDate) {
        onError(v('selectDates'));
        setIsLoading(false);
        return;
      }

      const inputForAI: RecommendInsurancePlanInput = {
        ...values,
        startDate: format(values.startDate, "yyyy-MM-dd"),
        endDate: format(values.endDate, "yyyy-MM-dd"),
        preExistingConditions: values.preExistingConditions || "Aucune",
      };

      const result = await getInsuranceRecommendationAction(inputForAI);

      if (result && "planName" in result) {
        const planWithTripDetails: SelectedPlanWithTripDetails = {
          plan: result,
          userInput: {
            destination: values.destination,
            startDate: format(values.startDate, "yyyy-MM-dd"),
            endDate: format(values.endDate, "yyyy-MM-dd"),
            travelerCount: values.travelerCount,
            travelerAge: values.travelerAge,
            preExistingConditions: values.preExistingConditions || "Aucune",
            tripPurpose: values.tripPurpose,
            budget: values.budget,
          }
        };
        onPlanRecommended(planWithTripDetails);
      } else if (result && "error" in result) {
        console.error("AI Error:", result.error, result.details);
        onError(result.error || e('noRecommendation'));
      } else {
        onError(e('unexpectedResponse'));
      }
    } catch (error) {
      console.error("Error in onSubmit:", error);
      onError(e('processingError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('destination')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('destinationPlaceholder')} {...field} list="country-suggestions" />
                </FormControl>
                <datalist id="country-suggestions">
                  {COMMON_COUNTRIES.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tripPurpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tripPurpose')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('tripPurposePlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TRIP_PURPOSES.map(purpose => (
                      <SelectItem key={purpose.value} value={purpose.value}>
                        {tp(purposeKeyMap[purpose.value] || purpose.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('startDate')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: dateLocale })
                        ) : (
                          <span>{t('chooseDate')}</span>
                        )}
                        <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
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
                <FormLabel>{t('endDate')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: dateLocale })
                        ) : (
                          <span>{t('chooseDate')}</span>
                        )}
                        <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < (form.getValues("startDate") || new Date(new Date().setHours(0,0,0,0)))}
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

        <div className="grid md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="travelerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('travelerCount')}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="travelerAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('travelerAge')}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('budget')}</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('budgetPlaceholder', { currency: DEFAULT_CURRENCY })} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUDGET_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('budgetHint')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="preExistingConditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('preExistingConditions')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('preExistingConditionsPlaceholder')}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t('preExistingConditionsHint')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t('searching')}
            </>
          ) : t('getRecommendation')}
        </Button>
      </form>
    </Form>
  );
}
