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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import type { UserContract } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { getContractByPolicyNumber } from "@/lib/firestore-service";

const findContractSchema = z.object({
  policyNumber: z.string().min(1, { message: "policyNumberRequired" }),
});

type FindContractFormValues = z.infer<typeof findContractSchema>;

interface FindContractFormProps {
  onContractFound: (contract: UserContract) => void;
  onContractNotFound: (message: string) => void;
  onSearchStart: () => void;
  isLoading: boolean;
}

export function FindContractForm({
  onContractFound,
  onContractNotFound,
  onSearchStart,
  isLoading
}: FindContractFormProps) {
  const t = useTranslations('modify');
  const v = useTranslations('validation');
  const { user } = useAuth();

  const form = useForm<FindContractFormValues>({
    resolver: zodResolver(
      z.object({
        policyNumber: z.string().min(1, { message: v('policyNumberRequired') }),
      })
    ),
    defaultValues: {
      policyNumber: "",
    },
  });

  const onSubmit = async (values: FindContractFormValues) => {
    onSearchStart();

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!user) {
      onContractNotFound(t('loginRequired'));
      return;
    }

    try {
      const foundContract = await getContractByPolicyNumber(values.policyNumber.trim());

      if (foundContract && foundContract.userEmail === user.email) {
        onContractFound(foundContract);
      } else {
        onContractNotFound(t('notFoundWithUser'));
      }
    } catch (error) {
      console.error("Error searching for contract:", error);
      onContractNotFound(t('notFound'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="policyNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('policyNumber')}</FormLabel>
              <FormControl>
                <Input placeholder={t('policyNumberPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t('searching')}
            </>
          ) : (
            <>
              <Search className="me-2 h-4 w-4" />
              {t('searchButton')}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
