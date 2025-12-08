'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { Menu, X, Search, LogOut } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '@/lib/auth-context';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');
  const { user, isAuthenticated, canAdvertise, logout } = useAuth();

  // Determine dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if (user.role === 'admin') return '/vb-control';
    return '/dashboard';
  };

  const getDashboardLabel = () => {
    if (!user) return t('dashboard');
    if (user.role === 'admin') return t('admin');
    return t('dashboard');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setIsMenuOpen(false);
  };

  const isHome = pathname === '/';

  const handleHeaderSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && headerSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(headerSearch)}`);
      setHeaderSearch('');
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isHome ? 'bg-luxury-black/90 backdrop-blur-md' : 'bg-luxury-black border-b border-neutral-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="font-serif text-2xl sm:text-3xl font-normal text-luxury-white tracking-widest uppercase hover:text-luxury-gold transition-colors duration-300">
            VELVET<span className="text-luxury-gold">BERLIN</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/search" className="text-neutral-300 hover:text-luxury-gold transition-colors text-xs font-bold tracking-widest uppercase">
              {t('escorts')}
            </Link>

            {/* Show Dashboard or Login based on auth state */}
            {isAuthenticated ? (
              <>
                <Link href={getDashboardLink()} className="text-neutral-300 hover:text-luxury-gold transition-colors text-xs font-bold tracking-widest uppercase">
                  {getDashboardLabel()}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-neutral-300 hover:text-luxury-gold transition-colors text-xs font-bold tracking-widest uppercase flex items-center gap-1"
                >
                  <LogOut size={14} />
                  {t('logout')}
                </button>
              </>
            ) : (
              <Link href="/login" className="text-neutral-300 hover:text-luxury-gold transition-colors text-xs font-bold tracking-widest uppercase">
                {t('login')}
              </Link>
            )}

            {/* Header Search Bar */}
            <div className="relative group">
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                onKeyDown={handleHeaderSearch}
                placeholder={t('search_placeholder')}
                className="bg-neutral-900/50 border border-neutral-700 rounded-full py-2 pl-10 pr-4 text-xs text-white focus:border-luxury-gold focus:bg-neutral-900 outline-none w-48 transition-all"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-luxury-gold transition-colors" />
            </div>

            {/* Advertise Link - Only visible to verified models and agencies */}
            {canAdvertise && (
              <Link href="/packages" className="text-neutral-500 hover:text-neutral-300 transition-colors text-[10px] font-medium tracking-wider uppercase">
                {t('advertise')}
              </Link>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <LanguageSwitcher mobile />
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
              placeholder={t('search_placeholder')}
              className="w-full bg-neutral-900 border border-neutral-800 p-3 pl-10 text-white rounded"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  router.push(`/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
                  setIsMenuOpen(false);
                }
              }}
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          </div>
          <Link href="/search" className="text-xl font-serif text-white" onClick={() => setIsMenuOpen(false)}>
            {t('escorts')}
          </Link>

          {/* Show Dashboard or Login based on auth state */}
          {isAuthenticated ? (
            <>
              <Link href={getDashboardLink()} className="text-xl font-serif text-white" onClick={() => setIsMenuOpen(false)}>
                {getDashboardLabel()}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xl font-serif text-white text-left flex items-center gap-2"
              >
                <LogOut size={20} />
                {t('logout')}
              </button>
            </>
          ) : (
            <Link href="/login" className="text-xl font-serif text-white" onClick={() => setIsMenuOpen(false)}>
              {t('login')}
            </Link>
          )}

          {/* Advertise - Subtle placement at bottom - Only visible to verified models and agencies */}
          {canAdvertise && (
            <div className="border-t border-neutral-800 pt-6 mt-auto">
              <Link href="/packages" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors" onClick={() => setIsMenuOpen(false)}>
                {t('advertise')}
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
