export interface Package {
  id: string;
  name: string;
  type: 'model' | 'agency';
  price: number;
  originalPrice?: number; // For showing discounts
  durationDays: number;
  features: string[];
  highlights: string[]; // Key selling points (shown prominently)
  isPopular?: boolean;
  isBestValue?: boolean;
  extraModelPrice?: number;
  savings?: string;
}

export const PACKAGES: Package[] = [
  // Model Packages
  {
    id: 'model-starter',
    name: 'Starter',
    type: 'model',
    price: 99,
    durationDays: 14,
    highlights: [
      '5 Profi-Fotos',
      'Direkter Kundenkontakt',
    ],
    features: [
      'Standard Profil',
      'In der Suche sichtbar',
      'Telefon & WhatsApp anzeigen',
      'Grundlegende Statistiken',
    ],
  },
  {
    id: 'model-premium',
    name: 'Premium',
    type: 'model',
    price: 199,
    originalPrice: 249,
    durationDays: 30,
    isPopular: true,
    savings: '20%',
    highlights: [
      '15 Fotos + 1 Video',
      'Premium-Badge',
      'Top-Platzierung in Suche',
    ],
    features: [
      'Alles aus Starter',
      'Hervorgehobenes Profil',
      'Wochenplan-Kalender',
      'Erweiterte Statistiken',
      'Verifiziert-Badge',
    ],
  },
  {
    id: 'model-elite',
    name: 'Elite',
    type: 'model',
    price: 349,
    durationDays: 30,
    isBestValue: true,
    highlights: [
      'Unbegrenzte Fotos & Videos',
      'Startseiten-Feature',
      'VIP Support 24/7',
    ],
    features: [
      'Alles aus Premium',
      'Elite-Badge',
      'Höchste Suchposition',
      'Social Media Promotion',
      'Persönlicher Account Manager',
      'Priorität bei neuen Features',
    ],
  },
  // Agency Packages
  {
    id: 'agency-starter',
    name: 'Agentur Basis',
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

export function getPackageById(id: string): Package | undefined {
  return PACKAGES.find(pkg => pkg.id === id);
}

export function getModelPackages(): Package[] {
  return PACKAGES.filter(pkg => pkg.type === 'model');
}

export function getAgencyPackages(): Package[] {
  return PACKAGES.filter(pkg => pkg.type === 'agency');
}
