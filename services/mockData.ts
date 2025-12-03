
import { Profile, District, ServiceType, Package, Agency } from '../types';

// Helper to generate dynamic timestamps
const now = new Date();
const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString();
const hoursAgo = (hrs: number) => new Date(now.getTime() - hrs * 3600000).toISOString();

export const MOCK_AGENCIES: Agency[] = [
  {
    id: 'a1',
    name: 'Prestige Berlin',
    description: 'Prestige Berlin is the epitome of high-class companionship. We represent only the most exclusive, educated, and elegant models in the capital.',
    logo: 'https://ui-avatars.com/api/?name=Prestige+Berlin&background=000&color=d4af37&size=200&font-size=0.33',
    banner: 'https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?q=80&w=2071&auto=format&fit=crop', 
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop', 
    phone: '+4930000001',
    whatsapp: '+4930000001',
    telegram: 'prestige_berlin_official',
    email: 'booking@prestige-berlin.de',
    district: District.MITTE,
    website: 'www.prestige-berlin.de',
    isFeatured: true,
    reviews: [
      { author: "James B.", date: "Jan 2024", rating: 5, text: "The most professional agency in Berlin. Impeccable service." },
      { author: "K.L.", date: "Dec 2023", rating: 5, text: "Viktoria was amazing. Booking was smooth and discreet." }
    ]
  },
  {
    id: 'a2',
    name: 'Diamond Dolls',
    description: 'Fun, flirty, and unforgettable. Diamond Dolls brings you the freshest faces and the most passionate personalities.',
    logo: 'https://ui-avatars.com/api/?name=Diamond+Dolls&background=000&color=fff&size=200',
    banner: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1974&auto=format&fit=crop',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop', 
    phone: '+4930000002',
    whatsapp: '+4930000002',
    email: 'hello@diamond-dolls.de',
    district: District.CHARLOTTENBURG,
    reviews: [
      { author: "PartyGuy", date: "Nov 2023", rating: 5, text: "Best party girls in town!" }
    ]
  },
  {
    id: 'a3',
    name: 'Golden Touch',
    description: 'Where luxury meets desire. Golden Touch offers a curated selection of sophisticated ladies for the modern gentleman.',
    logo: 'https://ui-avatars.com/api/?name=Golden+Touch&background=000&color=d4af37&size=200',
    banner: 'https://images.unsplash.com/photo-1550614000-4b9519e02a48?q=80&w=2000&auto=format&fit=crop',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1000&auto=format&fit=crop',
    phone: '+4930000003',
    whatsapp: '+4930000003',
    email: 'contact@goldentouch.de',
    district: District.MITTE,
    website: 'www.goldentouch.de',
    isFeatured: true,
    reviews: [
      { author: "M.R.", date: "Feb 2024", rating: 5, text: "Truly golden experience." }
    ]
  },
  {
    id: 'a4',
    name: 'Midnight Whispers',
    description: 'Specializing in late-night encounters and uninhibited fun. Our models are open-minded and adventurous.',
    logo: 'https://ui-avatars.com/api/?name=Midnight+Whispers&background=000&color=888&size=200',
    banner: 'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?q=80&w=2000&auto=format&fit=crop',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop',
    phone: '+4930000004',
    email: 'booking@midnightwhispers.de',
    district: District.KREUZBERG,
    reviews: []
  },
  {
    id: 'a5',
    name: 'Sapphire Club',
    description: 'The Sapphire Club represents elite models for business events, travel, and high-society functions.',
    logo: 'https://ui-avatars.com/api/?name=Sapphire+Club&background=000&color=2563eb&size=200',
    banner: 'https://images.unsplash.com/photo-1560275619-4662e36fa65c?q=80&w=2000&auto=format&fit=crop',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop',
    phone: '+4930000005',
    email: 'info@sapphireclub.de',
    district: District.CHARLOTTENBURG,
    website: 'www.sapphireclub.de',
    isFeatured: false,
    reviews: [{ author: "CEO", date: "Jan 2024", rating: 5, text: "Perfect for corporate events." }]
  },
  {
    id: 'a6',
    name: 'Red Velvet',
    description: 'Passionate, fiery, and intense. Red Velvet is for those who want to feel alive.',
    logo: 'https://ui-avatars.com/api/?name=Red+Velvet&background=000&color=dc2626&size=200',
    banner: 'https://images.unsplash.com/photo-1542259681-d210f8615e43?q=80&w=2000&auto=format&fit=crop',
    image: 'https://images.unsplash.com/photo-1520857014972-e631eb09ae49?q=80&w=1000&auto=format&fit=crop',
    phone: '+4930000006',
    email: 'hola@redvelvet.de',
    district: District.SCHONEBERG,
    reviews: []
  },
  {
    id: 'a7',
    name: 'Exclusive Angels',
    description: 'Heavenly companions for your stay in Berlin. We offer a mix of local students and international models.',
    logo: 'https://ui-avatars.com/api/?name=Exclusive+Angels&background=000&color=fff&size=200',
    banner: 'https://images.unsplash.com/photo-1470434767159-ac7dab695d44?q=80&w=2000&auto=format&fit=crop',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
    phone: '+4930000007',
    email: 'angels@exclusive.de',
    district: District.WILMERSDORF,
    reviews: []
  },
  {
    id: 'a8',
    name: 'Urban Muses',
    description: 'Artistic, alternative, and authentic. For the creative soul who wants a muse, not just a date.',
    logo: 'https://ui-avatars.com/api/?name=Urban+Muses&background=000&color=a855f7&size=200',
    banner: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=2000&auto=format&fit=crop',
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=1000&auto=format&fit=crop',
    phone: '+4930000008',
    email: 'muse@urban.de',
    district: District.FRIEDRICHSHAIN,
    isFeatured: true,
    reviews: [{ author: "Artist", date: "Feb 2024", rating: 5, text: "Inspiring company." }]
  }
];

export const MOCK_PROFILES: Profile[] = [
  {
    id: '1',
    name: 'Anastasia',
    agencyId: 'a1', 
    age: 24,
    district: District.MITTE,
    priceStart: 350,
    languages: ['Deutsch', 'English', 'Russian'],
    services: [
      ServiceType.INCALL, ServiceType.OUTCALL, ServiceType.DINNER, ServiceType.OVERNIGHT,
      ServiceType.BJ_NATURAL, ServiceType.KISS, ServiceType.TONGUE_KISS, ServiceType.GFE, 
      ServiceType.COF, ServiceType.CIM, ServiceType.SWALLOW, ServiceType.DEEP_THROAT,
      ServiceType.MASSAGE, ServiceType.POS_69, ServiceType.SPANISH, ServiceType.RIMMING,
      ServiceType.STRIPTEASE, ServiceType.ROLEPLAY
    ],
    description: `<p>Welcome to a world where elegance meets unrestrained passion. I am Anastasia, a sophisticated companion designed for the gentleman who refuses to compromise on quality.</p><p>My presence is calm yet captivating, perfect for a high-profile dinner date or a private evening in your suite.</p>`,
    images: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop'],
    isPremium: true, isNew: false, isVerified: true, isVelvetChoice: true, clicks: 2540,
    phone: '+491520000001',
    whatsapp: '+491520000001',
    telegram: 'ana_velvet',
    height: 175, dressSize: '36', braSize: '75C', shoeSize: 39,
    reviews: [], availability: ["Mon: 18:00 - Open", "Tue: 18:00 - Open", "Wed: Off", "Thu: 12:00 - 02:00", "Fri: 12:00 - Open", "Sat: 14:00 - Open", "Sun: On Request"], showSchedule: true,
    lastActive: minutesAgo(10) // Active 10 mins ago
  },
  {
    id: '2',
    name: 'Isabelle',
    agencyId: 'a2', 
    age: 22,
    district: District.CHARLOTTENBURG,
    priceStart: 300,
    languages: ['Deutsch', 'English', 'French'],
    services: [ServiceType.INCALL, ServiceType.OUTCALL, ServiceType.OVERNIGHT, ServiceType.STRIPTEASE, ServiceType.ROLEPLAY, ServiceType.BJ_CONDOM, ServiceType.COB, ServiceType.GFE, ServiceType.DINNER, ServiceType.POS_69, ServiceType.KISS, ServiceType.MASSAGE, ServiceType.COUPLE, ServiceType.FFM],
    description: `<p>Charming, witty, and incredibly sweet—that is how my friends describe me. I am Isabelle, a young student enjoying the vibrant life of Berlin.</p><p>Don't let my innocent look fool you; behind closed doors, I am open-minded, curious, and eager to please.</p>`,
    images: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop'],
    isPremium: false, isNew: true, isVerified: true, isVelvetChoice: false, clicks: 1150,
    phone: '+491520000002',
    whatsapp: '+491520000002',
    height: 168, dressSize: '34', braSize: '70B', shoeSize: 37,
    reviews: [], availability: ["Mon: 10:00 - 22:00", "Tue: 10:00 - 22:00", "Wed: 10:00 - 22:00", "Thu: 10:00 - 22:00", "Fri: 12:00 - Open", "Sat: 12:00 - Open", "Sun: Off"], showSchedule: true,
    lastActive: minutesAgo(30) // Active 30 mins ago
  },
  {
    id: '3',
    name: 'Sophie',
    agencyId: 'a3',
    age: 26,
    district: District.MITTE,
    priceStart: 400,
    languages: ['Deutsch', 'English', 'Italian'],
    services: [ServiceType.ESCORT, ServiceType.DINNER, ServiceType.GFE, ServiceType.MASSAGE],
    description: `<p>Sophie is the definition of class. An architecture student with a passion for art and culture.</p>`,
    images: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1000&auto=format&fit=crop'],
    isPremium: true, isNew: false, isVerified: true, isVelvetChoice: false, clicks: 1800,
    phone: '+491520000003', height: 172, dressSize: '36', braSize: '75B', shoeSize: 38,
    reviews: [], availability: [], showSchedule: false,
    lastActive: hoursAgo(5) // Active 5 hours ago (Not available)
  },
  {
    id: '4',
    name: 'Elena',
    age: 23,
    district: District.KREUZBERG,
    priceStart: 250,
    languages: ['Deutsch', 'Spanish', 'English'],
    services: [ServiceType.INCALL, ServiceType.SPANISH, ServiceType.ROLEPLAY, ServiceType.BDSM_LIGHT],
    description: `<p>Fiery and energetic. I love to dance and enjoy the nightlife.</p>`,
    images: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop'],
    isPremium: false, isNew: true, isVerified: true, isVelvetChoice: false, clicks: 950,
    phone: '+491520000004', 
    telegram: 'elena_dance',
    height: 165, dressSize: '34', braSize: '70C', shoeSize: 37,
    reviews: [], availability: [], showSchedule: false,
    lastActive: minutesAgo(5) // Active 5 mins ago
  },
  {
    id: '5',
    name: 'Victoria',
    agencyId: 'a1',
    age: 28,
    district: District.MITTE,
    priceStart: 500,
    languages: ['English', 'Russian', 'French'],
    services: [ServiceType.ESCORT, ServiceType.OUTCALL, ServiceType.DINNER, ServiceType.OVERNIGHT],
    description: `<p>A true VIP companion for the most demanding gentlemen.</p>`,
    images: ['https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1000&auto=format&fit=crop'],
    isPremium: true, isNew: false, isVerified: true, isVelvetChoice: true, clicks: 3100,
    phone: '+491520000005', height: 178, dressSize: '36', braSize: '75D', shoeSize: 40,
    reviews: [], availability: [], showSchedule: false,
    lastActive: hoursAgo(24) // Yesterday
  },
  {
    id: '6',
    name: 'Mia',
    age: 21,
    district: District.FRIEDRICHSHAIN,
    priceStart: 200,
    languages: ['Deutsch', 'English'],
    services: [ServiceType.INCALL, ServiceType.MASSAGE, ServiceType.GFE],
    description: `<p>Sweet, natural, and friendly. The girl next door you always wanted to meet.</p>`,
    images: ['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop'],
    isPremium: false, isNew: true, isVerified: false, isVelvetChoice: false, clicks: 800,
    height: 162, dressSize: '34', braSize: '70B', shoeSize: 36,
    reviews: [], availability: [], showSchedule: false,
    lastActive: minutesAgo(45) // Active
  },
  {
    id: '7',
    name: 'Valentina',
    agencyId: 'a6',
    age: 25,
    district: District.SCHONEBERG,
    priceStart: 300,
    languages: ['Spanish', 'English', 'Italian'],
    services: [ServiceType.INCALL, ServiceType.OUTCALL, ServiceType.GFE, ServiceType.SPANISH],
    description: `<p>Italian passion mixed with elegance.</p>`,
    images: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop'],
    isPremium: false, isNew: false, isVerified: true, isVelvetChoice: false, clicks: 1200,
    phone: '+491520000007', height: 170, dressSize: '36', braSize: '75C', shoeSize: 38,
    reviews: [], availability: [], showSchedule: false,
    lastActive: hoursAgo(2)
  },
  {
    id: '8',
    name: 'Katarina',
    age: 29,
    district: District.CHARLOTTENBURG,
    priceStart: 350,
    languages: ['English', 'German', 'Polish'],
    services: [ServiceType.OUTCALL, ServiceType.DINNER, ServiceType.OVERNIGHT, ServiceType.GFE],
    description: `<p>Experienced, mature, and open-minded.</p>`,
    images: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop'],
    isPremium: true, isNew: false, isVerified: true, isVelvetChoice: false, clicks: 1500,
    phone: '+491520000008', height: 174, dressSize: '38', braSize: '80C', shoeSize: 39,
    reviews: [], availability: [], showSchedule: false,
    lastActive: minutesAgo(15) // Active
  },
  {
    id: '9',
    name: 'Lola',
    age: 20,
    district: District.MITTE,
    priceStart: 400,
    languages: ['French', 'English'],
    services: [ServiceType.INCALL, ServiceType.GFE, ServiceType.BDSM],
    description: `<p>Parisian chic in Berlin.</p>`,
    images: ['https://images.unsplash.com/photo-1526510747491-58f928ec870f?q=80&w=1000&auto=format&fit=crop'],
    isPremium: true, isNew: true, isVerified: true, isVelvetChoice: true, clicks: 2200,
    phone: '+491520000009',
    whatsapp: '+491520000009',
    height: 169, dressSize: '34', braSize: '70D', shoeSize: 37,
    reviews: [], availability: [], showSchedule: false,
    lastActive: hoursAgo(3)
  },
  {
    id: '10',
    name: 'Jasmin',
    age: 24,
    district: District.KREUZBERG,
    priceStart: 220,
    languages: ['German', 'Turkish', 'English'],
    services: [ServiceType.INCALL, ServiceType.MASSAGE, ServiceType.BODY_TO_BODY],
    description: `<p>Exotic beauty with magical hands.</p>`,
    images: ['https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1000&auto=format&fit=crop'],
    isPremium: false, isNew: true, isVerified: true, isVelvetChoice: false, clicks: 900,
    phone: '+491520000010', height: 166, dressSize: '36', braSize: '75B', shoeSize: 38,
    reviews: [], availability: [], showSchedule: false,
    lastActive: minutesAgo(55) // Active
  },
  {
    id: '11',
    name: 'Ruby',
    age: 27,
    district: District.PRENZLAUER_BERG,
    priceStart: 300,
    languages: ['English', 'German'],
    services: [ServiceType.OUTCALL, ServiceType.GFE, ServiceType.DINNER],
    description: `<p>Redhead with a fiery personality.</p>`,
    images: ['https://images.unsplash.com/photo-1550614000-4b9519e02a48?q=80&w=1000&auto=format&fit=crop'],
    isPremium: false, isNew: false, isVerified: true, isVelvetChoice: false, clicks: 1300,
    phone: '+491520000011', height: 171, dressSize: '36', braSize: '75C', shoeSize: 39,
    reviews: [], availability: [], showSchedule: false,
    lastActive: hoursAgo(10)
  },
  {
    id: '12',
    name: 'Amara',
    agencyId: 'a8',
    age: 22,
    district: District.FRIEDRICHSHAIN,
    priceStart: 250,
    languages: ['English', 'German'],
    services: [ServiceType.INCALL, ServiceType.ROLEPLAY, ServiceType.KINKY],
    description: `<p>Alternative style, tattoos, and piercings.</p>`,
    images: ['https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=1000&auto=format&fit=crop'],
    isPremium: false, isNew: true, isVerified: true, isVelvetChoice: true, clicks: 1600,
    telegram: 'amara_kinky',
    height: 167, dressSize: '34', braSize: '70B', shoeSize: 37,
    reviews: [], availability: [], showSchedule: false,
    lastActive: minutesAgo(20) // Active
  }
];

export const MOCK_PACKAGES: Package[] = [
  {
    id: 'pkg_m1',
    name: 'Starter',
    type: 'model',
    price: 99,
    durationDays: 14,
    features: ['Basic Profile Visibility', 'Up to 5 Photos', 'Standard Search Ranking', 'Direct Contact Buttons'],
    isHighlight: false
  },
  {
    id: 'pkg_m2',
    name: 'Premium',
    type: 'model',
    price: 199,
    durationDays: 30,
    features: ['Premium Badge', 'Up to 15 Photos', 'High Search Ranking', 'Video Uploads', 'Schedule Management'],
    isHighlight: true
  },
  {
    id: 'pkg_m3',
    name: 'Elite',
    type: 'model',
    price: 349,
    durationDays: 30,
    features: ['Elite Badge', 'Unlimited Photos', 'Top Search Ranking', 'Homepage Feature', 'Social Media Promotion', 'Priority Support'],
    isHighlight: false
  },
  {
    id: 'pkg_a1',
    name: 'Agency Basic',
    type: 'agency',
    price: 499,
    durationDays: 30,
    features: ['Agency Profile Page', 'Up to 5 Model Profiles', 'Agency Dashboard', 'Standard Support'],
    isHighlight: false,
    extraModelPrice: 80
  },
  {
    id: 'pkg_a2',
    name: 'Agency Pro',
    type: 'agency',
    price: 899,
    durationDays: 30,
    features: ['Featured Agency Spot', 'Up to 15 Model Profiles', 'Advanced Analytics', 'Priority Support', 'Bulk Upload Tools'],
    isHighlight: true,
    extraModelPrice: 60
  }
];
