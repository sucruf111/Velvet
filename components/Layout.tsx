
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [headerSearch, setHeaderSearch] = useState('');
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();

  const isHome = location.pathname === '/';

  const handleHeaderSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate(`/search?q=${headerSearch}`);
      setHeaderSearch('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isHome ? 'bg-luxury-black/90 backdrop-blur-md' : 'bg-luxury-black border-b border-neutral-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="font-serif text-2xl sm:text-3xl font-normal text-luxury-white tracking-widest uppercase hover:text-luxury-gold transition-colors duration-300">
              VELVET<span className="text-luxury-gold">BERLIN</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/search" className="text-neutral-300 hover:text-luxury-gold transition-colors text-xs font-bold tracking-widest uppercase">{t('nav.escorts')}</Link>
              <Link to="/packages" className="text-neutral-300 hover:text-luxury-gold transition-colors text-xs font-bold tracking-widest uppercase">{t('nav.advertise')}</Link>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <Link to="/dashboard" className="flex items-center gap-2 text-luxury-gold text-xs font-bold tracking-widest uppercase border border-luxury-gold px-4 py-2 rounded-sm hover:bg-luxury-gold hover:text-black transition-all">
                    <UserIcon size={14} />
                    {user.role === 'customer' ? 'My Favorites' : 'Dashboard'}
                  </Link>
                </div>
              ) : (
                <Link to="/register" className="text-neutral-300 hover:text-luxury-gold transition-colors text-xs font-bold tracking-widest uppercase">{t('nav.login')}</Link>
              )}
              
              {/* Header Search Bar */}
              <div className="relative group">
                <input 
                  type="text" 
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  onKeyDown={handleHeaderSearch}
                  placeholder={t('nav.search_placeholder')}
                  className="bg-neutral-900/50 border border-neutral-700 rounded-full py-2 pl-10 pr-4 text-xs text-white focus:border-luxury-gold focus:bg-neutral-900 outline-none w-48 transition-all"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-luxury-gold transition-colors" />
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-3 text-xs font-bold tracking-widest text-neutral-500 border-l border-neutral-800 pl-6">
                <button onClick={() => setLanguage('en')} className={`hover:text-luxury-gold transition-colors ${language === 'en' ? 'text-luxury-gold' : ''}`}>EN</button>
                <button onClick={() => setLanguage('de')} className={`hover:text-luxury-gold transition-colors ${language === 'de' ? 'text-luxury-gold' : ''}`}>DE</button>
                <button onClick={() => setLanguage('ru')} className={`hover:text-luxury-gold transition-colors ${language === 'ru' ? 'text-luxury-gold' : ''}`}>RU</button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-neutral-500">
                <button onClick={() => setLanguage('en')} className={language === 'en' ? 'text-luxury-gold' : ''}>EN</button>
                <span className="text-neutral-700">|</span>
                <button onClick={() => setLanguage('de')} className={language === 'de' ? 'text-luxury-gold' : ''}>DE</button>
              </div>

              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-luxury-gold">
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-luxury-black border-b border-neutral-800 p-6 flex flex-col gap-6 shadow-2xl animate-fade-in h-screen">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder={t('nav.search_placeholder')}
                  className="w-full bg-neutral-900 border border-neutral-800 p-3 pl-10 text-white rounded"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/search?q=${(e.target as HTMLInputElement).value}`);
                      setIsMenuOpen(false);
                    }
                  }}
                />
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            </div>
            <Link to="/search" className="text-xl font-serif text-white" onClick={() => setIsMenuOpen(false)}>{t('nav.escorts')}</Link>
            <Link to="/packages" className="text-xl font-serif text-white" onClick={() => setIsMenuOpen(false)}>{t('nav.advertise')}</Link>
            {user ? (
               <Link to="/dashboard" className="text-xl font-serif text-luxury-gold" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
            ) : (
               <Link to="/login" className="text-xl font-serif text-white" onClick={() => setIsMenuOpen(false)}>{t('nav.login')}</Link>
            )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <Link to="/" className="font-serif text-2xl font-bold text-luxury-white tracking-widest uppercase mb-4 block">
                VELVET<span className="text-luxury-gold">BERLIN</span>
              </Link>
              <p className="text-neutral-500 text-sm leading-relaxed">
                {t('footer.desc')}
              </p>
            </div>
            
            <div>
              <h4 className="text-luxury-gold text-sm font-bold uppercase tracking-widest mb-6">{t('footer.directory')}</h4>
              <ul className="space-y-3 text-neutral-400 text-sm">
                <li><Link to="/search?district=Mitte" className="hover:text-white">Mitte</Link></li>
                <li><Link to="/search?district=Charlottenburg" className="hover:text-white">Charlottenburg</Link></li>
                <li><Link to="/search?isNew=true" className="hover:text-white">{t('home.new_title')}</Link></li>
                <li><Link to="/search?isPremium=true" className="hover:text-white">{t('home.premium_title')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-luxury-gold text-sm font-bold uppercase tracking-widest mb-6">{t('footer.info')}</h4>
              <ul className="space-y-3 text-neutral-400 text-sm">
                <li><Link to="/packages" className="hover:text-white">{t('nav.advertise')}</Link></li>
                <li><Link to="/dashboard" className="hover:text-white">{t('nav.login')}</Link></li>
                <li><span className="text-neutral-600 cursor-not-allowed">{t('footer.terms')}</span></li>
                <li><span className="text-neutral-600 cursor-not-allowed">{t('footer.privacy')}</span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-luxury-gold text-sm font-bold uppercase tracking-widest mb-6">{t('footer.contact')}</h4>
              <ul className="space-y-3 text-neutral-400 text-sm">
                <li><a href="mailto:support@velvet-berlin.de" className="hover:text-white">support@velvet-berlin.de</a></li>
                <li className="text-neutral-600">Mon - Sun: 24/7 Support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-neutral-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
             <p className="text-neutral-600 text-xs text-center md:text-left">
               © 2024 Velvet Berlin. All rights reserved. 18+ Only.
             </p>
             <div className="flex gap-4">
               <div className="w-8 h-5 bg-neutral-800 rounded"></div>
               <div className="w-8 h-5 bg-neutral-800 rounded"></div>
               <div className="w-8 h-5 bg-neutral-800 rounded"></div>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
