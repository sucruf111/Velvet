import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/lib/auth-context';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: {
      default: t('title'),
      template: `%s | Velvet Berlin`
    },
    description: t('description'),
    keywords: t('keywords'),
    robots: 'index, follow',
    openGraph: {
      type: 'website',
      locale: locale === 'de' ? 'de_DE' : locale === 'ru' ? 'ru_RU' : 'en_US',
      siteName: 'Velvet Berlin',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: 'https://velvet-berlin.com',
      languages: {
        'de': 'https://velvet-berlin.com/de',
        'en': 'https://velvet-berlin.com/en',
        'ru': 'https://velvet-berlin.com/ru',
      }
    },
    other: {
      'geo.region': 'DE-BE',
      'geo.placename': 'Berlin',
    }
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as 'de' | 'en' | 'ru')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Header />
            <main className="flex-grow pt-20">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
