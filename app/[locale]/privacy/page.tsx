import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Privacy Policy | Velvet Berlin',
    robots: 'index, follow',
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');

  return (
    <div className="min-h-screen bg-neutral-950 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-luxury-gold transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span>{t('back')}</span>
        </Link>

        <h1 className="text-4xl font-serif text-white mb-8">{t('title')}</h1>

        <div className="prose prose-invert prose-neutral max-w-none">
          <p className="text-neutral-400 mb-6">{t('last_updated')}: December 2024</p>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-4">{t('intro_title')}</h2>
            <p className="text-neutral-300 leading-relaxed">{t('intro_content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-4">{t('data_collection_title')}</h2>
            <p className="text-neutral-300 leading-relaxed">{t('data_collection_content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-4">{t('data_usage_title')}</h2>
            <p className="text-neutral-300 leading-relaxed">{t('data_usage_content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-4">{t('cookies_title')}</h2>
            <p className="text-neutral-300 leading-relaxed">{t('cookies_content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-4">{t('rights_title')}</h2>
            <p className="text-neutral-300 leading-relaxed">{t('rights_content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-4">{t('contact_title')}</h2>
            <p className="text-neutral-300 leading-relaxed">{t('contact_content')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
