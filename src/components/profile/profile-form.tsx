"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { MockUser } from "@/lib/types";
import { APP_NAME } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export function ProfileForm() {
  const t = useTranslations('profile');
  const v = useTranslations('validation');
  const { user, updateProfile, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileSchema = z.object({
    email: z.string().email(),
    fullName: z.string().min(2, { message: v('fullNameRequired') }),
    passportNumber: z.string().min(6, { message: v('passportMinLength') }).optional().or(z.literal('')),
    phoneNumber: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
  });

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
      fullName: "",
      passportNumber: "",
      phoneNumber: "",
      address: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        fullName: user.fullName || "",
        passportNumber: user.passportNumber || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
      });
    }
  }, [user, form]);

  if (authIsLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <p className="text-center text-destructive">{t('loginRequired')}</p>;
  }

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    setIsSubmitting(true);
    try {
      const updatedUserData: Partial<MockUser> = {
        fullName: values.fullName,
        passportNumber: values.passportNumber || undefined,
        phoneNumber: values.phoneNumber || undefined,
        address: values.address || undefined,
      };

      await updateProfile(updatedUserData);
      toast({
        title: t('saveSuccess'),
        description: t('saveSuccessDesc'),
      });
    } catch {
      toast({
        title: t('saveError'),
        description: t('saveErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('email')}</FormLabel>
              <FormControl>
                <Input {...field} readOnly className="bg-muted/50 cursor-not-allowed" />
              </FormControl>
              <FormDescription>
                {t('emailReadonly')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fullName')}</FormLabel>
              <FormControl>
                <Input placeholder={t('fullName')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passportNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('passportNumber')}</FormLabel>
              <FormControl>
                <Input placeholder={t('passportNumber')} {...field} />
              </FormControl>
              <FormDescription>
                {t('passportHint')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('phoneNumber')}</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+213 XX XX XX XX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('address')}</FormLabel>
              <FormControl>
                <Input placeholder={t('address')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t('saveChanges')}
        </Button>
      </form>
    </Form>
  );
}
