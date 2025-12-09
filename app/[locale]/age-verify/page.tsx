'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui';

export default function AgeVerifyPage() {
  const t = useTranslations('ageVerify');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Get redirect path with locale awareness
  const redirectParam = searchParams.get('redirect') || '/';
  // If redirect doesn't already include locale prefix, add it
  const redirectPath = redirectParam.startsWith(`/${locale}`) || (locale === 'de' && !redirectParam.startsWith('/en') && !redirectParam.startsWith('/ru'))
    ? redirectParam
    : locale === 'de' ? redirectParam : `/${locale}${redirectParam}`;

  const handleVerify = () => {
    setIsLoading(true);

    // Set cookie that expires in 30 days
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `velvet_age_verified=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;

    // Small delay to ensure cookie is set, then redirect
    setTimeout(() => {
      window.location.href = redirectPath;
    }, 100);
  };

  const handleDecline = () => {
    // Redirect to Google
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-luxury-gold tracking-wider">VELVET</h1>
          <p className="text-neutral-500 text-sm mt-1">BERLIN</p>
        </div>

        {/* Age Gate Card */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-sm p-8">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center">
              <span className="text-luxury-gold text-2xl font-bold">18+</span>
            </div>
            <h2 className="text-white font-serif text-2xl mb-4">{t('title')}</h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              {t('description')}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleVerify}
              fullWidth
              disabled={isLoading}
              className="py-3"
            >
              {isLoading ? t('verifying') : t('confirm')}
            </Button>

            <button
              onClick={handleDecline}
              className="w-full py-3 text-neutral-500 hover:text-neutral-300 text-sm transition-colors"
            >
              {t('decline')}
            </button>
          </div>

          <p className="mt-6 text-neutral-600 text-xs leading-relaxed">
            {t('disclaimer')}
          </p>
        </div>

        {/* Legal Footer */}
        <p className="mt-8 text-neutral-600 text-xs">
          {t('legal')}
        </p>
      </div>
    </div>
  );
}
