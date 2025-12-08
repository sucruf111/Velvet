import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Clock, ArrowLeft, CreditCard } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Checkout | Velvet Berlin',
    robots: 'noindex, nofollow',
  };
}

export default async function CheckoutPage() {
  const t = await getTranslations('checkout');
  const commonT = await getTranslations('common');

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-luxury-gold/10 border border-luxury-gold/20">
            <CreditCard size={40} className="text-luxury-gold" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-luxury-gold/10 border border-luxury-gold/20 rounded-full px-4 py-2 mb-6">
          <Clock size={16} className="text-luxury-gold" />
          <span className="text-luxury-gold text-sm font-medium">{commonT('coming_soon')}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-serif text-white mb-4">
          {t('coming_soon_title')}
        </h1>

        {/* Description */}
        <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
          {t('coming_soon_desc')}
        </p>

        {/* Animated dots */}
        <div className="flex justify-center gap-2 mb-10">
          <div className="w-2 h-2 rounded-full bg-luxury-gold animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-luxury-gold animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-luxury-gold animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white hover:text-luxury-gold transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>{commonT('back_home')}</span>
        </Link>
      </div>
    </div>
  );
}
