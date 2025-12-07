import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfiles, getAgencies } from '@/lib/supabase';
import { ProfileDetailClient } from '@/components/ProfileDetailClient';
import { ServiceType } from '@/lib/types';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const profiles = await getProfiles();
  const profile = profiles.find(p => p.id === id);

  if (!profile) {
    return {
      title: 'Profile Not Found',
      robots: 'noindex',
    };
  }

  const title = locale === 'de'
    ? `${profile.name} - Escort ${profile.district} Berlin`
    : `${profile.name} - Escort ${profile.district} Berlin`;

  const description = locale === 'de'
    ? `${profile.name}, ${profile.age} - ${profile.district}, Berlin. ${profile.services.includes(ServiceType.OUTCALL) ? 'Outcall' : ''} ${profile.services.includes(ServiceType.INCALL) ? 'Incall' : ''}. Ab ${profile.priceStart}€.`
    : `${profile.name}, ${profile.age} - ${profile.district}, Berlin. ${profile.services.includes(ServiceType.OUTCALL) ? 'Outcall' : ''} ${profile.services.includes(ServiceType.INCALL) ? 'Incall' : ''}. Starting from ${profile.priceStart}€.`;

  return {
    title,
    description,
    robots: 'index, follow',
    openGraph: {
      title,
      description,
      images: profile.images[0] ? [{ url: profile.images[0] }] : undefined,
      locale: locale === 'de' ? 'de_DE' : locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'profile',
    },
    alternates: {
      canonical: `https://velvet-berlin.com/${locale}/profile/${id}`,
      languages: {
        'de': `https://velvet-berlin.com/de/profile/${id}`,
        'en': `https://velvet-berlin.com/en/profile/${id}`,
        'ru': `https://velvet-berlin.com/ru/profile/${id}`,
      },
    },
  };
}

export async function generateStaticParams() {
  const profiles = await getProfiles();
  return profiles.map((profile) => ({
    id: profile.id,
  }));
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const [profiles, agencies] = await Promise.all([
    getProfiles(),
    getAgencies()
  ]);

  const profile = profiles.find(p => p.id === id);

  if (!profile) {
    notFound();
  }

  const agency = profile.agencyId ? agencies.find(a => a.id === profile.agencyId) : null;

  return <ProfileDetailClient profile={profile} agency={agency} />;
}
