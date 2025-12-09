import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const AGE_VERIFIED_COOKIE = 'velvet_age_verified';

// Search engine bot and AI crawler user agents to allow through for SEO
const BOT_USER_AGENTS = [
  // Search engines
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp',        // Yahoo
  'baiduspider',
  'applebot',
  // Social media
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'slackbot',
  // SEO tools
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'petalbot',
  'screaming frog',
  // AI crawlers
  'gptbot',           // OpenAI/ChatGPT
  'chatgpt-user',     // ChatGPT browsing
  'claude-web',       // Anthropic Claude
  'claudebot',        // Anthropic Claude
  'anthropic-ai',     // Anthropic
  'cohere-ai',        // Cohere
  'perplexitybot',    // Perplexity AI
  'youbot',           // You.com
  'ccbot',            // Common Crawl (used by AI training)
  'google-extended',  // Google AI/Bard
  'bytespider',       // ByteDance/TikTok AI
  'amazonbot',        // Amazon Alexa/AI
  'meta-externalagent', // Meta AI
];

// Check if request is from a search engine bot
function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

// Pages that don't require age verification
const PUBLIC_PATHS = [
  '/age-verify',
  '/api',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

// Protected routes that require authentication
const AUTH_REQUIRED_PATHS = [
  '/dashboard',
  '/checkout',
  '/payment-success',
  '/payment-cancel',
];

// Admin-only routes
const ADMIN_ONLY_PATHS = [
  '/vb-control',
  '/admin-dashboard',
];

// Helper to extract locale from pathname
function getLocale(pathname: string): string {
  const localeMatch = pathname.match(/^\/(de|en|ru)(\/|$)/);
  return localeMatch ? localeMatch[1] : 'de';
}

// Helper to strip locale from pathname for route matching
function getPathWithoutLocale(pathname: string): string {
  return pathname.replace(/^\/(de|en|ru)/, '') || '/';
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  const locale = getLocale(pathname);
  const userAgent = request.headers.get('user-agent');

  // Skip checks for public paths and static files
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  const isStaticFile = pathname.includes('.') && !pathname.includes('/age-verify');

  if (isPublicPath || isStaticFile) {
    return intlMiddleware(request);
  }

  // Allow search engine bots through without age verification (important for SEO!)
  if (isBot(userAgent)) {
    return intlMiddleware(request);
  }

  // Check for age verification cookie
  const ageVerified = request.cookies.get(AGE_VERIFIED_COOKIE)?.value === 'true';

  // If not verified, redirect to age verification page
  if (!ageVerified) {
    // Don't redirect if already on age-verify page
    if (pathname.includes('/age-verify')) {
      return intlMiddleware(request);
    }

    // Store the original URL to redirect back after verification
    const redirectUrl = new URL(`/${locale}/age-verify`, request.url);
    redirectUrl.searchParams.set('redirect', pathname);

    return NextResponse.redirect(redirectUrl);
  }

  // Check if route requires authentication
  const requiresAuth = AUTH_REQUIRED_PATHS.some(path => pathWithoutLocale.startsWith(path));
  const requiresAdmin = ADMIN_ONLY_PATHS.some(path => pathWithoutLocale.startsWith(path));

  if (requiresAuth || requiresAdmin) {
    // Create Supabase client with cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error } = await supabase.auth.getUser();

    // If no user is logged in, redirect to login
    if (error || !user) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin access for admin-only routes
    if (requiresAdmin) {
      const userRole = user.user_metadata?.role;

      if (userRole !== 'admin') {
        // Non-admin trying to access admin page - redirect to dashboard
        const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  // All checks passed, continue with locale middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
