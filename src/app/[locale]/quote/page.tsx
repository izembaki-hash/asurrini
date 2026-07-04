import { QuotePageClient } from "./quote-client";

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }, { locale: 'ar' }];
}

export default function QuotePage() {
  return <QuotePageClient />;
}
