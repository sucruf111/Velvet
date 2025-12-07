'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Profile, Agency, ServiceType } from '@/lib/types';
import { ProfileCard } from './ProfileCard';
import { AgencyCard } from './AgencyCard';
import { LuxuryBackground } from './LuxuryBackground';

interface HomeClientProps {
  premiumProfiles: Profile[];
  standardProfiles: Profile[];
  agencies: Agency[];
  counts: {
    total: number;
    outcall: number;
    incall: number;
    massage: number;
    districts: Record<string, number>;
  };
}

export function HomeClient({ premiumProfiles, standardProfiles, agencies, counts }: HomeClientProps) {
  const router = useRouter();
  const t = useTranslations('home');

  return (
    <div className="animate-fade-in bg-luxury-black min-h-screen">
      {/* Hero Section */}
      <section className="relative -mt-28 pt-32 pb-20 px-4 overflow-hidden min-h-[85vh] flex flex-col justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <LuxuryBackground />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Minimal elegant divider */}
          <div className="flex items-center justify-center gap-4 mb-8 opacity-60">
            <div className="w-12 h-px bg-luxury-gold/40"></div>
            <div className="w-1 h-1 rounded-full bg-luxury-gold"></div>
            <div className="w-12 h-px bg-luxury-gold/40"></div>
          </div>

          {/* Subtitle */}
          <p className="text-luxury-gold/80 text-xs md:text-sm mb-8 tracking-[0.35em] uppercase font-medium">
            {t('subtitle')}
          </p>

          {/* Main Title - Clean and Elegant */}
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-10 tracking-wide leading-tight">
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
          <div className="w-16 h-px bg-luxury-gold/30 mx-auto mb-12"></div>

          {/* Filter Cloud */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-5xl mx-auto">
            <button
              onClick={() => router.push('/search')}
              className="group relative px-6 py-3 rounded-full bg-luxury-gold-gradient text-black font-black text-sm md:text-base border border-white/20 hover:scale-105 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              {t('filter_all')} ({counts.total})
            </button>

            <button
              onClick={() => router.push(`/search?service=${ServiceType.OUTCALL}`)}
              className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white font-medium border border-neutral-700 hover:border-luxury-gold hover:text-luxury-gold hover:bg-black/50 transition-all shadow-lg"
            >
              {t('filter_outcall')} ({counts.outcall})
            </button>

            <button
              onClick={() => router.push(`/search?service=${ServiceType.INCALL}`)}
              className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white font-medium border border-neutral-700 hover:border-luxury-gold hover:text-luxury-gold hover:bg-black/50 transition-all shadow-lg"
            >
              {t('filter_incall')} ({counts.incall})
            </button>

            <button
              onClick={() => router.push(`/search?service=${ServiceType.MASSAGE}`)}
              className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white font-medium border border-neutral-700 hover:border-luxury-gold hover:text-luxury-gold hover:bg-black/50 transition-all shadow-lg"
            >
              {t('filter_massage')} ({counts.massage})
            </button>

            {/* District Filters */}
            {Object.entries(counts.districts).map(([district, count]) => (
              <button
                key={district}
                onClick={() => router.push(`/search?district=${district}`)}
                className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-neutral-300 font-medium border border-neutral-700 hover:border-luxury-gold hover:text-luxury-gold hover:bg-black/50 transition-all shadow-lg"
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
          {/* Premium Section */}
          {premiumProfiles.length > 0 && (
            <>
              <div className="flex items-center gap-6 mb-10 px-6 pt-10">
                <div className="h-px bg-gradient-to-r from-transparent via-luxury-gold/50 to-transparent flex-1 opacity-30"></div>
                <span className="text-gold-gradient uppercase tracking-[0.2em] text-sm font-black shadow-gold-glow bg-black/50 px-4 py-1 rounded-full border border-luxury-gold/30">
                  {t('premium_title')}
                </span>
                <div className="h-px bg-gradient-to-r from-transparent via-luxury-gold/50 to-transparent flex-1 opacity-30"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-0.5 mb-16 border-y border-white/5 bg-white/5 w-full">
                {premiumProfiles.map(profile => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            </>
          )}

          {/* Standard Section */}
          {standardProfiles.length > 0 && (
            <>
              <div className="flex items-center gap-6 mb-10 px-6">
                <div className="h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent flex-1"></div>
                <span className="text-neutral-500 uppercase tracking-[0.2em] text-sm font-bold bg-black/50 px-4 py-1 rounded-full border border-neutral-800">
                  {t('new_title')}
                </span>
                <div className="h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent flex-1"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-0.5 border-y border-white/5 bg-white/5 w-full">
                {standardProfiles.map(profile => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
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
      <div className="text-center pb-24">
        <button
          onClick={() => router.push('/search')}
          className="px-10 py-4 border border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold-gradient hover:text-black transition-all uppercase tracking-[0.2em] text-sm font-bold shadow-[0_0_20px_rgba(212,175,55,0.1)] hover:shadow-gold-glow"
        >
          {t('view_all')}
        </button>
      </div>
    </div>
  );
}
