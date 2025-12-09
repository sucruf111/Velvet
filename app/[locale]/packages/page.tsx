'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, Star, Zap, Shield, Clock, Users, TrendingUp, ArrowRight, Sparkles, Crown, Award } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { getModelPackages, getAgencyPackages, Package } from '@/lib/packages';

// Animated Counter Component
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

// Floating Particle Component
function FloatingParticle({ delay, size, left, top }: { delay: number; size: number; left: string; top: string }) {
  return (
    <div
      className="absolute rounded-full bg-luxury-gold/20 animate-float"
      style={{
        width: size,
        height: size,
        left,
        top,
        animationDelay: `${delay}s`,
        filter: 'blur(1px)',
      }}
    />
  );
}

export default function PackagesPage() {
  const t = useTranslations('packages');
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'model' | 'agency'>('model');
  const [isVisible, setIsVisible] = useState(false);
  const [profileCount, setProfileCount] = useState<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
    // Fetch real profile count
    fetch('/api/public/stats')
      .then(res => res.json())
      .then(data => setProfileCount(data.activeProfiles))
      .catch(() => setProfileCount(0));
  }, []);

  const displayedPackages = activeTab === 'model' ? getModelPackages() : getAgencyPackages();

  // Helper to get translation key for package tier
  const getTierKey = (packageId: string): string => {
    const tierMap: Record<string, string> = {
      'model-free': 'free',
      'model-premium': 'premium',
      'model-elite': 'elite',
      'agency-starter': 'agency_starter',
      'agency-pro': 'agency_pro',
    };
    return tierMap[packageId] || 'free';
  };

  // Get translated highlights and features for a package
  const getTranslatedHighlights = (packageId: string): string[] => {
    const tierKey = getTierKey(packageId);
    try {
      return t.raw(`tiers.${tierKey}.highlights`) as string[];
    } catch {
      return [];
    }
  };

  const getTranslatedFeatures = (packageId: string): string[] => {
    const tierKey = getTierKey(packageId);
    try {
      return t.raw(`tiers.${tierKey}.features`) as string[];
    } catch {
      return [];
    }
  };

  const handleSelectPackage = (packageId: string) => {
    if (!user) {
      router.push(`/login?redirect=/checkout?package=${packageId}`);
      return;
    }
    router.push(`/checkout?package=${packageId}`);
  };

  const getPricePerDay = (pkg: Package) => {
    return (pkg.price / pkg.durationDays).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-luxury-black">
      {/* Hero Section with Incredible Animations */}
      <div className="relative pt-16 pb-12 overflow-hidden particles-bg">
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/8 via-luxury-gold/3 to-transparent animate-gradient"
             style={{ backgroundSize: '200% 200%' }} />

        {/* Large Floating Orbs */}
        <div className="absolute top-10 left-[5%] w-80 h-80 bg-luxury-gold/10 rounded-full blur-3xl animate-float opacity-60" />
        <div className="absolute top-32 right-[10%] w-96 h-96 bg-luxury-gold/8 rounded-full blur-3xl animate-float-delayed opacity-50" />
        <div className="absolute bottom-20 left-[30%] w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float-slow opacity-40" />

        {/* Floating Particles */}
        <FloatingParticle delay={0} size={8} left="15%" top="20%" />
        <FloatingParticle delay={0.5} size={6} left="85%" top="30%" />
        <FloatingParticle delay={1} size={10} left="25%" top="60%" />
        <FloatingParticle delay={1.5} size={5} left="75%" top="70%" />
        <FloatingParticle delay={2} size={7} left="45%" top="15%" />
        <FloatingParticle delay={2.5} size={9} left="65%" top="80%" />

        {/* Rotating Ring Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none opacity-10">
          <div className="absolute inset-0 border border-luxury-gold/30 rounded-full animate-rotate-slow" />
          <div className="absolute inset-8 border border-luxury-gold/20 rounded-full animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
          <div className="absolute inset-16 border border-dashed border-luxury-gold/10 rounded-full animate-rotate-slow" style={{ animationDuration: '40s' }} />
        </div>

        {/* Sparkle Effects */}
        <div className="absolute top-[20%] left-[20%] text-luxury-gold animate-sparkle">
          <Sparkles size={16} />
        </div>
        <div className="absolute top-[30%] right-[25%] text-luxury-gold animate-sparkle" style={{ animationDelay: '0.7s' }}>
          <Sparkles size={12} />
        </div>
        <div className="absolute bottom-[30%] left-[15%] text-luxury-gold animate-sparkle" style={{ animationDelay: '1.4s' }}>
          <Sparkles size={14} />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          {/* Trust Badge - Animated Entry */}
          <div className={`flex justify-center mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm backdrop-blur-sm hover:bg-green-500/20 transition-colors cursor-default group">
              <Shield size={16} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">{t('hero.trust_badge')}</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
          </div>

          {/* Main Heading - Shimmer Gold Text */}
          <div className={`transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-center mb-6 leading-tight">
              <span className="text-shimmer-gold">{t('hero.title')}</span>
            </h1>
          </div>

          {/* Subtitle - Fade In */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-xl text-neutral-400 text-center max-w-2xl mx-auto mb-12 leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Active Profiles Counter - Real Data */}
          {profileCount !== null && profileCount > 0 && (
            <div className={`flex justify-center mb-14 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="text-center group cursor-default">
                <div className="text-4xl md:text-5xl font-bold text-luxury-gold mb-1 group-hover:scale-110 transition-transform">
                  {isVisible && <AnimatedCounter target={profileCount} suffix="" />}
                </div>
                <div className="text-sm text-neutral-500 uppercase tracking-wider">{t('stats.active_profiles')}</div>
              </div>
            </div>
          )}

          {/* Tab Switcher - Premium Glass Effect */}
          <div className={`flex justify-center transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
            <div className="relative">
              {/* Glow Effect Behind */}
              <div className="absolute inset-0 bg-luxury-gold/20 blur-xl rounded-2xl animate-pulse-glow" />

              <div className="relative bg-neutral-900/80 backdrop-blur-xl p-2 rounded-xl inline-flex border border-neutral-700/50 shadow-2xl shadow-black/50">
                <button
                  onClick={() => setActiveTab('model')}
                  className={`relative flex items-center gap-3 px-8 py-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-500 ${
                    activeTab === 'model'
                      ? 'bg-gradient-to-r from-luxury-gold to-yellow-500 text-black shadow-lg shadow-luxury-gold/30 scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
                  }`}
                >
                  <Star size={20} className={activeTab === 'model' ? 'animate-pulse' : ''} />
                  {t('tabs.for_models')}
                  {activeTab === 'model' && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('agency')}
                  className={`relative flex items-center gap-3 px-8 py-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-500 ${
                    activeTab === 'agency'
                      ? 'bg-gradient-to-r from-luxury-gold to-yellow-500 text-black shadow-lg shadow-luxury-gold/30 scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
                  }`}
                >
                  <Users size={20} className={activeTab === 'agency' ? 'animate-pulse' : ''} />
                  {t('tabs.for_agencies')}
                  {activeTab === 'agency' && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className={`flex justify-center mt-12 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col items-center gap-2 text-neutral-500 animate-bounce">
              <span className="text-xs uppercase tracking-widest">Scroll</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-luxury-gold">
                <path d="M10 4V16M10 16L4 10M10 16L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className={`grid gap-6 ${displayedPackages.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-4xl mx-auto'}`}>
          {displayedPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                pkg.isPopular
                  ? 'bg-gradient-to-b from-luxury-gold/10 to-neutral-900 border-2 border-luxury-gold shadow-2xl shadow-luxury-gold/10 md:scale-105 md:z-10'
                  : pkg.isBestValue
                    ? 'bg-gradient-to-b from-purple-500/10 to-neutral-900 border border-purple-500/50'
                    : 'bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {/* Popular/Best Value Badge */}
              {pkg.isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-luxury-gold text-black text-center py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                  <Sparkles size={14} />
                  {t('badge.popular')}
                </div>
              )}
              {pkg.isBestValue && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-center py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                  <Crown size={14} />
                  {t('badge.best_value')}
                </div>
              )}

              <div className={`p-6 ${(pkg.isPopular || pkg.isBestValue) ? 'pt-12' : ''}`}>
                {/* Package Name */}
                <h3 className="font-serif text-2xl text-white mb-1">{pkg.name}</h3>
                <p className="text-neutral-500 text-sm mb-4">{pkg.durationDays} {t('days')}</p>

                {/* Price */}
                <div className="mb-6">
                  {pkg.originalPrice && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-neutral-500 line-through text-lg">{pkg.originalPrice}€</span>
                      <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold">
                        -{pkg.savings} {t('off')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">{pkg.price}</span>
                    <span className="text-2xl text-luxury-gold">€</span>
                  </div>
                  <p className="text-neutral-500 text-sm mt-1">
                    {t('price_per_day', { price: getPricePerDay(pkg) })}
                  </p>
                  {pkg.extraModelPrice && (
                    <p className="text-neutral-400 text-xs mt-2 flex items-center gap-1">
                      <Users size={12} />
                      +{pkg.extraModelPrice}€ {t('per_extra_model')}
                    </p>
                  )}
                </div>

                {/* Key Highlights - Visually Prominent */}
                <div className="bg-neutral-800/50 rounded-lg p-4 mb-6">
                  <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">{t('highlights')}</p>
                  <ul className="space-y-2">
                    {getTranslatedHighlights(pkg.id).map((highlight, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-white font-medium">
                        <div className="w-5 h-5 rounded-full bg-luxury-gold/20 flex items-center justify-center flex-shrink-0">
                          <Zap size={12} className="text-luxury-gold" />
                        </div>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* All Features */}
                <ul className="space-y-3 mb-8">
                  {getTranslatedFeatures(pkg.id).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-neutral-400">
                      <Check size={16} className="text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPackage(pkg.id)}
                  fullWidth
                  variant={pkg.isPopular ? 'primary' : 'outline'}
                  className={`py-4 text-base font-bold flex items-center justify-center gap-2 group ${
                    pkg.isPopular ? '' : 'hover:bg-luxury-gold hover:text-black hover:border-luxury-gold'
                  }`}
                >
                  {t('cta.get_started')}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Button>

                {/* Guarantee */}
                <p className="text-center text-neutral-600 text-xs mt-4 flex items-center justify-center gap-1">
                  <Shield size={12} />
                  {t('guarantee')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Value Propositions */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl text-white text-center mb-12">
          {t('why.title')}
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center">
              <TrendingUp size={28} className="text-luxury-gold" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{t('why.visibility.title')}</h3>
            <p className="text-neutral-500 text-sm">{t('why.visibility.desc')}</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center">
              <Users size={28} className="text-luxury-gold" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{t('why.clientele.title')}</h3>
            <p className="text-neutral-500 text-sm">{t('why.clientele.desc')}</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center">
              <Shield size={28} className="text-luxury-gold" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{t('why.privacy.title')}</h3>
            <p className="text-neutral-500 text-sm">{t('why.privacy.desc')}</p>
          </div>
        </div>
      </div>

      {/* Testimonials / Trust */}
      <div className="bg-neutral-900/30 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={24} className="text-luxury-gold fill-luxury-gold" />
            ))}
          </div>
          <blockquote className="text-xl text-white font-serif mb-6 italic">
            &ldquo;{t('testimonial.quote')}&rdquo;
          </blockquote>
          <div className="text-neutral-500">
            <span className="text-luxury-gold font-semibold">{t('testimonial.author')}</span>
            <span className="mx-2">—</span>
            <span>{t('testimonial.role')}</span>
          </div>
        </div>
      </div>

      {/* FAQ Teaser */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl text-white text-center mb-8">
          {t('faq.title')}
        </h2>

        <div className="space-y-4">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">{t('faq.q1')}</h3>
            <p className="text-neutral-400 text-sm">{t('faq.a1')}</p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">{t('faq.q2')}</h3>
            <p className="text-neutral-400 text-sm">{t('faq.a2')}</p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">{t('faq.q3')}</h3>
            <p className="text-neutral-400 text-sm">{t('faq.a3')}</p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-luxury-gold/20 via-luxury-gold/10 to-luxury-gold/20 border border-luxury-gold/30 rounded-xl p-8 md:p-12 text-center">
          <Award size={48} className="text-luxury-gold mx-auto mb-4" />
          <h2 className="font-serif text-3xl text-white mb-4">
            {t('final_cta.title')}
          </h2>
          <p className="text-neutral-400 mb-8 max-w-xl mx-auto">
            {t('final_cta.desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => handleSelectPackage(displayedPackages.find(p => p.isPopular)?.id || displayedPackages[0].id)}
              className="px-8 py-4 text-lg font-bold"
            >
              {t('final_cta.button')}
            </Button>
            <Link href="/register">
              <Button variant="outline" className="px-8 py-4 text-lg">
                {t('final_cta.register')}
              </Button>
            </Link>
          </div>
          <p className="text-neutral-600 text-sm mt-6 flex items-center justify-center gap-2">
            <Clock size={14} />
            {t('final_cta.urgency')}
          </p>
        </div>
      </div>
    </div>
  );
}
