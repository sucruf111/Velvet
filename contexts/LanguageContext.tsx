import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'en' | 'de' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.escorts': 'Escorts',
    'nav.advertise': 'Advertise',
    'nav.login': 'Login',
    'nav.search_placeholder': 'Search...',
    
    // Home
    'home.subtitle': 'Premium Escort Directory',
    'home.title_prefix': 'The Best Escort',
    'home.title_highlight': 'Models',
    'home.title_suffix': 'in Berlin',
    'home.filter_all': 'All Berlin',
    'home.filter_outcall': 'Outcall - Escort',
    'home.filter_massage': 'Erotik Massage',
    'home.premium_title': 'Premium Selection',
    'home.new_title': 'New Arrivals & Verified',
    'home.agencies_title': 'Partner Agencies',
    'home.view_all': 'View All Models',
    
    // Profile Card
    'card.call_now': 'Call Now',
    'card.available': 'Available Now',
    'card.hourly': 'Hourly',
    
    // Profile Detail
    'profile.verified_content': 'Verified Content',
    'profile.about': 'About Me',
    'profile.services': 'Services',
    'profile.schedule': 'Weekly Schedule',
    'profile.languages': 'Languages',
    'profile.represented_by': 'Represented by',
    'profile.show_phone': 'Show Phone Number',
    'profile.mention': 'Please mention',
    'profile.when_contacting': 'when contacting',
    'profile.on_request': 'On Request',
    'profile.off': 'Off',
    'profile.back_home': 'Home',
    'profile.back_escorts': 'Escorts',
    
    // Attributes
    'attr.age': 'Age',
    'attr.height': 'Height',
    'attr.dress': 'Dress',
    'attr.bra': 'Bra',
    'attr.shoe': 'Shoe',
    'attr.hourly_rate': 'Hourly Rate',
    
    // Search
    'search.filters': 'Filters',
    'search.reset': 'Reset Filters',
    'search.max_price': 'Max Price',
    'search.district': 'District',
    'search.service': 'Service',
    'search.keyword': 'Name or keyword',
    'search.no_results': 'No profiles found matching your criteria.',
    'search.clear': 'Clear Filters',
    'search.showing': 'Showing',
    'search.profiles': 'verified profiles',
    'search.all_districts': 'All Districts',
    'search.any_service': 'Any Service',

    // Footer
    'footer.directory': 'Directory',
    'footer.info': 'Information',
    'footer.contact': 'Contact',
    'footer.terms': 'Terms & Conditions',
    'footer.privacy': 'Privacy Policy',
    'footer.desc': 'The premier independent advertising platform for high-class escorts in Berlin. We provide visibility for exclusive companions.',

    // Badges
    'badge.premium': 'PREMIUM',
    'badge.new': 'NEW',
    'badge.verified': 'VERIFIED',
    'badge.top': 'TOP MODEL',
    'badge.choice': "VELVET'S CHOICE"
  },
  de: {
    'nav.home': 'Startseite',
    'nav.escorts': 'Escorts',
    'nav.advertise': 'Werben',
    'nav.login': 'Login',
    'nav.search_placeholder': 'Suchen...',
    
    'home.subtitle': 'Premium Escort Verzeichnis',
    'home.title_prefix': 'Die besten Escort',
    'home.title_highlight': 'Models',
    'home.title_suffix': 'in Berlin',
    'home.filter_all': 'Ganz Berlin',
    'home.filter_outcall': 'Outcall - Escort',
    'home.filter_massage': 'Erotik Massage',
    'home.premium_title': 'Premium Auswahl',
    'home.new_title': 'Neu & Verifiziert',
    'home.agencies_title': 'Partner Agenturen',
    'home.view_all': 'Alle Models ansehen',
    
    'card.call_now': 'Anrufen',
    'card.available': 'Verfügbar',
    'card.hourly': 'Stündlich',
    
    'profile.verified_content': 'Verifizierter Inhalt',
    'profile.about': 'Über Mich',
    'profile.services': 'Services',
    'profile.schedule': 'Verfügbarkeit',
    'profile.languages': 'Sprachen',
    'profile.represented_by': 'Vertreten durch',
    'profile.show_phone': 'Nummer anzeigen',
    'profile.mention': 'Bitte erwähnen Sie',
    'profile.when_contacting': 'wenn Sie kontaktieren',
    'profile.on_request': 'Auf Anfrage',
    'profile.off': 'Frei',
    'profile.back_home': 'Start',
    'profile.back_escorts': 'Escorts',

    'attr.age': 'Alter',
    'attr.height': 'Größe',
    'attr.dress': 'Konfektion',
    'attr.bra': 'BH',
    'attr.shoe': 'Schuh',
    'attr.hourly_rate': 'Stundensatz',
    
    'search.filters': 'Filter',
    'search.reset': 'Zurücksetzen',
    'search.max_price': 'Max. Preis',
    'search.district': 'Bezirk',
    'search.service': 'Service',
    'search.keyword': 'Name oder Stichwort',
    'search.no_results': 'Keine Profile gefunden.',
    'search.clear': 'Filter löschen',
    'search.showing': 'Zeige',
    'search.profiles': 'verifizierte Profile',
    'search.all_districts': 'Alle Bezirke',
    'search.any_service': 'Jeder Service',

    'footer.directory': 'Verzeichnis',
    'footer.info': 'Informationen',
    'footer.contact': 'Kontakt',
    'footer.terms': 'AGB',
    'footer.privacy': 'Datenschutz',
    'footer.desc': 'Die führende unabhängige Werbeplattform für High-Class Escorts in Berlin. Wir bieten Sichtbarkeit für exklusive Begleitungen.',

    'badge.premium': 'PREMIUM',
    'badge.new': 'NEU',
    'badge.verified': 'VERIFIZIERT',
    'badge.top': 'TOP MODEL',
    'badge.choice': "VELVET'S WAHL"
  },
  ru: {
    'nav.home': 'Главная',
    'nav.escorts': 'Эскорт',
    'nav.advertise': 'Реклама',
    'nav.login': 'Войти',
    'nav.search_placeholder': 'Поиск...',
    
    'home.subtitle': 'Премиум Эскорт Каталог',
    'home.title_prefix': 'Лучшие Эскорт',
    'home.title_highlight': 'Модели',
    'home.title_suffix': 'в Берлине',
    'home.filter_all': 'Весь Берлин',
    'home.filter_outcall': 'Выезд - Эскорт',
    'home.filter_massage': 'Эротический Массаж',
    'home.premium_title': 'Премиум Выбор',
    'home.new_title': 'Новые и Проверенные',
    'home.agencies_title': 'Агентства-Партнеры',
    'home.view_all': 'Посмотреть Всех',
    
    'card.call_now': 'Позвонить',
    'card.available': 'Доступна',
    'card.hourly': 'В час',
    
    'profile.verified_content': 'Проверенный контент',
    'profile.about': 'Обо мне',
    'profile.services': 'Услуги',
    'profile.schedule': 'Расписание',
    'profile.languages': 'Языки',
    'profile.represented_by': 'Представлена',
    'profile.show_phone': 'Показать номер',
    'profile.mention': 'Пожалуйста, упомяните',
    'profile.when_contacting': 'при контакте',
    'profile.on_request': 'По запросу',
    'profile.off': 'Вых.',
    'profile.back_home': 'Главная',
    'profile.back_escorts': 'Эскорт',

    'attr.age': 'Возраст',
    'attr.height': 'Рост',
    'attr.dress': 'Размер',
    'attr.bra': 'Бюст',
    'attr.shoe': 'Обувь',
    'attr.hourly_rate': 'Тариф в час',
    
    'search.filters': 'Фильтры',
    'search.reset': 'Сбросить',
    'search.max_price': 'Макс. цена',
    'search.district': 'Район',
    'search.service': 'Услуга',
    'search.keyword': 'Имя или слово',
    'search.no_results': 'Профили не найдены.',
    'search.clear': 'Очистить',
    'search.showing': 'Показано',
    'search.profiles': 'профилей',
    'search.all_districts': 'Все Районы',
    'search.any_service': 'Любая Услуга',

    'footer.directory': 'Каталог',
    'footer.info': 'Информация',
    'footer.contact': 'Контакты',
    'footer.terms': 'Условия',
    'footer.privacy': 'Конфиденциальность',
    'footer.desc': 'Ведущая независимая рекламная платформа для элитного эскорта в Берлине. Мы обеспечиваем видимость для эксклюзивных спутниц.',

    'badge.premium': 'ПРЕМИУМ',
    'badge.new': 'НОВАЯ',
    'badge.verified': 'ПРОВЕРЕНО',
    'badge.top': 'ТОП МОДЕЛЬ',
    'badge.choice': "ВЫБОР VELVET"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};