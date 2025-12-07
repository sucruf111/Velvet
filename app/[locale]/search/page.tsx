import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getProfiles } from '@/lib/supabase';
import { SearchClient } from '@/components/SearchClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: `Escort Verzeichnis Berlin - ${t('title')}`,
    description: locale === 'de'
      ? 'Durchsuchen Sie alle verifizierten Escorts in Berlin. Filtern Sie nach Bezirk, Service und mehr. Direkter Kontakt mit unabhängigen Escorts.'
      : 'Browse all verified escorts in Berlin. Filter by district, service type, and more. Direct contact with independent escorts.',
    robots: 'index, follow',
    openGraph: {
      title: `Escort Verzeichnis Berlin - ${t('title')}`,
      description: locale === 'de'
        ? 'Durchsuchen Sie alle verifizierten Escorts in Berlin.'
        : 'Browse all verified escorts in Berlin.',
      locale: locale === 'de' ? 'de_DE' : locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'website',
    },
  };
}

export default async function SearchPage() {
  const profiles = await getProfiles();

  return <SearchClient profiles={profiles} />;
}
