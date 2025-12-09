'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Phone, MapPin, CheckCircle2, ChevronLeft, ChevronRight, Home, Car, Clock } from 'lucide-react';
import { Profile, isProfileActive, isProfileNew } from '@/lib/types';
import { Badge } from './ui/Badge';

// Format last active time in a human-readable way
function formatLastActive(lastActive: string | undefined, t: (key: string) => string): string {
  if (!lastActive) return t('never');

  const lastDate = new Date(lastActive);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 5) return t('just_now');
  if (diffMins < 60) return t('mins_ago').replace('{n}', String(diffMins));
  if (diffHours < 24) return t('hours_ago').replace('{n}', String(diffHours));
  if (diffDays === 1) return t('yesterday');
  if (diffDays < 7) return t('days_ago').replace('{n}', String(diffDays));
  if (diffDays < 30) return t('weeks_ago').replace('{n}', String(Math.floor(diffDays / 7)));

  return t('over_month');
}

interface ProfileCardProps {
  profile: Profile;
}

// Default placeholder for profiles without images
const PLACEHOLDER_IMAGE = 'https://ui-avatars.com/api/?name=V&background=1a1a1a&color=d4af37&size=400&font-size=0.5';

export function ProfileCard({ profile }: ProfileCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const t = useTranslations('card');
  const visitT = useTranslations('visit');
  const timeT = useTranslations('time');

  // Use placeholder if no images
  const images = profile.images && profile.images.length > 0
    ? profile.images
    : [PLACEHOLDER_IMAGE];

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const isTop = profile.clicks > 2000;
  const isUnavailable = profile.isOnline === false;
  const isAvailableNow = profile.isOnline !== false && isProfileActive(profile);
  const showNewBadge = isProfileNew(profile);

  // Check visit types
  const hasIncall = profile.visitType === 'incall' || profile.visitType === 'both';
  const hasOutcall = profile.visitType === 'outcall' || profile.visitType === 'both';

  return (
    <div className="group relative w-full bg-neutral-900 border border-white/5 hover:border-luxury-gold/50 transition-all duration-500 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] overflow-hidden rounded-sm">
      <Link href={`/profile/${profile.id}`} className="block relative aspect-[3/4] overflow-hidden bg-neutral-950">
        <img
          src={images[currentImageIndex]}
          alt={profile.name}
          className={`w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 ${isUnavailable ? 'opacity-40 grayscale' : 'opacity-90 group-hover:opacity-100'}`}
          loading="lazy"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-40 bg-black/20 hover:bg-luxury-gold/90 hover:text-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] border border-white/10"
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-40 bg-black/20 hover:bg-luxury-gold/90 hover:text-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] border border-white/10"
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-28 left-0 w-full flex justify-center gap-1.5 z-40 opacity-0 group-hover:opacity-100 transition-all duration-500">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 w-1 rounded-full shadow-sm transition-all ${idx === currentImageIndex ? 'bg-luxury-gold w-3' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Top Row: Badges Left, Status Right */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 flex justify-between items-start pointer-events-none">
          {/* Left: Quality Badges - horizontal compact */}
          <div className="flex flex-wrap gap-1 max-w-[70%]">
            {profile.isVelvetChoice && <Badge type="choice" />}
            {isTop && <Badge type="top" />}
            {profile.isPremium && <Badge type="premium" />}
            {showNewBadge && <Badge type="new" />}
          </div>

          {/* Right: Availability Status */}
          <div className="flex-shrink-0">
            {isAvailableNow && (
              <div className="inline-flex items-center gap-1.5 bg-black/60 border border-green-500/30 rounded px-2 py-1 backdrop-blur-md shadow-lg">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                <span className="text-[9px] font-bold text-white uppercase tracking-wider leading-none">{t('available')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Unavailable Overlay */}
        {isUnavailable && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="bg-black/80 border border-neutral-600 rounded px-4 py-2 backdrop-blur-sm shadow-lg">
              <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">{t('unavailable')}</span>
            </div>
          </div>
        )}

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
          <span className="text-3xl font-serif font-black text-white/5 -rotate-45 whitespace-nowrap tracking-[0.5em] scale-150 select-none">
            VELVET
          </span>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500 z-20"></div>
        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent z-20"></div>

        {/* Price Tag */}
        <div className="absolute bottom-28 right-3 z-30 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-sm flex items-baseline gap-0.5 shadow-lg group-hover:border-luxury-gold/30 transition-colors">
            <span className="text-luxury-gold font-sans font-bold text-base leading-none">
              {profile.priceStart}€
            </span>
            <span className="text-[9px] text-neutral-400 font-medium uppercase leading-none">
              /h
            </span>
          </div>
        </div>

        {/* Info Overlay at Bottom */}
        <div className="absolute bottom-0 left-0 w-full p-3 z-30 flex flex-col justify-end pointer-events-none">
          <div className="mb-3 transition-transform duration-300 group-hover:-translate-y-0.5">
            {/* Name Row */}
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-serif text-xl text-white font-medium tracking-tight drop-shadow-md truncate">
                {profile.name}
              </h3>
              {profile.isVerified && <CheckCircle2 size={14} className="text-blue-400 fill-blue-400/10 flex-shrink-0" />}
            </div>

            {/* Location & Visit Type Row */}
            <div className="flex items-center gap-2 text-neutral-400 text-[11px] font-medium">
              <div className="flex items-center gap-1">
                <MapPin size={11} className="text-luxury-gold" />
                <span className="uppercase tracking-wider">{profile.district}</span>
              </div>

              {/* Visit Type Icons */}
              {profile.visitType && (
                <div className="flex items-center gap-1.5 text-neutral-500 border-l border-neutral-700 pl-2">
                  {hasIncall && (
                    <div className="flex items-center gap-1" title={visitT('incall')}>
                      <Home size={11} className="text-neutral-400" />
                    </div>
                  )}
                  {hasOutcall && (
                    <div className="flex items-center gap-1" title={visitT('outcall')}>
                      <Car size={11} className="text-neutral-400" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Last Active - only when not available */}
            {!isAvailableNow && profile.lastActive && (
              <div className="flex items-center gap-1 text-neutral-500 text-[10px] mt-1">
                <Clock size={9} />
                <span>{formatLastActive(profile.lastActive, timeT)}</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button className="w-full pointer-events-auto backdrop-blur-sm bg-white/5 hover:bg-luxury-gold border border-white/20 hover:border-luxury-gold text-white hover:text-black font-bold py-2.5 uppercase tracking-[0.15em] text-[10px] transition-all duration-300 flex items-center justify-center gap-2 rounded-sm group/btn">
            <Phone size={13} className="group-hover/btn:fill-black" />
            {t('call_now')}
          </button>
        </div>
      </Link>
    </div>
  );
}
