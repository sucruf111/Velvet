'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  MapPin, ShieldCheck, Crown, Star, Heart, CheckCircle2, Calendar,
  ArrowRight, Building2, X, ChevronLeft, ChevronRight, Maximize2,
  MessageCircle, Send, Smartphone, Clock, Home, Car, RefreshCw
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Profile, Agency, ServiceType, isProfileActive, isProfileNew } from '@/lib/types';

interface ProfileDetailClientProps {
  profile: Profile;
  agency?: Agency | null;
}

const StatItem: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-2">{label}</span>
    <span className="text-xl font-serif text-white font-medium">{value}</span>
  </div>
);

export function ProfileDetailClient({ profile, agency }: ProfileDetailClientProps) {
  const t = useTranslations();
  const [activeImage, setActiveImage] = useState<string>(profile.images[0] || '');
  const [showPhone, setShowPhone] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const trackContact = () => {
    if (profile?.id) {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, type: 'contact' })
      }).catch(() => {
        // Silently ignore tracking errors
      });
    }
  };

  const isTop = profile.clicks > 2000;
  const isUnavailable = profile.isOnline === false;
  const isAvailableNow = profile.isOnline !== false && isProfileActive(profile);
  const showNewBadge = isProfileNew(profile);

  useEffect(() => {
    if (profile) setActiveImage(profile.images[0]);
    window.scrollTo(0, 0);

    // Track profile view
    if (profile?.id) {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, type: 'view' })
      }).catch(() => {
        // Silently ignore tracking errors
      });
    }
  }, [profile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [lightboxIndex]);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null && profile) {
      setLightboxIndex((prev) => (prev !== null ? (prev + 1) % profile.images.length : 0));
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null && profile) {
      setLightboxIndex((prev) => (prev !== null ? (prev - 1 + profile.images.length) % profile.images.length : 0));
    }
  };

  const groupServices = (services: ServiceType[]) => {
    const categories: Record<string, ServiceType[]> = {
      'Essentials': [ServiceType.INCALL, ServiceType.OUTCALL, ServiceType.ESCORT, ServiceType.DINNER, ServiceType.OVERNIGHT, ServiceType.TRAVEL],
      'Intimacy & Kissing': [ServiceType.KISS, ServiceType.TONGUE_KISS, ServiceType.FRENCH_KISSING, ServiceType.GFE, ServiceType.POS_69, ServiceType.COUPLE, ServiceType.MMF, ServiceType.FFM],
      'Oral & Finish': [ServiceType.BJ_NATURAL, ServiceType.BJ_NATURAL_EXTRA, ServiceType.BJ_CONDOM, ServiceType.SWALLOW, ServiceType.DEEP_THROAT, ServiceType.CIM, ServiceType.COB, ServiceType.COF],
      'Massage & Wellness': [ServiceType.MASSAGE, ServiceType.PROSTATE_MASSAGE, ServiceType.BODY_TO_BODY],
      'Special & Kink': [ServiceType.BDSM, ServiceType.BDSM_LIGHT, ServiceType.DEVOTE, ServiceType.DOMINANT, ServiceType.ROLEPLAY, ServiceType.STRIPTEASE, ServiceType.SPANISH, ServiceType.ANAL, ServiceType.RIMMING, ServiceType.GOLDEN_SHOWER_ACTIVE, ServiceType.GOLDEN_SHOWER_PASSIVE, ServiceType.KINKY]
    };

    const grouped: Record<string, string[]> = {};

    Object.entries(categories).forEach(([catName, catServices]) => {
      const matched = services.filter(s => catServices.includes(s));
      if (matched.length > 0) {
        grouped[catName] = matched;
      }
    });

    const allCategorized = Object.values(categories).flat();
    const remaining = services.filter(s => !allCategorized.includes(s));
    if (remaining.length > 0) {
      grouped['Additional Services'] = remaining;
    }

    return grouped;
  };

  const serviceGroups = groupServices(profile.services);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getLanguageFlag = (lang: string) => {
    const map: Record<string, string> = {
      'Deutsch': '\u{1F1E9}\u{1F1EA}',
      'English': '\u{1F1FA}\u{1F1F8}',
      'Russian': '\u{1F1F7}\u{1F1FA}',
      'Spanish': '\u{1F1EA}\u{1F1F8}',
      'French': '\u{1F1EB}\u{1F1F7}',
      'Italian': '\u{1F1EE}\u{1F1F9}',
    };
    return map[lang] || '\u{1F310}';
  };

  return (
    <>
      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white/50 hover:text-luxury-gold transition-colors z-[110]"
          >
            <X size={32} strokeWidth={1} />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-2 md:left-8 text-white/50 hover:text-luxury-gold transition-colors z-[110] p-2 md:p-4 hidden md:block"
          >
            <ChevronLeft size={48} strokeWidth={1} />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-2 md:right-8 text-white/50 hover:text-luxury-gold transition-colors z-[110] p-2 md:p-4 hidden md:block"
          >
            <ChevronRight size={48} strokeWidth={1} />
          </button>

          <div className="relative flex items-center justify-center pointer-events-none w-full h-full">
            <img
              src={profile.images[lightboxIndex]}
              alt={profile.name}
              className="max-h-[85vh] max-w-full md:max-w-5xl object-contain shadow-2xl pointer-events-auto select-none rounded-sm border border-white/10 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/70 font-sans text-xs md:text-sm tracking-widest uppercase bg-black/50 px-4 py-2 rounded-full backdrop-blur-md whitespace-nowrap">
              Image {lightboxIndex + 1} / {profile.images.length}
            </div>
          </div>
        </div>
      )}

      <div className="animate-fade-in pb-20 bg-luxury-black text-luxury-gray relative">
        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs uppercase tracking-widest text-neutral-500 border-b border-neutral-900 mb-0 flex items-center">
          <Link href="/" className="hover:text-luxury-gold transition-colors">{t('profile.back_home')}</Link>
          <span className="mx-2">/</span>
          <Link href="/search" className="hover:text-luxury-gold transition-colors">{t('profile.back_escorts')}</Link>
          <span className="mx-2">/</span>
          <span className="text-luxury-gold font-bold">{profile.name}</span>
        </div>

        {/* In-Page Navigation */}
        <div className="sticky top-20 z-40 bg-luxury-black/95 backdrop-blur border-b border-neutral-900 mb-8 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-8 overflow-x-auto py-4 text-xs font-bold uppercase tracking-[0.2em] scrollbar-hide">
              <button onClick={() => scrollToSection('about')} className="text-white hover:text-luxury-gold shrink-0 transition-colors">{t('profile.about')}</button>
              <button onClick={() => scrollToSection('services')} className="text-neutral-400 hover:text-luxury-gold shrink-0 transition-colors">{t('profile.services')}</button>
              {profile.showSchedule && (
                <button onClick={() => scrollToSection('schedule')} className="text-neutral-400 hover:text-luxury-gold shrink-0 transition-colors">{t('profile.schedule')}</button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Left Column: Sticky Gallery */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-40 self-start transition-all duration-300">
            <div
              onClick={() => openLightbox(profile.images.findIndex(img => img === activeImage) !== -1 ? profile.images.findIndex(img => img === activeImage) : 0)}
              className="aspect-[3/4] w-full relative overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl rounded-sm group cursor-zoom-in"
            >
              {activeImage && (
                <img
                  src={activeImage}
                  alt={profile.name}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
                <span className="text-4xl font-serif font-black text-white/30 -rotate-45 whitespace-nowrap tracking-widest scale-150 select-none drop-shadow-lg">
                  VELVET BERLIN
                </span>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-50 group-hover:scale-100">
                <div className="bg-black/40 backdrop-blur-sm p-4 rounded-full border border-white/20">
                  <Maximize2 className="text-white" size={32} />
                </div>
              </div>

              {profile.isVerified && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-blue-600/90 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-lg rounded-sm backdrop-blur-md z-20">
                  <ShieldCheck size={14} className="text-white" /> {t('profile.verified_content')}
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {profile.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-[3/4] overflow-hidden border-2 transition-all rounded-sm relative ${activeImage === img ? 'border-luxury-gold opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Info */}
          <div className="lg:col-span-7 flex flex-col h-full">

            {/* Header Badges */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {isUnavailable && (
                <div className="inline-flex items-center gap-2 bg-black/80 border border-neutral-600 px-4 py-1.5 rounded-sm backdrop-blur-md shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-500"></span>
                  </span>
                  <span className="text-[11px] font-black tracking-[0.2em] text-neutral-400 uppercase">{t('card.unavailable')}</span>
                </div>
              )}
              {isAvailableNow && (
                <div className="inline-flex items-center gap-2 bg-black/80 border border-green-500/50 px-4 py-1.5 rounded-sm backdrop-blur-md shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[11px] font-black tracking-[0.2em] text-white uppercase">{t('card.available')}</span>
                </div>
              )}
              {profile.isVelvetChoice && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-neutral-900 to-black border border-luxury-gold px-4 py-1.5 rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  <Crown size={14} className="text-luxury-gold fill-luxury-gold" />
                  <span className="text-[10px] font-black tracking-[0.2em] text-luxury-gold uppercase">{t('badge.choice')}</span>
                </div>
              )}
              {isTop && <Badge type="top" />}
              {profile.isPremium && <Badge type="premium" />}
              {showNewBadge && <Badge type="new" />}
            </div>

            {/* Name & Location */}
            <div className="mb-6 border-b border-neutral-900 pb-6">
              <div className="flex justify-between items-start">
                <h1 className="font-serif text-6xl lg:text-7xl text-white mb-2 leading-none tracking-tight">
                  {profile.name}
                </h1>
                <button className="group p-3 border border-neutral-800 rounded-full hover:border-luxury-gold transition-all">
                  <Heart size={28} className="text-neutral-500 group-hover:text-luxury-gold transition-all" />
                </button>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-luxury-gold" strokeWidth={2.5} />
                  <span className="uppercase tracking-[0.2em] text-xs font-bold text-luxury-gold">
                    {profile.district}, Berlin
                  </span>
                </div>
                {profile.visitType && (
                  <div className="flex items-center gap-2 text-neutral-400 border-l border-neutral-700 pl-4">
                    {profile.visitType === 'incall' && <Home size={14} className="text-luxury-gold" />}
                    {profile.visitType === 'outcall' && <Car size={14} className="text-luxury-gold" />}
                    {profile.visitType === 'both' && <RefreshCw size={14} className="text-luxury-gold" />}
                    <span className="uppercase tracking-[0.2em] text-xs font-bold">{t(`visit.${profile.visitType}`)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Agency Link */}
            {agency && (
              <Link href={`/agency/${agency.id}`} className="group flex items-center gap-4 bg-neutral-900/50 border border-neutral-800 p-4 mb-8 hover:border-luxury-gold transition-colors rounded-sm">
                <div className="w-12 h-12 rounded-full border border-neutral-700 overflow-hidden shrink-0">
                  <img src={agency.logo} alt={agency.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1 flex items-center gap-2">
                    <Building2 size={10} /> {t('profile.represented_by')}
                  </div>
                  <div className="text-white font-serif text-lg group-hover:text-luxury-gold transition-colors">{agency.name}</div>
                </div>
                <div className="ml-auto">
                  <ArrowRight className="text-neutral-600 group-hover:text-luxury-gold transition-colors" size={18} />
                </div>
              </Link>
            )}

            {/* Stats Bar */}
            <div className="w-full bg-black/40 border border-neutral-800 rounded-sm p-6 mb-10">
              <div className="flex flex-wrap justify-between gap-y-6 items-end">
                <div className="flex gap-8 md:gap-12">
                  <StatItem label={t('attr.age')} value={profile.age} />
                  <StatItem label={t('attr.height')} value={`${profile.height} cm`} />
                  <StatItem label={t('attr.dress')} value={profile.dressSize} />
                  <StatItem label={t('attr.bra')} value={profile.braSize} />
                  <StatItem label={t('attr.shoe')} value={profile.shoeSize} />
                </div>

                <div className="text-right pl-4 border-l border-neutral-800">
                  <div className="text-4xl font-sans font-bold text-luxury-gold leading-none tracking-tight drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                    {profile.priceStart}€
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold mt-2">
                    {t('attr.hourly_rate')}
                  </div>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="mb-10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-3">{t('profile.languages')}</p>
              <div className="flex flex-wrap gap-3">
                {profile.languages.map(lang => (
                  <span key={lang} className="px-5 py-2 border border-neutral-700 hover:border-luxury-gold text-white text-sm font-serif tracking-wide rounded-sm bg-neutral-900 shadow-md flex items-center gap-2 transition-all">
                    <span className="text-xl leading-none">{getLanguageFlag(lang)}</span>
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-12 mb-12">
              {/* About Section */}
              <div id="about" className="prose prose-invert max-w-none scroll-mt-40">
                <h3 className="font-serif text-3xl text-white mb-6 flex items-center gap-3 border-b border-neutral-800 pb-4">
                  <Star size={24} className="text-luxury-gold" strokeWidth={1} /> {t('profile.about')}
                </h3>
                <p className="font-serif text-lg leading-relaxed text-neutral-300 whitespace-pre-line">
                  {profile.description.replace(/<[^>]*>/g, '')}
                </p>
              </div>

              {/* Services Section */}
              <div id="services" className="scroll-mt-40">
                <h3 className="font-serif text-3xl text-white mb-8 flex items-center gap-3 border-b border-neutral-800 pb-4">
                  <Heart size={24} className="text-luxury-gold" strokeWidth={1} /> {t('profile.services')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {Object.entries(serviceGroups).map(([groupName, services]) => (
                    <div key={groupName}>
                      <h4 className="text-luxury-gold text-xs uppercase tracking-[0.2em] font-black mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full"></span>
                        {groupName}
                      </h4>
                      <ul className="space-y-1.5">
                        {services.map(service => (
                          <li key={service} className="flex items-start gap-3 group">
                            <CheckCircle2 size={16} className="text-luxury-gold mt-0.5 flex-shrink-0 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                            <span className="text-sm font-bold text-white tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]">{service}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule Section */}
              {profile.showSchedule && (
                <div id="schedule" className="scroll-mt-40">
                  <h3 className="font-serif text-3xl text-white mb-8 flex items-center gap-3 border-b border-neutral-800 pb-4">
                    <Calendar size={24} className="text-luxury-gold" strokeWidth={1} /> {t('profile.schedule')}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                      <div key={day} className="bg-neutral-900/50 border border-neutral-800 p-3 rounded-sm text-center">
                        <div className="text-luxury-gold text-xs font-bold uppercase tracking-widest mb-1">{day}</div>
                        <div className={`text-xs ${profile.availability[idx]?.toLowerCase().includes('off') ? 'text-neutral-600' : 'text-white'}`}>
                          {profile.availability[idx] ? profile.availability[idx].split(': ')[1] : t('profile.on_request')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Buttons */}
            <div className="mt-auto pt-8 border-t border-neutral-800">
              {isUnavailable ? (
                <div className="fixed bottom-0 left-0 w-full p-4 bg-black/95 backdrop-blur-xl border-t border-neutral-700 z-50 lg:relative lg:p-0 lg:bg-transparent lg:border-none lg:backdrop-blur-none">
                  <div className="flex flex-col gap-3 max-w-7xl mx-auto lg:mx-0">
                    <div className="w-full bg-neutral-800/50 border border-neutral-700 text-neutral-400 font-bold py-4 px-6 uppercase tracking-[0.15em] text-sm flex items-center justify-center gap-3 rounded-sm cursor-not-allowed">
                      <Clock size={20} strokeWidth={2.5} />
                      <span>{t('card.unavailable')} - Check back later</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="fixed bottom-0 left-0 w-full p-4 bg-black/95 backdrop-blur-xl border-t border-luxury-gold/20 z-50 lg:relative lg:p-0 lg:bg-transparent lg:border-none lg:backdrop-blur-none">
                    <div className="flex flex-col md:flex-row gap-3 max-w-7xl mx-auto lg:mx-0">
                      {profile.phone && (
                        <button
                          onClick={() => {
                            if (!showPhone) trackContact();
                            setShowPhone(!showPhone);
                          }}
                          className="w-full md:w-auto md:flex-1 bg-luxury-gold-gradient hover:bg-luxury-gold-gradient-hover text-black font-black py-4 px-6 uppercase tracking-[0.15em] text-sm transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] rounded-sm order-1"
                        >
                          <Smartphone strokeWidth={2.5} size={20} />
                          <span>{showPhone ? profile.phone : 'SHOW NUMBER'}</span>
                        </button>
                      )}

                      {(profile.whatsapp || profile.telegram) && (
                        <div className="flex gap-3 w-full md:w-auto md:flex-initial order-2">
                          {profile.whatsapp && (
                            <a
                              href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 md:flex-none"
                              onClick={trackContact}
                            >
                              <button className="w-full md:w-auto md:px-8 h-full border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-black transition-all font-black tracking-widest text-xs md:text-sm py-4 flex items-center justify-center gap-2 rounded-sm bg-[#25D366]/5 hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] uppercase">
                                <MessageCircle size={20} strokeWidth={2.5} />
                                <span>WhatsApp</span>
                              </button>
                            </a>
                          )}

                          {profile.telegram && (
                            <a
                              href={`https://t.me/${profile.telegram.replace('@', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 md:flex-none"
                              onClick={trackContact}
                            >
                              <button className="w-full md:w-auto md:px-8 h-full border border-[#0088cc] text-[#0088cc] hover:bg-[#0088cc] hover:text-white transition-all font-black tracking-widest text-xs md:text-sm py-4 flex items-center justify-center gap-2 rounded-sm bg-[#0088cc]/5 hover:shadow-[0_0_20px_rgba(0,136,204,0.4)] uppercase">
                                <Send size={20} strokeWidth={2.5} />
                                <span>Telegram</span>
                              </button>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-center text-[10px] uppercase tracking-widest text-neutral-500 mt-3 lg:hidden">
                      {t('profile.mention')} <span className="text-luxury-gold">Velvet Berlin</span>
                    </p>
                  </div>

                  <p className="text-center md:text-left text-xs uppercase tracking-widest text-neutral-500 mt-4 hidden lg:block">
                    {t('profile.mention')} <span className="text-luxury-gold font-bold">Velvet Berlin</span> {t('profile.when_contacting')} {profile.name}
                  </p>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
