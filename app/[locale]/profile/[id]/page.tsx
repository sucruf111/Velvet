import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfiles, getAgencies, getProfileById } from '@/lib/supabase';
import { ProfileDetailClient } from '@/components/ProfileDetailClient';
import { ServiceType, Profile } from '@/lib/types';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

// JSON-LD Schema Component
function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Generate Profile Schema for SEO
function generateProfileSchema(profile: Profile, locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    description: profile.description?.substring(0, 200),
    image: profile.images[0],
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.district,
      addressRegion: 'Berlin',
      addressCountry: 'DE'
    },
    knowsLanguage: profile.languages,
    url: `https://velvet-berlin.com/${locale}/profile/${profile.id}`,
  };
}

// Generate Breadcrumb Schema for SEO
function generateBreadcrumbSchema(profile: Profile, locale: string) {
  const homeLabel = locale === 'de' ? 'Startseite' : locale === 'ru' ? 'Главная' : 'Home';
  const searchLabel = locale === 'de' ? 'Escorts' : locale === 'ru' ? 'Эскорт' : 'Escorts';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeLabel,
        item: `https://velvet-berlin.com/${locale}`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: searchLabel,
        item: `https://velvet-berlin.com/${locale}/search`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: profile.name,
        item: `https://velvet-berlin.com/${locale}/profile/${profile.id}`
      }
    ]
  };
}

// Helper to check if profile should be indexed
function shouldIndexProfile(profile: { isDisabled?: boolean; lastActive?: string }): boolean {
  // Don't index disabled profiles
  if (profile.isDisabled) return false;

  // Don't index profiles inactive for more than 30 days
  if (profile.lastActive) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (new Date(profile.lastActive) < thirtyDaysAgo) return false;
  }

  return true;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const profile = await getProfileById(id);

  if (!profile) {
    return {
      title: 'Profile Not Found',
      robots: 'noindex',
    };
  }

  // Check if profile should be indexed
  const shouldIndex = shouldIndexProfile(profile);

  const title = locale === 'de'
    ? `${profile.name} - Escort ${profile.district} Berlin`
    : `${profile.name} - Escort ${profile.district} Berlin`;

  const description = locale === 'de'
    ? `${profile.name}, ${profile.age} - ${profile.district}, Berlin. ${profile.services.includes(ServiceType.OUTCALL) ? 'Outcall' : ''} ${profile.services.includes(ServiceType.INCALL) ? 'Incall' : ''}. Ab ${profile.priceStart}€.`
    : `${profile.name}, ${profile.age} - ${profile.district}, Berlin. ${profile.services.includes(ServiceType.OUTCALL) ? 'Outcall' : ''} ${profile.services.includes(ServiceType.INCALL) ? 'Incall' : ''}. Starting from ${profile.priceStart}€.`;

  return {
    title,
    description,
    robots: shouldIndex ? 'index, follow' : 'noindex, nofollow',
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
  const { locale, id } = await params;
  const [profile, agencies] = await Promise.all([
    getProfileById(id),
    getAgencies()
  ]);

  if (!profile) {
    notFound();
  }

  const agency = profile.agencyId ? agencies.find(a => a.id === profile.agencyId) : null;

  // Generate schemas for SEO
  const profileSchema = generateProfileSchema(profile, locale);
  const breadcrumbSchema = generateBreadcrumbSchema(profile, locale);

  return (
    <>
      <JsonLd data={profileSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ProfileDetailClient profile={profile} agency={agency} />
    </>
  );
}
