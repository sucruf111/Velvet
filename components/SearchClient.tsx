'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import { ProfileCard } from './ProfileCard';
import { Button, Input, Select } from './ui';
import { Profile, District, ServiceType, isProfileNew, isProfileBoosted } from '@/lib/types';
import { getSearchPriority } from '@/lib/packages';

interface SearchClientProps {
  profiles: Profile[];
}

export function SearchClient({ profiles }: SearchClientProps) {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Initialize filters from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || '');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [serviceFilter, setServiceFilter] = useState<string>(searchParams.get('service') || '');
  const [isNewFilter, setIsNewFilter] = useState(searchParams.get('isNew') === 'true');
  const [tierFilter, setTierFilter] = useState<string>(searchParams.get('tier') || ''); // '', 'premium', 'elite'

  // Track which profiles have already been tracked in this session
  const trackedProfilesRef = useRef<Set<string>>(new Set());

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      if (profile.isDisabled) return false;

      const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            profile.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDistrict = selectedDistrict ? profile.district === selectedDistrict : true;
      const matchesPrice = profile.priceStart <= maxPrice;
      const matchesService = serviceFilter ? profile.services.includes(serviceFilter as ServiceType) : true;
      const matchesNew = isNewFilter ? isProfileNew(profile) : true;
      // Tier filter: if 'premium' selected, show premium and elite; if 'elite' selected, show only elite
      const matchesTier = !tierFilter ? true :
        tierFilter === 'elite' ? profile.tier === 'elite' :
        (profile.tier === 'premium' || profile.tier === 'elite');

      return matchesSearch && matchesDistrict && matchesPrice && matchesService && matchesNew && matchesTier;
    }).sort((a, b) => {
      // 1. Unavailable profiles go to the bottom
      const aUnavailable = a.isOnline === false;
      const bUnavailable = b.isOnline === false;
      if (aUnavailable && !bUnavailable) return 1;
      if (!aUnavailable && bUnavailable) return -1;

      // 2. Sort by tier priority (Elite boosted > Elite > Premium boosted > Premium > Free)
      const priorityA = getSearchPriority(a.tier || 'free', isProfileBoosted(a));
      const priorityB = getSearchPriority(b.tier || 'free', isProfileBoosted(b));
      if (priorityB !== priorityA) return priorityB - priorityA;

      // 3. Within same priority, sort by lastActive (most recent first)
      const dateA = new Date(a.lastActive || 0).getTime();
      const dateB = new Date(b.lastActive || 0).getTime();
      return dateB - dateA;
    });
  }, [profiles, searchTerm, selectedDistrict, maxPrice, serviceFilter, isNewFilter, tierFilter]);

  // Track search appearances for displayed profiles (debounced)
  useEffect(() => {
    if (filteredProfiles.length === 0) return;

    // Find profiles that haven't been tracked yet in this session
    const newProfilesToTrack = filteredProfiles
      .filter(p => !trackedProfilesRef.current.has(p.id))
      .map(p => p.id);

    if (newProfilesToTrack.length === 0) return;

    // Mark as tracked immediately to prevent duplicate tracking
    newProfilesToTrack.forEach(id => trackedProfilesRef.current.add(id));

    // Debounce the API call to batch tracking
    const timeoutId = setTimeout(() => {
      fetch('/api/track-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileIds: newProfilesToTrack, type: 'search' })
      }).catch(() => {
        // Silently ignore errors
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filteredProfiles]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDistrict('');
    setServiceFilter('');
    setIsNewFilter(false);
    setTierFilter('');
    setMaxPrice(10000);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <Button onClick={() => setIsFilterOpen(!isFilterOpen)} fullWidth variant="outline">
            <Filter size={16} className="mr-2 inline" /> {t('search.filters')}
          </Button>
        </div>

        {/* Sidebar Filters */}
        <aside className={`lg:w-1/4 xl:w-1/5 space-y-8 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-24 space-y-8 bg-neutral-900/50 p-6 border border-neutral-800 backdrop-blur-sm">

            <div className="flex justify-between items-center lg:hidden">
              <h3 className="font-serif text-xl">{t('search.filters')}</h3>
              <button onClick={() => setIsFilterOpen(false)}><X className="text-luxury-gold" /></button>
            </div>

            {/* Search */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">{t('nav.search_placeholder')}</label>
              <Input
                placeholder={t('search.keyword')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">{t('search.district')}</label>
              <Select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
              >
                <option value="">{t('search.all_districts')}</option>
                {Object.values(District).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </div>

            {/* Service */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">{t('search.service')}</label>
              <Select
                value={serviceFilter}
                onChange={e => setServiceFilter(e.target.value)}
              >
                <option value="">{t('search.any_service')}</option>
                {Object.values(ServiceType).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>

            {/* Special Filters */}
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">Special</label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isNewFilter}
                  onChange={e => setIsNewFilter(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-luxury-gold bg-neutral-800 border-neutral-600 rounded focus:ring-luxury-gold focus:ring-offset-neutral-900 accent-luxury-gold"
                />
                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{t('badge.new')}</span>
              </label>
            </div>

            {/* Tier Filter */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">Status</label>
              <Select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
              >
                <option value="">{t('search.all_profiles') || 'Alle Profile'}</option>
                <option value="premium">⭐ Premium & Elite</option>
                <option value="elite">👑 Elite</option>
              </Select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                {t('search.max_price')}: {maxPrice}€ / hr
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-luxury-gold"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>100€</span>
                <span>1000€+</span>
              </div>
            </div>

            <Button onClick={resetFilters} variant="ghost" fullWidth>
              {t('search.reset')}
            </Button>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="font-serif text-3xl text-white">
              {selectedDistrict ? `${selectedDistrict} Escorts` : t('search.all_districts')}
              {serviceFilter && <span className="text-luxury-gold mx-2">• {serviceFilter}</span>}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-sans text-neutral-500 font-normal tracking-wide">
                {t('search.showing')} {filteredProfiles.length} {t('search.profiles')}
              </span>
              {isNewFilter && <span className="text-[10px] uppercase font-bold bg-gradient-to-r from-red-600 to-pink-600 text-white px-2 py-0.5 rounded-sm">{t('badge.new')}</span>}
              {tierFilter === 'premium' && <span className="text-[10px] uppercase font-bold bg-luxury-gold-gradient text-black px-2 py-0.5 rounded-sm">⭐ Premium+</span>}
              {tierFilter === 'elite' && <span className="text-[10px] uppercase font-bold bg-gradient-to-r from-purple-600 to-purple-400 text-white px-2 py-0.5 rounded-sm">👑 Elite</span>}
            </div>
          </div>

          {filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-neutral-800 bg-neutral-900/30">
              <p className="text-neutral-400">{t('search.no_results')}</p>
              <Button
                variant="ghost"
                className="mt-4"
                onClick={resetFilters}
              >
                {t('search.clear')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
