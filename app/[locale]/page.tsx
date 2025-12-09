import { getProfiles, getAgencies } from '@/lib/supabase';
import { HomeClient } from '@/components/HomeClient';
import { Profile, ServiceType, District, isProfileBoosted } from '@/lib/types';

export const revalidate = 60; // Revalidate every 60 seconds

// JSON-LD Structured Data Component
function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Helper to sort profiles by availability then lastActive
function sortProfiles(profiles: Profile[]) {
  return [...profiles].sort((a, b) => {
    // Unavailable profiles go last
    const aUnavailable = a.isOnline === false;
    const bUnavailable = b.isOnline === false;
    if (aUnavailable && !bUnavailable) return 1;
    if (!aUnavailable && bUnavailable) return -1;

    // Boosted profiles first within same tier
    const aBoosted = isProfileBoosted(a);
    const bBoosted = isProfileBoosted(b);
    if (aBoosted && !bBoosted) return -1;
    if (!aBoosted && bBoosted) return 1;

    // Then by lastActive (most recent first)
    const dateA = new Date(a.lastActive || 0).getTime();
    const dateB = new Date(b.lastActive || 0).getTime();
    return dateB - dateA;
  });
}

export default async function HomePage() {
  const [profiles, agencies] = await Promise.all([
    getProfiles(),
    getAgencies()
  ]);

  // Filter out disabled profiles
  const activeProfiles = profiles.filter(p => !p.isDisabled);

  // Calculate counts
  const totalCount = activeProfiles.length;
  const outcallCount = activeProfiles.filter(p => p.services.includes(ServiceType.OUTCALL)).length;
  const incallCount = activeProfiles.filter(p => p.services.includes(ServiceType.INCALL)).length;
  const massageCount = activeProfiles.filter(p => p.services.includes(ServiceType.MASSAGE)).length;

  // Count profiles per district
  const districtCounts = Object.values(District).reduce((acc, dist) => {
    const count = activeProfiles.filter(p => p.district === dist).length;
    if (count > 0) acc[dist] = count;
    return acc;
  }, {} as Record<string, number>);

  // Sort Elite profiles (tier === 'elite')
  const eliteProfiles = sortProfiles(
    activeProfiles.filter(p => p.tier === 'elite')
  );

  // Sort Premium profiles (tier === 'premium' OR legacy isPremium without tier)
  const premiumProfiles = sortProfiles(
    activeProfiles.filter(p => p.tier === 'premium' || (p.isPremium && (!p.tier || p.tier === 'free')))
  );

  // Sort Free profiles (tier === 'free' or undefined, and not isPremium)
  const freeProfiles = sortProfiles(
    activeProfiles.filter(p => (!p.tier || p.tier === 'free') && !p.isPremium)
  );

  // Structured Data for SEO
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Velvet Berlin',
    url: 'https://velvet-berlin.com',
    logo: 'https://velvet-berlin.com/logo.png',
    description: 'Premium Escort Directory in Berlin - Verified escorts, agencies and adult services.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Berlin',
      addressCountry: 'DE'
    },
    areaServed: {
      '@type': 'City',
      name: 'Berlin'
    }
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Velvet Berlin',
    url: 'https://velvet-berlin.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://velvet-berlin.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Wie funktioniert die Buchung bei Velvet Berlin?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Velvet Berlin ist ein Verzeichnis - Sie finden hier Profile mit Kontaktdaten und nehmen direkt mit der Begleitung Ihrer Wahl Kontakt auf. Wir vermitteln nicht, sondern stellen nur die Plattform bereit.'
        }
      },
      {
        '@type': 'Question',
        name: 'Sind alle Profile verifiziert?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ja, jedes Profil durchläuft unseren Verifizierungsprozess. Escorts reichen ein Selfie mit handschriftlichem Datum ein, um ihre Identität zu bestätigen.'
        }
      },
      {
        '@type': 'Question',
        name: 'Welche Zahlungsmethoden akzeptieren die Escorts?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Die Zahlungsmodalitäten werden direkt zwischen Ihnen und der Begleitung vereinbart. Die meisten bevorzugen Barzahlung.'
        }
      },
      {
        '@type': 'Question',
        name: 'Bieten Sie auch Agentur-Escorts an?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ja, neben unabhängigen Models listen wir auch etablierte Escort-Agenturen in Berlin.'
        }
      }
    ]
  };

  // Use elite profiles first in SEO schema, then premium
  const featuredProfiles = [...eliteProfiles, ...premiumProfiles].slice(0, 10);
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Premium Escorts in Berlin',
    numberOfItems: totalCount,
    itemListElement: featuredProfiles.map((profile, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Person',
        name: profile.name,
        url: `https://velvet-berlin.com/de/profile/${profile.id}`,
        description: profile.description?.substring(0, 150) || `Premium escort in ${profile.district}, Berlin`
      }
    }))
  };

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={itemListSchema} />
      <HomeClient
        eliteProfiles={eliteProfiles}
        premiumProfiles={premiumProfiles}
        freeProfiles={freeProfiles}
        agencies={agencies}
        counts={{
          total: totalCount,
          outcall: outcallCount,
          incall: incallCount,
          massage: massageCount,
          districts: districtCounts
        }}
      />
    </>
  );
}
