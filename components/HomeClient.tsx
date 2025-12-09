'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { Profile, Agency, ServiceType } from '@/lib/types';
import { ProfileCard } from './ProfileCard';
import { AgencyCard } from './AgencyCard';
import { LuxuryBackground } from './LuxuryBackground';
import { ChevronDown, MapPin, Shield, Clock } from 'lucide-react';

interface HomeClientProps {
  eliteProfiles: Profile[];
  premiumProfiles: Profile[];
  freeProfiles: Profile[];
  agencies: Agency[];
  counts: {
    total: number;
    outcall: number;
    incall: number;
    massage: number;
    districts: Record<string, number>;
  };
}

const ELITE_VISIBLE = 8; // Elite carousel shows max 8
const PREMIUM_INITIAL = 12;
const PREMIUM_LOAD_MORE = 12;
const FREE_INITIAL = 24;
const FREE_LOAD_MORE = 24;

export function HomeClient({ eliteProfiles, premiumProfiles, freeProfiles, agencies, counts }: HomeClientProps) {
  const router = useRouter();
  const t = useTranslations('home');

  // State for "Load More" functionality
  const [premiumVisible, setPremiumVisible] = useState(PREMIUM_INITIAL);
  const [freeVisible, setFreeVisible] = useState(FREE_INITIAL);

  const visibleEliteProfiles = eliteProfiles.slice(0, ELITE_VISIBLE);
  const visiblePremiumProfiles = premiumProfiles.slice(0, premiumVisible);
  const visibleFreeProfiles = freeProfiles.slice(0, freeVisible);

  const hasMorePremium = premiumProfiles.length > premiumVisible;
  const hasMoreFree = freeProfiles.length > freeVisible;

  return (
    <div className="animate-fade-in bg-luxury-black min-h-screen">
      {/* Hero Section - Compact */}
      <section className="relative -mt-28 pt-36 pb-12 px-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <LuxuryBackground />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Subtitle */}
          <p className="text-luxury-gold/80 text-[10px] md:text-xs mb-4 tracking-[0.35em] uppercase font-medium">
            {t('subtitle')}
          </p>

          {/* Main Title - Compact */}
          <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white mb-6 tracking-wide leading-tight">
            <span className="inline-block opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              {t('title_prefix')}
            </span>{' '}
            <span className="inline-block text-luxury-gold opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              {t('title_highlight')}
            </span>{' '}
            <span className="inline-block opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
              {t('title_suffix')}
            </span>
          </h1>

          {/* Simple divider */}
          <div className="w-12 h-px bg-luxury-gold/30 mx-auto mb-6"></div>

          {/* Filter Cloud - Compact */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-w-5xl mx-auto">
            <button
              onClick={() => router.push('/search')}
              className="group relative px-4 py-2 rounded-full bg-luxury-gold-gradient text-black font-bold text-xs md:text-sm border border-white/20 hover:scale-105 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              {t('filter_all')} ({counts.total})
            </button>

            <button
              onClick={() => router.push(`/search?service=${ServiceType.OUTCALL}`)}
              className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-md text-white text-xs md:text-sm font-medium border border-neutral-700 hover:border-luxury-gold hover:text-luxury-gold hover:bg-black/50 transition-all"
            >
              {t('filter_outcall')} ({counts.outcall})
            </button>

            <button
              onClick={() => router.push(`/search?service=${ServiceType.INCALL}`)}
              className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-md text-white text-xs md:text-sm font-medium border border-neutral-700 hover:border-luxury-gold hover:text-luxury-gold hover:bg-black/50 transition-all"
            >
              {t('filter_incall')} ({counts.incall})
            </button>

            <button
              onClick={() => router.push(`/search?service=${ServiceType.MASSAGE}`)}
              className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-md text-white text-xs md:text-sm font-medium border border-neutral-700 hover:border-luxury-gold hover:text-luxury-gold hover:bg-black/50 transition-all"
            >
              {t('filter_massage')} ({counts.massage})
            </button>

            {/* District Filters */}
            {Object.entries(counts.districts).map(([district, count]) => (
              <button
                key={district}
                onClick={() => router.push(`/search?district=${district}`)}
                className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-md text-neutral-300 text-xs md:text-sm font-medium border border-neutral-700 hover:border-luxury-gold hover:text-luxury-gold hover:bg-black/50 transition-all"
              >
                {district} ({count})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Model Grid Section */}
      <div className="w-full px-0 pb-12 bg-luxury-black relative z-20">
        <div className="max-w-[1920px] mx-auto w-full">
          {/* Elite Section - Horizontal Carousel with Purple Styling */}
          {eliteProfiles.length > 0 && (
            <section className="relative py-8 bg-gradient-to-b from-purple-950/20 via-black to-black border-b border-purple-500/20">
              {/* Decorative glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-purple-500/10 blur-3xl pointer-events-none"></div>

              <div className="flex items-center gap-4 mb-6 px-6">
                <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent flex-1"></div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200 uppercase tracking-[0.2em] text-sm font-black bg-black/50 px-4 py-1.5 rounded-full border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  👑 Elite ({eliteProfiles.length})
                </span>
                <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent flex-1"></div>
              </div>

              {/* Horizontal scroll for Elite profiles */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent pb-4">
                <div className="flex gap-4 px-6 min-w-max">
                  {visibleEliteProfiles.map(profile => (
                    <div key={profile.id} className="w-[280px] flex-shrink-0">
                      <ProfileCard profile={profile} />
                    </div>
                  ))}
                </div>
              </div>

              {eliteProfiles.length > ELITE_VISIBLE && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => router.push('/search?tier=elite')}
                    className="px-6 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 text-xs font-bold uppercase tracking-widest transition-all rounded"
                  >
                    {t('view_all')} Elite ({eliteProfiles.length})
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Premium Section - Gold Styled Grid */}
          {premiumProfiles.length > 0 && (
            <>
              <div className="flex items-center gap-4 mb-6 px-6 pt-6">
                <div className="h-px bg-gradient-to-r from-transparent via-luxury-gold/50 to-transparent flex-1 opacity-30"></div>
                <span className="text-gold-gradient uppercase tracking-[0.2em] text-sm font-black shadow-gold-glow bg-black/50 px-4 py-1 rounded-full border border-luxury-gold/30">
                  ⭐ Premium ({premiumProfiles.length})
                </span>
                <div className="h-px bg-gradient-to-r from-transparent via-luxury-gold/50 to-transparent flex-1 opacity-30"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-0.5 border-y border-white/5 bg-white/5 w-full">
                {visiblePremiumProfiles.map(profile => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>

              {hasMorePremium && (
                <div className="text-center py-6">
                  <button
                    onClick={() => setPremiumVisible(prev => prev + PREMIUM_LOAD_MORE)}
                    className="px-8 py-3 bg-luxury-gold/10 hover:bg-luxury-gold/20 border border-luxury-gold/30 hover:border-luxury-gold/50 text-luxury-gold text-xs font-bold uppercase tracking-widest transition-all rounded"
                  >
                    {t('load_more')} ({premiumProfiles.length - premiumVisible} {t('remaining')})
                  </button>
                </div>
              )}
            </>
          )}

          {/* Free Profiles Section */}
          {freeProfiles.length > 0 && (
            <>
              <div className="flex items-center gap-4 mb-6 px-6 mt-6">
                <div className="h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent flex-1"></div>
                <span className="text-neutral-500 uppercase tracking-[0.2em] text-sm font-bold bg-black/50 px-4 py-1 rounded-full border border-neutral-800">
                  {t('new_title')} ({freeProfiles.length})
                </span>
                <div className="h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent flex-1"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-0.5 border-y border-white/5 bg-white/5 w-full">
                {visibleFreeProfiles.map(profile => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>

              {hasMoreFree && (
                <div className="text-center py-6">
                  <button
                    onClick={() => setFreeVisible(prev => prev + FREE_LOAD_MORE)}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-neutral-700 hover:border-neutral-600 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-all rounded"
                  >
                    {t('load_more')} ({freeProfiles.length - freeVisible} {t('remaining')})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Agencies Section */}
      {agencies.length > 0 && (
        <section className="py-16 bg-neutral-900/30 border-y border-white/5 mb-16 relative overflow-hidden">
          <div className="absolute -left-20 top-0 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -right-20 bottom-0 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-[1920px] mx-auto w-full px-0 relative z-10">
            <div className="flex items-center gap-6 mb-10 justify-center">
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-24"></div>
              <h2 className="font-serif text-3xl text-white uppercase tracking-widest">{t('agencies_title')}</h2>
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-24"></div>
            </div>

            <div className="flex flex-wrap justify-center gap-0.5 bg-white/5 border-y border-white/5 w-full">
              {agencies.map(agency => (
                <div key={agency.id} className="w-full sm:w-[calc(50%-2px)] lg:w-[calc(25%-2px)] 2xl:w-[calc(20%-2px)] min-[1920px]:w-[calc(16.666%-2px)]">
                  <AgencyCard agency={agency} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* View All Button */}
      <div className="text-center pb-16">
        <button
          onClick={() => router.push('/search')}
          className="px-10 py-4 border border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold-gradient hover:text-black transition-all uppercase tracking-[0.2em] text-sm font-bold shadow-[0_0_20px_rgba(212,175,55,0.1)] hover:shadow-gold-glow"
        >
          {t('view_all')}
        </button>
      </div>

      {/* SEO Content Section */}
      <section className="bg-neutral-950 border-t border-white/5 py-16">
        <div className="max-w-5xl mx-auto px-6">
          {/* Main SEO Title */}
          <h2 className="font-serif text-2xl md:text-3xl text-white mb-6 text-center">
            {t('seo_title')}
          </h2>

          {/* Intro Text */}
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-10 text-center max-w-3xl mx-auto">
            {t('seo_intro')}
          </p>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-white/5 rounded border border-white/10">
              <Shield className="w-8 h-8 text-luxury-gold mx-auto mb-4" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">{t('seo_why_title')}</h3>
              <p className="text-neutral-500 text-xs leading-relaxed">{t('seo_why_text')}</p>
            </div>
            <div className="text-center p-6 bg-white/5 rounded border border-white/10">
              <Clock className="w-8 h-8 text-luxury-gold mx-auto mb-4" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">{t('seo_services_title')}</h3>
              <p className="text-neutral-500 text-xs leading-relaxed">{t('seo_services_text')}</p>
            </div>
            <div className="text-center p-6 bg-white/5 rounded border border-white/10">
              <MapPin className="w-8 h-8 text-luxury-gold mx-auto mb-4" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">{t('seo_districts_title')}</h3>
              <p className="text-neutral-500 text-xs leading-relaxed">{t('seo_districts_text')}</p>
            </div>
          </div>

          {/* District Links */}
          <div className="mb-12">
            <h3 className="text-luxury-gold text-sm font-bold uppercase tracking-widest mb-4 text-center">{t('districts_title')}</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {['Mitte', 'Charlottenburg', 'Prenzlauer Berg', 'Kreuzberg', 'Friedrichshain', 'Schöneberg', 'Neukölln', 'Steglitz'].map((district) => (
                <Link
                  key={district}
                  href={`/search?district=${district}`}
                  className="px-4 py-2 bg-white/5 hover:bg-luxury-gold/20 border border-white/10 hover:border-luxury-gold/50 rounded text-neutral-400 hover:text-white text-xs transition-all"
                >
                  {t('escort_prefix')} {district}
                </Link>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="border-t border-white/10 pt-12">
            <h3 className="font-serif text-xl text-white mb-8 text-center">{t('faq_title')}</h3>
            <div className="space-y-4 max-w-3xl mx-auto">
              <FAQItem question={t('faq_1_q')} answer={t('faq_1_a')} />
              <FAQItem question={t('faq_2_q')} answer={t('faq_2_a')} />
              <FAQItem question={t('faq_3_q')} answer={t('faq_3_a')} />
              <FAQItem question={t('faq_4_q')} answer={t('faq_4_a')} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// FAQ Accordion Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left bg-white/5 hover:bg-white/10 transition-colors"
      >
        <span className="text-white text-sm font-medium pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-luxury-gold flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 bg-neutral-900/50">
          <p className="text-neutral-400 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
