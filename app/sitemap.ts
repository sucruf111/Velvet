import { MetadataRoute } from 'next';
import { getProfiles, getAgencies } from '@/lib/supabase';

const baseUrl = 'https://velvet-berlin.com';
const locales = ['de', 'en', 'ru'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profiles, agencies] = await Promise.all([
    getProfiles(),
    getAgencies(),
  ]);

  const staticPages = [
    '',
    '/search',
    '/about',
    '/packages',
    '/login',
    '/register',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  for (const locale of locales) {
    for (const page of staticPages) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1.0 : page === '/search' ? 0.9 : 0.7,
        alternates: {
          languages: {
            de: `${baseUrl}/de${page}`,
            en: `${baseUrl}/en${page}`,
            ru: `${baseUrl}/ru${page}`,
          },
        },
      });
    }
  }

  // Profile pages for each locale
  for (const profile of profiles) {
    for (const locale of locales) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/profile/${profile.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: {
            de: `${baseUrl}/de/profile/${profile.id}`,
            en: `${baseUrl}/en/profile/${profile.id}`,
            ru: `${baseUrl}/ru/profile/${profile.id}`,
          },
        },
      });
    }
  }

  // Agency pages for each locale
  for (const agency of agencies) {
    for (const locale of locales) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/agency/${agency.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: {
          languages: {
            de: `${baseUrl}/de/agency/${agency.id}`,
            en: `${baseUrl}/en/agency/${agency.id}`,
            ru: `${baseUrl}/ru/agency/${agency.id}`,
          },
        },
      });
    }
  }

  return sitemapEntries;
}
