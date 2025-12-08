import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Clock, ArrowLeft, CheckCircle } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Payment Successful | Velvet Berlin',
    robots: 'noindex, nofollow',
  };
}

export default async function PaymentSuccessPage() {
  const t = await getTranslations('payment');
  const commonT = await getTranslations('common');

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle size={40} className="text-green-500" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-luxury-gold/10 border border-luxury-gold/20 rounded-full px-4 py-2 mb-6">
          <Clock size={16} className="text-luxury-gold" />
          <span className="text-luxury-gold text-sm font-medium">{commonT('coming_soon')}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-serif text-white mb-4">
          {t('success_title')}
        </h1>

        {/* Description */}
        <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
          {t('success_coming_soon')}
        </p>

        {/* Animated dots */}
        <div className="flex justify-center gap-2 mb-10">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
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
