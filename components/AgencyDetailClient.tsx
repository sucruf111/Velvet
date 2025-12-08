'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Send,
  CheckCircle2,
  Star,
  Users
} from 'lucide-react';
import { Agency, Profile } from '@/lib/types';
import { ProfileCard } from './ProfileCard';

interface AgencyDetailClientProps {
  agency: Agency;
  profiles: Profile[];
}

export function AgencyDetailClient({ agency, profiles }: AgencyDetailClientProps) {
  const t = useTranslations('agency');
  const commonT = useTranslations('common');
  const profileT = useTranslations('profile');

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
        {agency.banner ? (
          <img
            src={agency.banner}
            alt={agency.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

        {/* Back Button */}
        <Link
          href="/search"
          className="absolute top-6 left-6 z-10 flex items-center gap-2 text-white/80 hover:text-luxury-gold transition-colors bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">{profileT('back_escorts')}</span>
        </Link>
      </div>

      {/* Agency Info Section */}
      <div className="relative -mt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
            {/* Agency Header */}
            <div className="p-6 md:p-8 border-b border-white/5">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Logo */}
                <div className="flex-shrink-0">
                  {agency.logo ? (
                    <img
                      src={agency.logo}
                      alt={agency.name}
                      className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg border border-white/10"
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-luxury-gold/20 to-luxury-gold/5 rounded-lg border border-luxury-gold/20 flex items-center justify-center">
                      <Users size={40} className="text-luxury-gold/60" />
                    </div>
                  )}
                </div>

                {/* Agency Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-serif text-white">
                      {agency.name}
                    </h1>
                    {agency.isFeatured && (
                      <CheckCircle2 size={24} className="text-blue-400 fill-blue-400/10" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-neutral-400 mb-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-luxury-gold" />
                      <span>{agency.district}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={16} className="text-luxury-gold" />
                      <span>{profiles.length} {t('models')}</span>
                    </div>
                    {agency.reviews && agency.reviews.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Star size={16} className="text-luxury-gold fill-luxury-gold" />
                        <span>{agency.reviews.length} {t('reviews')}</span>
                      </div>
                    )}
                  </div>

                  {agency.description && (
                    <p className="text-neutral-300 leading-relaxed max-w-3xl">
                      {agency.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-6 md:p-8 bg-neutral-900/50">
              <h2 className="text-lg font-medium text-white mb-4">{t('contact')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {agency.phone && (
                  <a
                    href={`tel:${agency.phone}`}
                    className="flex items-center gap-3 bg-neutral-800/50 border border-white/5 hover:border-luxury-gold/30 rounded-lg p-4 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Phone size={18} className="text-green-400" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">{t('phone')}</div>
                      <div className="text-white group-hover:text-luxury-gold transition-colors">{agency.phone}</div>
                    </div>
                  </a>
                )}

                {agency.email && (
                  <a
                    href={`mailto:${agency.email}`}
                    className="flex items-center gap-3 bg-neutral-800/50 border border-white/5 hover:border-luxury-gold/30 rounded-lg p-4 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Mail size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">{t('email')}</div>
                      <div className="text-white group-hover:text-luxury-gold transition-colors truncate max-w-[180px]">{agency.email}</div>
                    </div>
                  </a>
                )}

                {agency.whatsapp && (
                  <a
                    href={`https://wa.me/${agency.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-neutral-800/50 border border-white/5 hover:border-luxury-gold/30 rounded-lg p-4 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <MessageCircle size={18} className="text-green-400" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">WhatsApp</div>
                      <div className="text-white group-hover:text-luxury-gold transition-colors">{agency.whatsapp}</div>
                    </div>
                  </a>
                )}

                {agency.telegram && (
                  <a
                    href={`https://t.me/${agency.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-neutral-800/50 border border-white/5 hover:border-luxury-gold/30 rounded-lg p-4 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Send size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">Telegram</div>
                      <div className="text-white group-hover:text-luxury-gold transition-colors">{agency.telegram}</div>
                    </div>
                  </a>
                )}

                {agency.website && (
                  <a
                    href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-neutral-800/50 border border-white/5 hover:border-luxury-gold/30 rounded-lg p-4 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Globe size={18} className="text-purple-400" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">{t('website')}</div>
                      <div className="text-white group-hover:text-luxury-gold transition-colors truncate max-w-[180px]">
                        {agency.website.replace(/^https?:\/\//, '')}
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Agency Models */}
          {profiles.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif text-white">
                  {t('our_models')}
                </h2>
                <span className="text-neutral-500 text-sm">
                  {profiles.length} {profiles.length === 1 ? t('model') : t('models')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {profiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            </div>
          )}

          {/* No Models Message */}
          {profiles.length === 0 && (
            <div className="mt-12 text-center py-16 bg-neutral-900/50 border border-white/5 rounded-lg">
              <Users size={48} className="mx-auto text-neutral-600 mb-4" />
              <p className="text-neutral-400">{t('no_models')}</p>
            </div>
          )}

          {/* Reviews Section */}
          {agency.reviews && agency.reviews.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-serif text-white mb-6">
                {t('reviews')} ({agency.reviews.length})
              </h2>

              <div className="space-y-4">
                {agency.reviews.map((review, index) => (
                  <div
                    key={index}
                    className="bg-neutral-900/50 border border-white/5 rounded-lg p-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < review.rating ? 'text-luxury-gold fill-luxury-gold' : 'text-neutral-700'}
                          />
                        ))}
                      </div>
                      <span className="text-neutral-500 text-sm">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-neutral-300">{review.text}</p>
                    <div className="mt-3 text-sm text-neutral-500">
                      — {review.author || commonT('anonymous')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
