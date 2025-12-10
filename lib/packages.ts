// Tier Types
export type ModelTier = 'free' | 'premium' | 'elite';
export type AgencyTier = 'none' | 'starter' | 'pro';

// Tier Limits Configuration
export interface TierLimits {
  photos: number;
  videos: number;
  services: number;
  contacts: number; // 1 = single contact only, Infinity = all
  schedule: boolean;
  statistics: boolean;
  advancedStatistics: boolean; // Traffic sources, hourly breakdown
  badge: 'premium' | 'elite' | null;
  searchPriority: number; // 0 = lowest, 1 = medium, 2 = highest
  homepage: 'carousel' | 'grid' | false;
  boostsPerMonth: number;
  onlineIndicator: boolean;
  verificationPriority: boolean;
}

export const TIER_LIMITS: Record<ModelTier, TierLimits> = {
  free: {
    photos: 1,
    videos: 0,
    services: 3,
    contacts: 1,
    schedule: false,
    statistics: false,
    advancedStatistics: false,
    badge: null,
    searchPriority: 0,
    homepage: false,
    boostsPerMonth: 0,
    onlineIndicator: false,
    verificationPriority: false,
  },
  premium: {
    photos: 5,
    videos: 1,
    services: Infinity,
    contacts: Infinity,
    schedule: true,
    statistics: true,
    advancedStatistics: false,
    badge: 'premium',
    searchPriority: 1,
    homepage: 'grid',
    boostsPerMonth: 2,
    onlineIndicator: false,
    verificationPriority: false,
  },
  elite: {
    photos: Infinity,
    videos: 3,
    services: Infinity,
    contacts: Infinity,
    schedule: true,
    statistics: true,
    advancedStatistics: true,
    badge: 'elite',
    searchPriority: 2,
    homepage: 'carousel',
    boostsPerMonth: Infinity,
    onlineIndicator: true,
    verificationPriority: true,
  },
};

// Agency Tier Limits - defines what features models under an agency get
export interface AgencyTierLimits {
  maxModels: number;
  photos: number;
  videos: number;
  services: number;
  schedule: boolean;
  statistics: boolean;
  advancedStatistics: boolean;
  badge: 'premium' | 'elite' | null;
  searchPriority: number;
  homepage: 'carousel' | 'grid' | false;
  boostsPerMonth: number;
  onlineIndicator: boolean;
}

export const AGENCY_TIER_LIMITS: Record<AgencyTier, AgencyTierLimits> = {
  none: {
    maxModels: 0,
    photos: 1,
    videos: 0,
    services: 3,
    schedule: false,
    statistics: false,
    advancedStatistics: false,
    badge: null,
    searchPriority: 0,
    homepage: false,
    boostsPerMonth: 0,
    onlineIndicator: false,
  },
  starter: {
    maxModels: 5,
    photos: 5,
    videos: 1,
    services: Infinity,
    schedule: true,
    statistics: true,
    advancedStatistics: false,
    badge: 'premium',
    searchPriority: 1,
    homepage: 'grid',
    boostsPerMonth: 2,
    onlineIndicator: false,
  },
  pro: {
    maxModels: 15,
    photos: Infinity,
    videos: 3,
    services: Infinity,
    schedule: true,
    statistics: true,
    advancedStatistics: true,
    badge: 'elite',
    searchPriority: 2,
    homepage: 'carousel',
    boostsPerMonth: Infinity,
    onlineIndicator: true,
  },
};

// Helper functions for agency tier limits
export function getAgencyTierLimits(tier: AgencyTier): AgencyTierLimits {
  return AGENCY_TIER_LIMITS[tier] || AGENCY_TIER_LIMITS.none;
}

export function getAgencyMaxModels(tier: AgencyTier): number {
  return getAgencyTierLimits(tier).maxModels;
}

export function getAgencyPhotoLimit(tier: AgencyTier): number {
  return getAgencyTierLimits(tier).photos;
}

export function getAgencyVideoLimit(tier: AgencyTier): number {
  return getAgencyTierLimits(tier).videos;
}

// Helper functions for tier limits
export function getTierLimits(tier: ModelTier): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function getPhotoLimit(tier: ModelTier): number {
  return getTierLimits(tier).photos;
}

export function getVideoLimit(tier: ModelTier): number {
  return getTierLimits(tier).videos;
}

export function getServiceLimit(tier: ModelTier): number {
  return getTierLimits(tier).services;
}

export function canUseSchedule(tier: ModelTier): boolean {
  return getTierLimits(tier).schedule;
}

export function canSeeStatistics(tier: ModelTier): boolean {
  return getTierLimits(tier).statistics;
}

export function canSeeAdvancedStatistics(tier: ModelTier): boolean {
  return getTierLimits(tier).advancedStatistics;
}

export function getSearchPriority(tier: ModelTier, isBoosted: boolean = false): number {
  const basePriority = getTierLimits(tier).searchPriority;
  return isBoosted && tier !== 'free' ? basePriority + 1 : basePriority;
}

export function canBoost(tier: ModelTier): boolean {
  return getTierLimits(tier).boostsPerMonth > 0;
}

export function hasOnlineIndicator(tier: ModelTier): boolean {
  return getTierLimits(tier).onlineIndicator;
}

// Package Interface (for pricing display)
export interface Package {
  id: string;
  name: string;
  tier: ModelTier;
  type: 'model' | 'agency';
  price: number;
  originalPrice?: number;
  durationDays: number;
  features: string[];
  highlights: string[];
  isPopular?: boolean;
  isBestValue?: boolean;
  extraModelPrice?: number;
  savings?: string;
}

// Model Packages (3-tier system)
export const MODEL_PACKAGES: Package[] = [
  {
    id: 'model-free',
    name: 'Free',
    tier: 'free',
    type: 'model',
    price: 0,
    durationDays: Infinity,
    highlights: [
      '1 Foto',
      '1 Kontaktmethode',
      'In der Suche sichtbar',
    ],
    features: [
      'Basis-Profil',
      '3 Services auswählbar',
      'Standard Suchposition',
    ],
  },
  {
    id: 'model-premium',
    name: 'Premium',
    tier: 'premium',
    type: 'model',
    price: 99,
    durationDays: 30,
    isPopular: true,
    highlights: [
      '5 Fotos + 1 Video',
      'Premium-Badge ⭐',
      'Top-Platzierung in Suche',
    ],
    features: [
      'Alle Kontaktmethoden',
      'Unbegrenzte Services',
      'Wochenplan-Kalender',
      'Vollständige Statistiken',
      '2 Profil-Boosts/Monat',
      'Im Premium-Bereich der Startseite',
    ],
  },
  {
    id: 'model-elite',
    name: 'Elite',
    tier: 'elite',
    type: 'model',
    price: 149,
    durationDays: 30,
    isBestValue: true,
    highlights: [
      'Unbegrenzte Fotos + 3 Videos',
      'Elite-Badge 👑',
      'Höchste Suchposition',
    ],
    features: [
      'Alles aus Premium',
      '"Online Jetzt" Anzeige',
      'Unbegrenzte Boosts',
      'Featured Carousel auf Startseite',
      'Erweiterte Analytics',
      'Prioritäts-Verifizierung',
      'Priority Support (4h Antwort)',
    ],
  },
];

// Agency Packages (unchanged for now)
export const AGENCY_PACKAGES: Package[] = [
  {
    id: 'agency-starter',
    name: 'Agentur Basis',
    tier: 'free', // agencies don't use tier system the same way
    type: 'agency',
    price: 499,
    durationDays: 30,
    extraModelPrice: 80,
    highlights: [
      'Bis zu 5 Models',
      'Agentur-Profilseite',
      'Zentrale Verwaltung',
    ],
    features: [
      'Agentur-Dashboard',
      'Model-Verwaltung',
      'Sammel-Upload',
      'Standard Support',
    ],
  },
  {
    id: 'agency-pro',
    name: 'Agentur Pro',
    tier: 'premium',
    type: 'agency',
    price: 899,
    originalPrice: 1099,
    durationDays: 30,
    isPopular: true,
    extraModelPrice: 60,
    savings: '18%',
    highlights: [
      'Bis zu 15 Models',
      'Featured Agentur-Spot',
      'Erweiterte Analytics',
    ],
    features: [
      'Alles aus Basis',
      'Prioritäts-Support',
      'Bulk-Upload Tools',
      'Performance Reports',
      'Dedizierter Account Manager',
    ],
  },
];

// Combined packages for backward compatibility
export const PACKAGES: Package[] = [...MODEL_PACKAGES, ...AGENCY_PACKAGES];

// Helper functions
export function getPackageById(id: string): Package | undefined {
  return PACKAGES.find(pkg => pkg.id === id);
}

export function getModelPackages(): Package[] {
  return MODEL_PACKAGES;
}

export function getAgencyPackages(): Package[] {
  return AGENCY_PACKAGES;
}

export function getPackageByTier(tier: ModelTier): Package | undefined {
  return MODEL_PACKAGES.find(pkg => pkg.tier === tier);
}

// Get default boosts for a tier (used when subscription starts/renews)
export function getDefaultBoosts(tier: ModelTier): number {
  const limits = getTierLimits(tier);
  if (limits.boostsPerMonth === Infinity) return 999; // Elite unlimited
  return limits.boostsPerMonth;
}
