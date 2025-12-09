'use client';

import { Link } from '@/i18n/routing';
import { MapPin } from 'lucide-react';
import { Agency } from '@/lib/types';
import { useTranslations } from 'next-intl';

interface AgencyCardProps {
  agency: Agency;
}

export function AgencyCard({ agency }: AgencyCardProps) {
  const t = useTranslations('badge');
  return (
    <Link
      href={`/agency/${agency.id}`}
      className="group block relative w-full aspect-[3/4] bg-neutral-900 border border-white/5 hover:border-luxury-gold/50 transition-all duration-500 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] overflow-hidden rounded-sm"
    >
      <img
        src={agency.image || agency.logo}
        alt={agency.name}
        className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100"
        loading="lazy"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500"></div>

      {/* Featured Badge */}
      {agency.isFeatured && (
        <div className="absolute top-3 left-3 z-30">
          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-luxury-gold-gradient text-black">
            {t('featured')}
          </span>
        </div>
      )}

      {/* Info */}
      <div className="absolute bottom-0 left-0 w-full p-4 z-30">
        <h3 className="font-serif text-xl text-white font-medium tracking-tight drop-shadow-md mb-1">
          {agency.name}
        </h3>
        <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
          <MapPin size={12} className="text-luxury-gold" />
          <span className="uppercase tracking-widest">{agency.district}</span>
        </div>
      </div>
    </Link>
  );
}
