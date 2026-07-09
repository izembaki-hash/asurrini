"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Link } from "@/i18n/routing";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface AuthFormProps {
  mode: "login" | "signup";
}

function getFirebaseErrorKey(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'authEmailInUse';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password': return 'authInvalidCredentials';
    case 'auth/user-disabled': return 'authUserDisabled';
    case 'auth/too-many-requests': return 'authTooManyRequests';
    case 'auth/weak-password': return 'authWeakPassword';
    case 'auth/invalid-email': return 'authInvalidEmail';
    default: return 'unknownError';
  }
}

export function AuthForm({ mode }: AuthFormProps) {
  const t = useTranslations('auth');
  const v = useTranslations('validation');
  const e = useTranslations('errors');
  const { login, signup } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const loginSchema = z.object({
    email: z.string().email({ message: v('email') }),
    password: z.string().min(1, { message: v('passwordRequired') }),
  });

  const signupSchema = z.object({
    fullName: z.string().min(2, { message: v('fullNameRequired') }),
    email: z.string().email({ message: v('email') }),
    password: z.string().min(6, { message: v('passwordMinLength') }),
    passportNumber: z.string().min(6, { message: v('passportMinLength') }).optional().or(z.literal('')),
  });

  const formSchema = mode === "login" ? loginSchema : signupSchema;
  type FormValues = z.infer<typeof loginSchema> | z.infer<typeof signupSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: mode === "login"
      ? { email: "", password: "" }
      : { fullName: "", email: "", password: "", passportNumber: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      if (mode === "login") {
        await login(values.email, values.password);
      } else {
        await signup(values.email, values.password, (values as any).fullName || '', (values as any).passportNumber || '');
      }

      toast({
        title: mode === "login" ? t('loginSuccess') : t('signupSuccess'),
        description: mode === "login"
          ? `${t('welcomeBack')}, ${values.email}`
          : `${t('welcomeTo')} ${APP_NAME}, ${(values as any).fullName || values.email} !`,
      });
      router.push(ROUTES.PROFILE);
    } catch (error: any) {
      const errorKey = getFirebaseErrorKey(error?.code || '');
      toast({
        title: e('error'),
        description: e(errorKey),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {mode === "login" ? t('loginTitle') : t('signupTitle')}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? t('loginDesc', { appName: APP_NAME })
              : t('signupDesc', { appName: APP_NAME })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {mode === "signup" && (
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
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="exemple@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mode === "signup" && (
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
              )}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? t('loginButton') : t('signupButton')}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            {mode === "login" ? (
              <>
                {t('noAccount')}{" "}
                <Link href={ROUTES.SIGNUP} className="font-medium text-primary hover:underline">
                  {t('signupLink')}
                </Link>
              </>
            ) : (
              <>
                {t('hasAccount')}{" "}
                <Link href={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
                  {t('loginLink')}
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
