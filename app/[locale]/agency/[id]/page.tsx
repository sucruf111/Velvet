import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAgencies, getProfiles, getAgencyById } from '@/lib/supabase';
import { AgencyDetailClient } from '@/components/AgencyDetailClient';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const agency = await getAgencyById(id);

  if (!agency) {
    return {
      title: 'Agency Not Found',
      robots: 'noindex',
    };
  }

  const title = locale === 'de'
    ? `${agency.name} - Escort Agentur Berlin | Velvet Berlin`
    : `${agency.name} - Escort Agency Berlin | Velvet Berlin`;

  const description = locale === 'de'
    ? `${agency.name} - Premium Escort Agentur in ${agency.district}, Berlin. ${agency.description?.substring(0, 120) || 'Professionelle Begleitung und erstklassiger Service.'}`
    : `${agency.name} - Premium Escort Agency in ${agency.district}, Berlin. ${agency.description?.substring(0, 120) || 'Professional companionship and first-class service.'}`;

  return {
    title,
    description,
    robots: 'index, follow',
    openGraph: {
      title,
      description,
      images: agency.banner ? [{ url: agency.banner }] : agency.logo ? [{ url: agency.logo }] : undefined,
      locale: locale === 'de' ? 'de_DE' : locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `https://velvet-berlin.com/${locale}/agency/${id}`,
      languages: {
        'de': `https://velvet-berlin.com/de/agency/${id}`,
        'en': `https://velvet-berlin.com/en/agency/${id}`,
        'ru': `https://velvet-berlin.com/ru/agency/${id}`,
      },
    },
  };
}

export async function generateStaticParams() {
  const agencies = await getAgencies();
  return agencies.map((agency) => ({
    id: agency.id,
  }));
}

export default async function AgencyPage({ params }: Props) {
  const { id } = await params;
  const [agency, profiles] = await Promise.all([
    getAgencyById(id),
    getProfiles()
  ]);

  if (!agency) {
    notFound();
  }

  // Filter profiles that belong to this agency
  const agencyProfiles = profiles.filter(p => p.agencyId === id);

  return <AgencyDetailClient agency={agency} profiles={agencyProfiles} />;
}
