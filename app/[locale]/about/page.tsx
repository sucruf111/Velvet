import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Shield, CheckCircle, Users, Lock, MessageSquare, Calendar, UserCheck, Camera, Send } from 'lucide-react';
import { Link } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  return {
    title: `${t('title')} - Velvet Berlin`,
    description: locale === 'de'
      ? 'Erfahren Sie mehr über Velvet Berlin, Berlins Premium unabhängiges Escort-Verzeichnis. Verifizierte Profile, sichere Plattform und direkter Kontakt.'
      : 'Learn about Velvet Berlin, Berlin\'s premium independent escort directory. Verified profiles, secure platform, and direct contact with escorts.',
    robots: 'index, follow',
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  return (
    <div className="min-h-screen bg-luxury-black">
      {/* Hero Section */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/5 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-6">
            {t('title')}
          </h1>
          <p className="text-xl text-neutral-400 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* What We Are Section */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl text-luxury-gold mb-6 border-b border-neutral-800 pb-4">
            {t('what_we_are')}
          </h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-neutral-300 leading-relaxed mb-4">
              {t('description_1')}
            </p>
            <p className="text-neutral-300 leading-relaxed mb-4">
              {t('description_2')}
            </p>
            <p className="text-neutral-400 leading-relaxed text-sm">
              {t('disclaimer')}
            </p>
          </div>
        </section>

        {/* What We Offer Section */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl text-luxury-gold mb-6 border-b border-neutral-800 pb-4">
            {t('what_we_offer')}
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-8">
            {t('offer_intro')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded">
              <CheckCircle className="text-luxury-gold mb-4" size={28} />
              <h3 className="text-white font-semibold mb-2">{t('feature_profiles')}</h3>
              <p className="text-neutral-400 text-sm">{t('feature_profiles_desc')}</p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded">
              <Users className="text-luxury-gold mb-4" size={28} />
              <h3 className="text-white font-semibold mb-2">{t('feature_variety')}</h3>
              <p className="text-neutral-400 text-sm">{t('feature_variety_desc')}</p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded">
              <Calendar className="text-luxury-gold mb-4" size={28} />
              <h3 className="text-white font-semibold mb-2">{t('feature_current')}</h3>
              <p className="text-neutral-400 text-sm">{t('feature_current_desc')}</p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded">
              <MessageSquare className="text-luxury-gold mb-4" size={28} />
              <h3 className="text-white font-semibold mb-2">{t('feature_contact')}</h3>
              <p className="text-neutral-400 text-sm">{t('feature_contact_desc')}</p>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl text-luxury-gold mb-6 border-b border-neutral-800 pb-4">
            <Shield className="inline mr-3" size={24} />
            {t('security_title')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-neutral-900/30 rounded">
              <UserCheck className="text-green-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-white font-medium mb-1">{t('security_verification')}</h3>
                <p className="text-neutral-400 text-sm">{t('security_verification_desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-neutral-900/30 rounded">
              <Lock className="text-green-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-white font-medium mb-1">{t('security_privacy')}</h3>
                <p className="text-neutral-400 text-sm">{t('security_privacy_desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-neutral-900/30 rounded">
              <Shield className="text-green-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-white font-medium mb-1">{t('security_report')}</h3>
                <p className="text-neutral-400 text-sm">{t('security_report_desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* For Escorts Section */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl text-luxury-gold mb-6 border-b border-neutral-800 pb-4">
            {t('for_escorts')}
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-6">
            {t('escorts_intro')}
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3 text-neutral-300">
              <CheckCircle className="text-luxury-gold flex-shrink-0" size={18} />
              {t('escorts_benefit_1')}
            </li>
            <li className="flex items-center gap-3 text-neutral-300">
              <CheckCircle className="text-luxury-gold flex-shrink-0" size={18} />
              {t('escorts_benefit_2')}
            </li>
            <li className="flex items-center gap-3 text-neutral-300">
              <CheckCircle className="text-luxury-gold flex-shrink-0" size={18} />
              {t('escorts_benefit_3')}
            </li>
            <li className="flex items-center gap-3 text-neutral-300">
              <CheckCircle className="text-luxury-gold flex-shrink-0" size={18} />
              {t('escorts_benefit_4')}
            </li>
          </ul>
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl text-luxury-gold mb-6 border-b border-neutral-800 pb-4">
            {t('how_it_works')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-luxury-gold font-bold text-xl">1</span>
              </div>
              <UserCheck className="text-luxury-gold mx-auto mb-3" size={32} />
              <h3 className="text-white font-semibold mb-2">{t('step_1_title')}</h3>
              <p className="text-neutral-400 text-sm">{t('step_1_desc')}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-luxury-gold font-bold text-xl">2</span>
              </div>
              <Camera className="text-luxury-gold mx-auto mb-3" size={32} />
              <h3 className="text-white font-semibold mb-2">{t('step_2_title')}</h3>
              <p className="text-neutral-400 text-sm">{t('step_2_desc')}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-luxury-gold font-bold text-xl">3</span>
              </div>
              <Send className="text-luxury-gold mx-auto mb-3" size={32} />
              <h3 className="text-white font-semibold mb-2">{t('step_3_title')}</h3>
              <p className="text-neutral-400 text-sm">{t('step_3_desc')}</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-neutral-900/50 via-luxury-gold/5 to-neutral-900/50 border border-neutral-800 rounded-lg p-12">
          <h2 className="font-serif text-2xl text-white mb-4">
            {t('cta_title')}
          </h2>
          <p className="text-neutral-400 mb-8 max-w-xl mx-auto">
            {t('cta_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="px-8 py-3 bg-luxury-gold text-black font-bold text-sm uppercase tracking-widest hover:bg-luxury-gold/90 transition-colors"
            >
              {t('cta_browse')}
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 border border-luxury-gold text-luxury-gold font-bold text-sm uppercase tracking-widest hover:bg-luxury-gold hover:text-black transition-colors"
            >
              {t('cta_register')}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
