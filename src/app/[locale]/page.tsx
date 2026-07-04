import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, Users, ShieldCheck } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }, { locale: 'ar' }];
}

export default async function HomePage() {
  const t = await getTranslations('home');
  const c = await getTranslations('common');

  const features = [
    {
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      title: t('feature1Title'),
      description: t('feature1Desc'),
    },
    {
      icon: <Plane className="h-8 w-8 text-primary" />,
      title: t('feature2Title'),
      description: t('feature2Desc'),
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: t('feature3Title'),
      description: t('feature3Desc'),
    },
  ];

  return (
    <div className="space-y-16">
      <section className="relative text-primary-foreground py-20 md:py-32 rounded-lg overflow-hidden shadow-xl">
        <Image
          src="/airplane_hero_background.jpg"
          alt="Arrière-plan de voyage avec un avion"
          fill
          style={{ objectFit: 'cover' }}
          data-ai-hint="travel airplane"
          priority={true}
        />
        <div className="absolute inset-0 bg-black opacity-30 z-0"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
            {t('heroTitle')} <span className="text-accent">{c('appName')}</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
          <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-md transition-transform hover:scale-105">
            <Link href={ROUTES.GET_QUOTE}>{t('getQuote')}</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-primary">{t('whyChooseUs')}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card flex flex-col">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl text-primary">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground flex-grow">
                <p>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-secondary text-secondary-foreground py-16 rounded-lg shadow-md">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('howItWorks')}</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary text-primary-foreground rounded-full mb-4 text-2xl font-bold w-12 h-12 flex items-center justify-center">1</div>
              <h3 className="text-xl font-semibold mb-2">{t('step1Title')}</h3>
              <p className="text-sm">{t('step1Desc')}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary text-primary-foreground rounded-full mb-4 text-2xl font-bold w-12 h-12 flex items-center justify-center">2</div>
              <h3 className="text-xl font-semibold mb-2">{t('step2Title')}</h3>
              <p className="text-sm">{t('step2Desc')}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary text-primary-foreground rounded-full mb-4 text-2xl font-bold w-12 h-12 flex items-center justify-center">3</div>
              <h3 className="text-xl font-semibold mb-2">{t('step3Title')}</h3>
              <p className="text-sm">{t('step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 text-center py-16">
        <h2 className="text-3xl font-bold mb-6">{t('ctaTitle')}</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          {t('ctaDesc')}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-md transition-transform hover:scale-105">
            <Link href={ROUTES.GET_QUOTE}>{t('ctaSimulate')}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 shadow-md transition-transform hover:scale-105 border-primary text-primary hover:bg-primary/10">
            <Link href={ROUTES.MODIFY_CONTRACT}>{t('ctaModify')}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
