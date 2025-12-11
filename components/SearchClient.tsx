'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { X, SlidersHorizontal } from 'lucide-react';
import { ProfileCard } from './ProfileCard';
import { Button, Input, Select, EmptySearchResults } from './ui';
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

  // Count active filters for badge
  const activeFilterCount = [
    searchTerm,
    selectedDistrict,
    serviceFilter,
    isNewFilter,
    tierFilter,
    maxPrice < 10000
  ].filter(Boolean).length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <Button onClick={() => setIsFilterOpen(true)} fullWidth variant="outline">
            <SlidersHorizontal size={16} className="mr-2" />
            {t('search.filters')}
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-luxury-gold text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Mobile Filter Overlay */}
        {isFilterOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}>
            <div
              className="absolute right-0 top-0 h-full w-full max-w-sm bg-neutral-900 border-l border-neutral-800 overflow-y-auto animate-in slide-in-from-right duration-300"
              onClick={e => e.stopPropagation()}
            >
              {/* Mobile Filter Header */}
              <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center z-10">
                <h3 className="font-serif text-xl text-white">{t('search.filters')}</h3>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 hover:bg-neutral-800 rounded-md transition-colors"
                >
                  <X size={20} className="text-neutral-400" />
                </button>
              </div>

              {/* Mobile Filter Content */}
              <div className="p-4 space-y-6 pb-24">
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
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">{t('search.special')}</label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isNewFilter}
                      onChange={e => setIsNewFilter(e.target.checked)}
                      className="form-checkbox h-5 w-5 text-luxury-gold bg-neutral-800 border-neutral-600 rounded focus:ring-luxury-gold focus:ring-offset-neutral-900 accent-luxury-gold"
                    />
                    <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{t('badge.new')}</span>
                  </label>
                </div>

                {/* Tier Filter */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">{t('search.status')}</label>
                  <Select
                    value={tierFilter}
                    onChange={e => setTierFilter(e.target.value)}
                  >
                    <option value="">{t('search.all_profiles')}</option>
                    <option value="premium">⭐ {t('search.premium_elite')}</option>
                    <option value="elite">👑 {t('search.elite_only')}</option>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    {t('search.max_price')}: <span className="text-luxury-gold font-bold">{maxPrice}€</span> / hr
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

                <button
                  onClick={resetFilters}
                  className="w-full py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  {t('search.reset')}
                </button>
              </div>

              {/* Fixed Bottom Apply Button */}
              <div className="fixed bottom-0 left-0 right-0 max-w-sm ml-auto p-4 bg-neutral-900 border-t border-neutral-800">
                <Button onClick={() => setIsFilterOpen(false)} fullWidth>
                  {t('search.showing')} {filteredProfiles.length} {t('search.profiles')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:w-1/4 xl:w-1/5">
          <div className="sticky top-24 space-y-6 bg-neutral-900/50 p-6 border border-neutral-800 backdrop-blur-sm rounded-sm">

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
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">{t('search.special')}</label>
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
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">{t('search.status')}</label>
              <Select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
              >
                <option value="">{t('search.all_profiles')}</option>
                <option value="premium">⭐ {t('search.premium_elite')}</option>
                <option value="elite">👑 {t('search.elite_only')}</option>
              </Select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                {t('search.max_price')}: <span className="text-luxury-gold font-bold">{maxPrice}€</span> / hr
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
              {selectedDistrict ? `${selectedDistrict} ${t('search.escorts')}` : t('search.all_districts')}
              {serviceFilter && <span className="text-luxury-gold mx-2">• {serviceFilter}</span>}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-sm font-sans text-neutral-500 font-normal tracking-wide">
                {t('search.showing')} {filteredProfiles.length} {t('search.profiles')}
              </span>
              {isNewFilter && <span className="text-[10px] uppercase font-bold bg-gradient-to-r from-red-600 to-pink-600 text-white px-2 py-0.5 rounded-sm">{t('badge.new')}</span>}
              {tierFilter === 'premium' && <span className="text-[10px] uppercase font-bold bg-luxury-gold-gradient text-black px-2 py-0.5 rounded-sm">⭐ Premium+</span>}
              {tierFilter === 'elite' && <span className="text-[10px] uppercase font-bold bg-gradient-to-r from-purple-600 to-purple-400 text-white px-2 py-0.5 rounded-sm">👑 Elite</span>}
            </div>
          </div>

          {filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <EmptySearchResults onAction={resetFilters} actionLabel={t('search.clear')} />
          )}
        </div>
      </div>
    </div>
  );
}
