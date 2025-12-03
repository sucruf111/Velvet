
import React, { useState, useMemo, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ProfileCard } from '../components/ProfileCard';
import { Button, Input, Select } from '../components/UI';
import { District, ServiceType } from '../types';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export const SearchPage: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { profiles } = useData();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [isNewFilter, setIsNewFilter] = useState(false);
  const [isPremiumFilter, setIsPremiumFilter] = useState(false);

  // Sync state with URL params whenever location changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setSearchTerm(queryParams.get('q') || '');
    setSelectedDistrict(queryParams.get('district') || '');
    setServiceFilter(queryParams.get('service') || '');
    setIsNewFilter(queryParams.get('isNew') === 'true');
    setIsPremiumFilter(queryParams.get('isPremium') === 'true');
  }, [location.search]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            profile.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDistrict = selectedDistrict ? profile.district === selectedDistrict : true;
      const matchesPrice = profile.priceStart <= maxPrice;
      const matchesService = serviceFilter ? profile.services.includes(serviceFilter as ServiceType) : true;
      const matchesNew = isNewFilter ? profile.isNew : true;
      const matchesPremium = isPremiumFilter ? profile.isPremium : true;

      return matchesSearch && matchesDistrict && matchesPrice && matchesService && matchesNew && matchesPremium;
    }).sort((a, b) => (Number(b.isPremium) - Number(a.isPremium))); // Premium first
  }, [profiles, searchTerm, selectedDistrict, maxPrice, serviceFilter, isNewFilter, isPremiumFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDistrict('');
    setServiceFilter('');
    setIsNewFilter(false);
    setIsPremiumFilter(false);
    setMaxPrice(1000);
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
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isPremiumFilter}
                  onChange={e => setIsPremiumFilter(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-luxury-gold bg-neutral-800 border-neutral-600 rounded focus:ring-luxury-gold focus:ring-offset-neutral-900 accent-luxury-gold"
                />
                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{t('badge.premium')}</span>
              </label>
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
                 {isPremiumFilter && <span className="text-[10px] uppercase font-bold bg-luxury-gold-gradient text-black px-2 py-0.5 rounded-sm">{t('badge.premium')}</span>}
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
};
