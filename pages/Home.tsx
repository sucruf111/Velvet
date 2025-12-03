
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { ProfileCard } from '../components/ProfileCard';
import { AgencyCard } from '../components/AgencyCard';
import { LuxuryBackground } from '../components/LuxuryBackground';
import { District, ServiceType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/UI';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profiles, agencies, isLoading } = useData();

  // Calculate counts dynamically
  const totalCount = profiles.length;
  const outcallCount = profiles.filter(p => p.services.includes(ServiceType.OUTCALL)).length;
  const massageCount = profiles.filter(p => p.services.includes(ServiceType.MASSAGE)).length;
  
  // Count profiles per district
  const districtCounts = Object.values(District).reduce((acc, dist) => {
    const count = profiles.filter(p => p.district === dist).length;
    if (count > 0) acc[dist] = count;
    return acc;
  }, {} as Record<string, number>);

  const premiumProfiles = profiles.filter(p => p.isPremium);
  const standardProfiles = profiles.filter(p => !p.isPremium);

  return (
    <div className="animate-fade-in bg-luxury-black min-h-screen">
      {/* Hero Section with Innovative Liquid Gold Background */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden min-h-[600px] flex flex-col justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 bg-[#050505]">
             <LuxuryBackground />
             {/* Vignette Overlay for Text Readability */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_90%)] z-10"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/30 via-transparent to-luxury-black z-10"></div>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto text-center">
          <p className="text-luxury-gold text-sm md:text-base mb-6 tracking-[0.3em] uppercase font-bold animate-fade-in opacity-80">
            Velvet Berlin — {t('home.subtitle')}
          </p>
          
          <h1 className="font-serif text-5xl md:text-7xl lg:text-9xl text-white mb-10 tracking-tight leading-none drop-shadow-2xl">
            {t('home.title_prefix')} <span className="text-transparent bg-clip-text bg-luxury-gold-gradient italic pr-2 animate-shimmer bg-[length:200%_auto]">{t('home.title_highlight')}</span> {t('home.title_suffix')}
          </h1>

          {/* Filter Cloud */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-5xl mx-auto">
            {/* All Berlin - Active State - Metallic Gradient */}
            <button 
              onClick={() => navigate('/search')} 
              className="group relative px-6 py-3 rounded-full bg-luxury-gold-gradient text-black font-black text-sm md:text-base border border-white/20 hover:scale-105 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              {t('home.filter_all')} ({totalCount})
            </button>

            {/* Service Filters */}
            <button 
              onClick={() => navigate(`/search?service=${ServiceType.OUTCALL}`)} 
              className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white font-medium border border-neutral-700 hover:border-luxury-gold hover:text-luxury-gold hover:bg-black/50 transition-all shadow-lg"
            >
              {t('home.filter_outcall')} ({outcallCount})
            </button>
            
            <button 
              onClick={() => navigate(`/search?service=${ServiceType.MASSAGE}`)} 
              className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-white font-medium border border-neutral-700 hover:border-luxury-gold hover:text-luxury-gold hover:bg-black/50 transition-all shadow-lg"
            >
              {t('home.filter_massage')} ({massageCount})
            </button>

            {/* District Filters */}
            {Object.entries(districtCounts).map(([district, count]) => (
              <button 
                key={district} 
                onClick={() => navigate(`/search?district=${district}`)} 
                className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-md text-neutral-300 font-medium border border-neutral-700 hover:border-luxury-gold hover:text-luxury-gold hover:bg-black/50 transition-all shadow-lg"
              >
                {district} ({count})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading State */}
      {isLoading ? (
        <div className="w-full h-60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin"></div>
                <p className="text-luxury-gold text-xs uppercase tracking-widest animate-pulse">Loading Velvet Database...</p>
            </div>
        </div>
      ) : (
        <>
            {/* Model Grid Section */}
            <div className="w-full px-0 pb-12 bg-luxury-black relative z-20">
                
                {/* Centered Container for Grids */}
                <div className="max-w-[1920px] mx-auto w-full">
                    
                    {/* Premium Section */}
                    {premiumProfiles.length > 0 && (
                        <>
                            <div className="flex items-center gap-6 mb-10 px-6 pt-10">
                                <div className="h-px bg-gradient-to-r from-transparent via-luxury-gold/50 to-transparent flex-1 opacity-30"></div>
                                <span className="text-gold-gradient uppercase tracking-[0.2em] text-sm font-black shadow-gold-glow bg-black/50 px-4 py-1 rounded-full border border-luxury-gold/30">{t('home.premium_title')}</span>
                                <div className="h-px bg-gradient-to-r from-transparent via-luxury-gold/50 to-transparent flex-1 opacity-30"></div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-0.5 mb-16 border-y border-white/5 bg-white/5 w-full">
                                {premiumProfiles.map(profile => (
                                    <ProfileCard key={profile.id} profile={profile} />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Standard/New Section */}
                    {standardProfiles.length > 0 && (
                        <>
                            <div className="flex items-center gap-6 mb-10 px-6">
                                <div className="h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent flex-1"></div>
                                <span className="text-neutral-500 uppercase tracking-[0.2em] text-sm font-bold bg-black/50 px-4 py-1 rounded-full border border-neutral-800">{t('home.new_title')}</span>
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
            <section className="py-16 bg-neutral-900/30 border-y border-white/5 mb-16 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -left-20 top-0 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -right-20 bottom-0 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-[1920px] mx-auto w-full px-0 relative z-10">
                    <div className="flex items-center gap-6 mb-10 justify-center">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-24"></div>
                    <h2 className="font-serif text-3xl text-white uppercase tracking-widest">{t('home.agencies_title')}</h2>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-24"></div>
                    </div>
                    
                    {/* Flex container with centered items */}
                    <div className="flex flex-wrap justify-center gap-0.5 bg-white/5 border-y border-white/5 w-full">
                    {agencies.map(agency => (
                        <div key={agency.id} className="w-full sm:w-[calc(50%-2px)] lg:w-[calc(25%-2px)] 2xl:w-[calc(20%-2px)] min-[1920px]:w-[calc(16.666%-2px)]">
                        <AgencyCard agency={agency} />
                        </div>
                    ))}
                    </div>
                </div>
            </section>
        </>
      )}

      <div className="text-center pb-24">
           <button 
             onClick={() => navigate('/search')} 
             className="px-10 py-4 border border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold-gradient hover:text-black transition-all uppercase tracking-[0.2em] text-sm font-bold shadow-[0_0_20px_rgba(212,175,55,0.1)] hover:shadow-gold-glow"
           >
             {t('home.view_all')}
           </button>
      </div>
    </div>
  );
};
