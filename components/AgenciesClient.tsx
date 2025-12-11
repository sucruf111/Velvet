'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Agency, AgencyTier } from '@/lib/types';
import { AgencyCard } from './AgencyCard';
import { MapPin, Building2, Filter } from 'lucide-react';

interface AgenciesClientProps {
  agencies: Agency[];
}

// Sort agencies by tier (paid first, then free, then none)
function sortAgenciesByTier(agencies: Agency[]): Agency[] {
  const tierPriority: Record<AgencyTier, number> = {
    pro: 3,
    starter: 2,
    free: 1,
    none: 0,
  };

  return [...agencies].sort((a, b) => {
    const aTier = tierPriority[a.subscriptionTier || 'none'];
    const bTier = tierPriority[b.subscriptionTier || 'none'];
    if (aTier !== bTier) return bTier - aTier;
    return a.name.localeCompare(b.name);
  });
}

export function AgenciesClient({ agencies }: AgenciesClientProps) {
  const t = useTranslations('agencies');
  const tSearch = useTranslations('search');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique districts from agencies
  const districts = useMemo(() => {
    const uniqueDistricts = new Set<string>();
    agencies.forEach((agency) => {
      if (agency.district) {
        uniqueDistricts.add(agency.district);
      }
    });
    return Array.from(uniqueDistricts).sort();
  }, [agencies]);

  // Filter and sort agencies
  const filteredAgencies = useMemo(() => {
    let result = agencies;

    // Filter by district
    if (selectedDistrict !== 'all') {
      result = result.filter((agency) => agency.district === selectedDistrict);
    }

    // Sort by tier (paid first)
    return sortAgenciesByTier(result);
  }, [agencies, selectedDistrict]);

  return (
    <div className="min-h-screen bg-luxury-black pt-24 pb-16">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 size={32} className="text-luxury-gold" />
            <h1 className="font-serif text-4xl md:text-5xl text-white tracking-wide">
              {t('title')}
            </h1>
          </div>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <span className="text-white font-semibold">{filteredAgencies.length}</span>
            <span>{t('all_agencies')}</span>
          </div>

          {/* District Filter */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300 hover:border-luxury-gold/50 transition-colors"
            >
              <Filter size={16} />
              {tSearch('filters')}
            </button>

            <div className={`${showFilters ? 'flex' : 'hidden'} md:flex items-center gap-2`}>
              <MapPin size={16} className="text-luxury-gold" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:border-luxury-gold outline-none cursor-pointer hover:border-neutral-700 transition-colors"
              >
                <option value="all">{tSearch('all_districts')}</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Agencies Grid */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        {filteredAgencies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredAgencies.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 size={48} className="text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500 text-lg">{t('no_agencies')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
