import { AuthForm } from "@/components/auth/auth-form";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your account.",
};

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }, { locale: 'ar' }];
}

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
