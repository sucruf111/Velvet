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
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
