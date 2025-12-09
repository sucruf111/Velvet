'use client';

import { useLocale } from 'next-intl';

interface LanguageSwitcherProps {
  mobile?: boolean;
}

export function LanguageSwitcher({ mobile }: LanguageSwitcherProps) {
  const locale = useLocale();

  const switchLocale = (newLocale: string) => {
    // Use window.location for reliable cross-page locale switching
    // This ensures we stay on the same page when switching languages
    const currentPath = window.location.pathname;
    const pathWithoutLocale = currentPath.replace(/^\/(de|en|ru)/, '') || '/';
    const newPath = newLocale === 'de'
      ? pathWithoutLocale  // German is default, no prefix needed
      : `/${newLocale}${pathWithoutLocale}`;
    window.location.href = newPath + window.location.search;
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
