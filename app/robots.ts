import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://velvet-berlin.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/vb-control/',
          '/checkout/',
          '/payment-success/',
          '/payment-cancel/',
          '/_next/',
          '/static/',
          // Disallow URLs without locale prefix (should use /de/, /en/, /ru/)
          '/search',
          '/profile/',
          '/agency/',
          '/about',
          '/packages',
          '/login',
          '/register',
          // Disallow search with query parameters (canonical is base search page)
          '/*/search?*',
          // Disallow favicon crawling
          '/favicon.ico',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/vb-control/',
          '/checkout/',
          '/payment-success/',
          '/payment-cancel/',
          // Disallow URLs without locale prefix
          '/search',
          '/profile/',
          '/agency/',
          '/about',
          '/packages',
          '/login',
          '/register',
          // Disallow search with query parameters
          '/*/search?*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
