'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Phone, MapPin, CheckCircle2, ChevronLeft, ChevronRight, Home, Car, RefreshCw } from 'lucide-react';
import { Profile, isProfileActive, isProfileNew } from '@/lib/types';
import { Badge } from './ui/Badge';

interface ProfileCardProps {
  profile: Profile;
}

// Default placeholder for profiles without images
const PLACEHOLDER_IMAGE = 'https://ui-avatars.com/api/?name=V&background=1a1a1a&color=d4af37&size=400&font-size=0.5';

export function ProfileCard({ profile }: ProfileCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const t = useTranslations('card');
  const visitT = useTranslations('visit');

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
            <div className="absolute bottom-24 left-0 w-full flex justify-center gap-1.5 z-40 opacity-0 group-hover:opacity-100 transition-all duration-500">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 w-1 rounded-full shadow-sm transition-all ${idx === currentImageIndex ? 'bg-luxury-gold w-3' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Available Status */}
        {isAvailableNow && (
          <div className="absolute top-3 right-3 z-30 pointer-events-none">
            <div className="inline-flex items-center gap-1.5 bg-black/60 border border-green-500/30 rounded px-2 py-1 backdrop-blur-md shadow-lg">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              <span className="text-[9px] font-bold text-white uppercase tracking-wider leading-none">{t('available')}</span>
            </div>
          </div>
        )}

        {/* Unavailable Status */}
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

        {/* Badges */}
        <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5 items-start pointer-events-none">
          {profile.isVelvetChoice && <Badge type="choice" />}
          {isTop && <Badge type="top" />}
          {profile.isPremium && <Badge type="premium" />}
          {showNewBadge && <Badge type="new" />}
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-24 right-4 z-30 flex flex-col items-end pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-sm flex items-baseline gap-1 shadow-lg group-hover:border-luxury-gold/30 transition-colors">
            <span className="text-luxury-gold font-sans font-bold text-lg leading-none">
              {profile.priceStart}€
            </span>
            <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider leading-none">
              /h
            </span>
          </div>
        </div>

        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-4 z-30 flex flex-col justify-end pointer-events-none">
          <div className="mb-4 transition-transform duration-300 group-hover:-translate-y-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-serif text-2xl text-white font-medium tracking-tight drop-shadow-md">
                {profile.name}
              </h3>
              {profile.isVerified && <CheckCircle2 size={16} className="text-blue-400 fill-blue-400/10" />}
            </div>

            <div className="flex items-center gap-3 text-neutral-400 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-luxury-gold" />
                <span className="uppercase tracking-widest">{profile.district}</span>
              </div>
              {profile.visitType && (
                <div className="flex items-center gap-1 text-neutral-500">
                  {profile.visitType === 'incall' && <Home size={10} />}
                  {profile.visitType === 'outcall' && <Car size={10} />}
                  {profile.visitType === 'both' && <RefreshCw size={10} />}
                  <span className="text-[9px] uppercase tracking-wider">{visitT(profile.visitType)}</span>
                </div>
              )}
            </div>
          </div>

          <button className="w-full pointer-events-auto backdrop-blur-sm bg-white/5 hover:bg-luxury-gold border border-white/20 hover:border-luxury-gold text-white hover:text-black font-bold py-3 uppercase tracking-[0.2em] text-[10px] transition-all duration-300 flex items-center justify-center gap-2 rounded-sm group/btn">
            <Phone size={14} className="group-hover/btn:fill-black" />
            {t('call_now')}
          </button>
        </div>
      </Link>
    </div>
  );
}
