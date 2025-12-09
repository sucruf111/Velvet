import { MetadataRoute } from 'next';
import { getProfiles, getAgencies } from '@/lib/supabase';
import { District } from '@/lib/types';

const baseUrl = 'https://velvet-berlin.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profiles, agencies] = await Promise.all([
    getProfiles(),
    getAgencies(),
  ]);

  // Static pages (excluding login/register - no need to index auth pages)
  const staticPages = [
    { path: '', priority: 1.0, changeFreq: 'daily' as const },
    { path: '/search', priority: 0.9, changeFreq: 'daily' as const },
    { path: '/about', priority: 0.6, changeFreq: 'monthly' as const },
    { path: '/packages', priority: 0.7, changeFreq: 'weekly' as const },
  ];

  // Berlin districts for local SEO
  const districts = Object.values(District);

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Static pages for each locale (only add once, not per locale)
  for (const page of staticPages) {
    sitemapEntries.push({
      url: `${baseUrl}/de${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFreq,
      priority: page.priority,
      alternates: {
        languages: {
          'x-default': `${baseUrl}/de${page.path}`,
          de: `${baseUrl}/de${page.path}`,
          en: `${baseUrl}/en${page.path}`,
          ru: `${baseUrl}/ru${page.path}`,
        },
      },
    });
  }

  // District-specific search pages for local SEO (German only for main indexing)
  for (const district of districts) {
    sitemapEntries.push({
      url: `${baseUrl}/de/search?district=${encodeURIComponent(district)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: {
        languages: {
          'x-default': `${baseUrl}/de/search?district=${encodeURIComponent(district)}`,
          de: `${baseUrl}/de/search?district=${encodeURIComponent(district)}`,
          en: `${baseUrl}/en/search?district=${encodeURIComponent(district)}`,
          ru: `${baseUrl}/ru/search?district=${encodeURIComponent(district)}`,
        },
      },
    });
  }

  // Profile pages (only add once with alternates, use actual lastActive date)
  for (const profile of profiles) {
    const lastMod = profile.lastActive ? new Date(profile.lastActive) : new Date();
    sitemapEntries.push({
      url: `${baseUrl}/de/profile/${profile.id}`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: profile.isPremium ? 0.9 : 0.8,
      alternates: {
        languages: {
          'x-default': `${baseUrl}/de/profile/${profile.id}`,
          de: `${baseUrl}/de/profile/${profile.id}`,
          en: `${baseUrl}/en/profile/${profile.id}`,
          ru: `${baseUrl}/ru/profile/${profile.id}`,
        },
      },
    });
  }

  // Agency pages (only add once with alternates)
  for (const agency of agencies) {
    sitemapEntries.push({
      url: `${baseUrl}/de/agency/${agency.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: {
          'x-default': `${baseUrl}/de/agency/${agency.id}`,
          de: `${baseUrl}/de/agency/${agency.id}`,
          en: `${baseUrl}/en/agency/${agency.id}`,
          ru: `${baseUrl}/ru/agency/${agency.id}`,
        },
      },
    });
  }

  return sitemapEntries;
}
