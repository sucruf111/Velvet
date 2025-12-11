import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getAgencies } from '@/lib/supabase';
import { AgenciesClient } from '@/components/AgenciesClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: locale === 'de'
      ? `Escort Agenturen Berlin - ${t('title')}`
      : locale === 'ru'
      ? `Эскорт агентства Берлина - ${t('title')}`
      : `Escort Agencies Berlin - ${t('title')}`,
    description: locale === 'de'
      ? 'Entdecken Sie alle verifizierten Escort-Agenturen in Berlin. Professionelle Agenturen mit geprüften Models.'
      : locale === 'ru'
      ? 'Откройте для себя все проверенные эскорт-агентства в Берлине. Профессиональные агентства с проверенными моделями.'
      : 'Discover all verified escort agencies in Berlin. Professional agencies with verified models.',
    robots: 'index, follow',
    openGraph: {
      title: locale === 'de'
        ? `Escort Agenturen Berlin - ${t('title')}`
        : `Escort Agencies Berlin - ${t('title')}`,
      description: locale === 'de'
        ? 'Entdecken Sie alle verifizierten Escort-Agenturen in Berlin.'
        : 'Discover all verified escort agencies in Berlin.',
      locale: locale === 'de' ? 'de_DE' : locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'website',
    },
  };
}

export default async function AgenciesPage() {
  const agencies = await getAgencies();

  return <AgenciesClient agencies={agencies} />;
}
