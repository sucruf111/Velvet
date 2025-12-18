import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAgencies, getProfiles, getAgencyById } from '@/lib/supabase';
import { AgencyDetailClient } from '@/components/AgencyDetailClient';
import { Agency } from '@/lib/types';

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

// Generate Agency/Organization Schema for SEO
function generateAgencySchema(agency: Agency, locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: agency.name,
    description: agency.description?.substring(0, 200),
    logo: agency.logo,
    image: agency.banner || agency.image,
    url: `https://velvet-berlin.com/${locale}/agency/${agency.id}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: agency.district,
      addressRegion: 'Berlin',
      addressCountry: 'DE'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: agency.phone,
      email: agency.email,
      contactType: 'customer service'
    },
    sameAs: agency.website ? [agency.website] : undefined,
  };
}

// Generate Breadcrumb Schema for SEO
function generateBreadcrumbSchema(agency: Agency, locale: string) {
  const homeLabel = locale === 'de' ? 'Startseite' : locale === 'ru' ? 'Главная' : 'Home';
  const agenciesLabel = locale === 'de' ? 'Agenturen' : locale === 'ru' ? 'Агентства' : 'Agencies';

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
        name: agenciesLabel,
        item: `https://velvet-berlin.com/${locale}/agencies`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: agency.name,
        item: `https://velvet-berlin.com/${locale}/agency/${agency.id}`
      }
    ]
  };
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
  const { locale, id } = await params;
  const [agency, profiles] = await Promise.all([
    getAgencyById(id),
    getProfiles()
  ]);

  if (!agency) {
    notFound();
  }

  // Filter profiles that belong to this agency
  const agencyProfiles = profiles.filter(p => p.agencyId === id);

  // Generate schemas for SEO
  const agencySchema = generateAgencySchema(agency, locale);
  const breadcrumbSchema = generateBreadcrumbSchema(agency, locale);

  return (
    <>
      <JsonLd data={agencySchema} />
      <JsonLd data={breadcrumbSchema} />
      <AgencyDetailClient agency={agency} profiles={agencyProfiles} />
    </>
  );
}
