export enum District {
  MITTE = 'Mitte',
  CHARLOTTENBURG = 'Charlottenburg',
  KREUZBERG = 'Kreuzberg',
  PRENZLAUER_BERG = 'Prenzlauer Berg',
  SCHONEBERG = 'Schöneberg',
  WILMERSDORF = 'Wilmersdorf',
  FRIEDRICHSHAIN = 'Friedrichshain',
  ZEHLENDORF = 'Zehlendorf'
}

export enum ServiceType {
  // Core
  ESCORT = 'Escort Service',
  OUTCALL = 'Outcall',
  INCALL = 'Incall',
  OVERNIGHT = 'Overnight possibility',
  DINNER = 'Dinner Date',
  TRAVEL = 'Travel Companion',

  // Oral
  BJ_NATURAL = 'BJ Natur INCLUDED IN PRICE',
  BJ_NATURAL_EXTRA = 'BJ Natur extra price',
  BJ_CONDOM = 'BJ with Condom',
  SWALLOW = 'Swallow',
  CIM = 'Cum in Mouth (CIM)',
  COB = 'Cum on Body',
  COF = 'Cum on Face',
  DEEP_THROAT = 'Deep Throat',

  // Intimacy
  KISS = 'Kiss',
  TONGUE_KISS = 'Tongue kiss',
  FRENCH_KISSING = 'French Kissing',
  GFE = 'Girlfriend Experience',

  // Positions / Acts
  POS_69 = '69 Position',
  ANAL = 'Anal',
  RIMMING = 'Rimming',
  PROSTATE_MASSAGE = 'Prostate massage',
  SPANISH = 'Spanish',

  // Kinks / Special
  BDSM = 'BDSM',
  BDSM_LIGHT = 'BDSM Light',
  DEVOTE = 'Devote Spiele',
  DOMINANT = 'Dominante Spiele',
  ROLEPLAY = 'Rollen Spiele',
  GOLDEN_SHOWER_ACTIVE = 'Golden Shower Aktiv',
  GOLDEN_SHOWER_PASSIVE = 'Golden Shower Passiv',
  KINKY = 'Kinky / Fetish',

  // Group
  COUPLE = 'Couple',
  MMF = 'Sex with two men',
  FFM = 'Threesome (2 Girls)',

  // Other
  MASSAGE = 'Erotic Massage',
  BODY_TO_BODY = 'Body to Body Massage',
  STRIPTEASE = 'Striptease'
}

export interface Review {
  author: string;
  date: string;
  rating: number;
  text: string;
}

export interface Agency {
  id: string;
  userId?: string;
  name: string;
  description: string;
  logo: string;
  banner: string;
  image: string;
  website?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  email: string;
  district: District;
  isFeatured?: boolean;
  reviews?: Review[];
  // Subscription fields
  subscriptionTier?: AgencyTier;
  subscriptionExpiresAt?: string;
  modelLimit?: number;
}

export type VisitType = 'incall' | 'outcall' | 'both';

// Tier type (imported from packages.ts but also defined here for convenience)
export type ModelTier = 'free' | 'premium' | 'elite';

// Agency subscription tiers
export type AgencyTier = 'none' | 'starter' | 'pro';

export interface Profile {
  id: string;
  name: string;
  agencyId?: string;
  age: number;
  district: District;
  priceStart: number;
  languages: string[];
  services: ServiceType[];
  description: string;
  images: string[];
  isPremium: boolean; // Legacy - kept for backward compatibility, use tier instead
  isNew: boolean;
  isVerified: boolean;
  isVelvetChoice: boolean;
  clicks: number;
  contactClicks: number;
  searchAppearances: number;
  favoritesCount?: number;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  height: number;
  dressSize: string;
  shoeSize: number;
  braSize: string;
  reviews: Review[];
  availability: string[];
  showSchedule?: boolean;
  lastActive: string;
  isOnline?: boolean;
  createdAt: string;
  visitType?: VisitType;
  isDisabled?: boolean;

  // New tier system fields
  tier: ModelTier;
  boostsRemaining: number;
  boostedUntil?: string; // ISO timestamp when boost expires
  videoUrls: string[];
  primaryContact?: 'phone' | 'whatsapp' | 'telegram'; // For free tier single contact
  subscriptionExpiresAt?: string; // ISO timestamp when subscription expires
}

export const isProfileActive = (profile: Profile): boolean => {
  if (!profile.lastActive) return false;
  const lastActiveDate = new Date(profile.lastActive);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);
  return diffMinutes <= 60;
};

export const isProfileNew = (profile: Profile): boolean => {
  if (!profile.createdAt) return profile.isNew;
  const createdDate = new Date(profile.createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

export const isProfileBoosted = (profile: Profile): boolean => {
  if (!profile.boostedUntil) return false;
  const boostedUntil = new Date(profile.boostedUntil);
  return boostedUntil > new Date();
};

// Check if elite profile is "online now" (active within 15 minutes)
export const isEliteOnlineNow = (profile: Profile): boolean => {
  if (profile.tier !== 'elite') return false;
  if (!profile.lastActive) return false;
  const lastActiveDate = new Date(profile.lastActive);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);
  return diffMinutes <= 15;
};

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationApplication {
  id: string;
  profileId: string;
  userId: string;
  status: VerificationStatus;
  idPhotoUrl: string;
  selfieWithIdUrl: string;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
