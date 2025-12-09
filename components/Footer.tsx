'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';

export function Footer() {
  const t = useTranslations('footer');
  const homeT = useTranslations('home');
  const navT = useTranslations('nav');
  const { canAdvertise } = useAuth();

  return (
    <footer className="bg-neutral-950 border-t border-neutral-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <Link href="/" className="font-serif text-2xl font-bold text-luxury-white tracking-widest uppercase mb-4 block">
              VELVET<span className="text-luxury-gold">BERLIN</span>
            </Link>
            <p className="text-neutral-500 text-sm leading-relaxed">
              {t('desc')}
            </p>
          </div>

          <div>
            <h4 className="text-luxury-gold text-sm font-bold uppercase tracking-widest mb-6">{t('directory')}</h4>
            <ul className="space-y-3 text-neutral-400 text-sm">
              <li><Link href="/search?district=Mitte" className="hover:text-white">Mitte</Link></li>
              <li><Link href="/search?district=Charlottenburg" className="hover:text-white">Charlottenburg</Link></li>
              <li><Link href="/search?isNew=true" className="hover:text-white">{homeT('new_title')}</Link></li>
              <li><Link href="/search?isPremium=true" className="hover:text-white">{homeT('premium_title')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-luxury-gold text-sm font-bold uppercase tracking-widest mb-6">{t('info')}</h4>
            <ul className="space-y-3 text-neutral-400 text-sm">
              <li><Link href="/about" className="hover:text-white">{t('about')}</Link></li>
              {canAdvertise && (
                <li><Link href="/packages" className="hover:text-white">{navT('advertise')}</Link></li>
              )}
              <li><Link href="/login" className="hover:text-white">{navT('login')}</Link></li>
              <li><span className="text-neutral-600 cursor-not-allowed">{t('terms')}</span></li>
              <li><span className="text-neutral-600 cursor-not-allowed">{t('privacy')}</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-8">
          <p className="text-neutral-500 text-xs text-center mb-4">
            {t('disclaimer')}
          </p>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-neutral-600 text-xs text-center md:text-left">
              © {new Date().getFullYear()} Velvet Berlin. {t('copyright')}
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-5 bg-neutral-800 rounded"></div>
              <div className="w-8 h-5 bg-neutral-800 rounded"></div>
              <div className="w-8 h-5 bg-neutral-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
