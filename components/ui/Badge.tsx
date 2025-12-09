'use client';

import { useTranslations } from 'next-intl';

interface BadgeProps {
  type: 'premium' | 'elite' | 'new' | 'verified' | 'top' | 'choice';
}

export function Badge({ type }: BadgeProps) {
  const t = useTranslations('badge');

  const styles = {
    premium: 'bg-luxury-gold-gradient text-black',
    elite: 'bg-gradient-to-r from-purple-600 to-purple-400 text-white',
    new: 'bg-green-500 text-white',
    verified: 'bg-blue-500 text-white',
    top: 'bg-red-500 text-white',
    choice: 'bg-purple-600 text-white'
  };

  const labels: Record<string, string> = {
    premium: t('premium'),
    elite: t('elite'),
    new: t('new'),
    verified: t('verified'),
    top: t('top'),
    choice: t('choice'),
  };

  return (
    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded ${styles[type]}`}>
      {type === 'premium' ? `⭐ ${t('premium')}` : type === 'elite' ? `👑 ${t('elite')}` : labels[type] || t(type)}
    </span>
  );
}
