'use client';

import { useTranslations } from 'next-intl';

interface BadgeProps {
  type: 'premium' | 'new' | 'verified' | 'top' | 'choice';
}

export function Badge({ type }: BadgeProps) {
  const t = useTranslations('badge');

  const styles = {
    premium: 'bg-luxury-gold-gradient text-black',
    new: 'bg-green-500 text-white',
    verified: 'bg-blue-500 text-white',
    top: 'bg-red-500 text-white',
    choice: 'bg-purple-600 text-white'
  };

  return (
    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${styles[type]}`}>
      {t(type)}
    </span>
  );
}
