import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Terms & Conditions | Velvet Berlin',
    robots: 'index, follow',
  };
}

export default async function TermsPage() {
  const t = await getTranslations('legal');

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

        <h1 className="text-4xl font-serif text-white mb-8">{t('terms_title')}</h1>

        <div className="prose prose-invert prose-neutral max-w-none">
          <p className="text-neutral-400 mb-6">{t('last_updated')}: December 2024</p>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-4">{t('section_1_title')}</h2>
            <p className="text-neutral-300 leading-relaxed">{t('section_1_content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-4">{t('section_2_title')}</h2>
            <p className="text-neutral-300 leading-relaxed">{t('section_2_content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-4">{t('section_3_title')}</h2>
            <p className="text-neutral-300 leading-relaxed">{t('section_3_content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-4">{t('section_4_title')}</h2>
            <p className="text-neutral-300 leading-relaxed">{t('section_4_content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-4">{t('section_5_title')}</h2>
            <p className="text-neutral-300 leading-relaxed">{t('section_5_content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-4">{t('section_6_title')}</h2>
            <p className="text-neutral-300 leading-relaxed">{t('section_6_content')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
