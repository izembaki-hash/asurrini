import { ModifyContractPageClient } from "./modify-contract-client";

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }, { locale: 'ar' }];
}

export default function ModifyContractPage() {
  return <ModifyContractPageClient />;
}
