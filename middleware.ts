import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const AGE_VERIFIED_COOKIE = 'velvet_age_verified';

// Pages that don't require age verification
const PUBLIC_PATHS = [
  '/age-verify',
  '/api',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip age check for public paths and static files
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  const isStaticFile = pathname.includes('.');

  if (isPublicPath || isStaticFile) {
    return intlMiddleware(request);
  }

  // Check for age verification cookie
  const ageVerified = request.cookies.get(AGE_VERIFIED_COOKIE)?.value === 'true';

  // If not verified, redirect to age verification page
  if (!ageVerified) {
    // Extract locale from pathname or use default
    const localeMatch = pathname.match(/^\/(de|en|ru)(\/|$)/);
    const locale = localeMatch ? localeMatch[1] : 'de';

    // Don't redirect if already on age-verify page
    if (pathname.includes('/age-verify')) {
      return intlMiddleware(request);
    }

    // Store the original URL to redirect back after verification
    const redirectUrl = new URL(`/${locale}/age-verify`, request.url);
    redirectUrl.searchParams.set('redirect', pathname);

    return NextResponse.redirect(redirectUrl);
  }

  // User is verified, continue with locale middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
