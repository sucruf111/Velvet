
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
  name: string;
  description: string;
  logo: string;
  banner: string;
  image: string; // Vertical profile image for grid
  website?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  email: string;
  district: District;
  isFeatured?: boolean;
  reviews?: Review[];
}

export interface Profile {
  id: string;
  name: string;
  agencyId?: string; // Optional link to an Agency
  age: number;
  district: District;
  priceStart: number;
  languages: string[];
  services: ServiceType[];
  description: string;
  images: string[];
  isPremium: boolean;
  isNew: boolean;
  isVerified: boolean;
  isVelvetChoice: boolean;
  clicks: number;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  height: number; // cm
  dressSize: string;
  shoeSize: number;
  braSize: string;
  reviews: Review[];
  availability: string[]; // e.g. ["Mon: 12:00 - 02:00", "Tue: 14:00 - 02:00"]
  showSchedule?: boolean; // Toggle to display the schedule on the profile page
  lastActive: string; // ISO Date String indicating last login
}

export interface Package {
  id: string;
  name: string;
  type: 'model' | 'agency';
  price: number;
  durationDays: number;
  features: string[];
  isHighlight?: boolean;
  extraModelPrice?: number; // For Agency packages
}
