'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

interface LanguageSwitcherProps {
  mobile?: boolean;
}

export function LanguageSwitcher({ mobile }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  if (mobile) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-neutral-500">
        <button onClick={() => switchLocale('de')} className={locale === 'de' ? 'text-luxury-gold' : ''}>
          DE
        </button>
        <span className="text-neutral-700">|</span>
        <button onClick={() => switchLocale('en')} className={locale === 'en' ? 'text-luxury-gold' : ''}>
          EN
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs font-bold tracking-widest text-neutral-500 border-l border-neutral-800 pl-6">
      <button
        onClick={() => switchLocale('de')}
        className={`hover:text-luxury-gold transition-colors ${locale === 'de' ? 'text-luxury-gold' : ''}`}
      >
        DE
      </button>
      <button
        onClick={() => switchLocale('en')}
        className={`hover:text-luxury-gold transition-colors ${locale === 'en' ? 'text-luxury-gold' : ''}`}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('ru')}
        className={`hover:text-luxury-gold transition-colors ${locale === 'ru' ? 'text-luxury-gold' : ''}`}
      >
        RU
      </button>
    </div>
  );
}
