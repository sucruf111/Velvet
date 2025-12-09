'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { Mail, Phone } from 'lucide-react';

type LoginMethod = 'email' | 'phone';

export default function LoginPage() {
  const { login, loginWithPhone } = useAuth();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginMethod === 'email') {
        await login(email, password);
      } else {
        await loginWithPhone(phone, password);
      }
      router.push(locale === 'de' ? '/dashboard' : `/${locale}/dashboard`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="max-w-md w-full bg-neutral-900/50 border border-neutral-800 rounded-sm overflow-hidden">
        {/* Login Section */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-white mb-2">{t('login.welcome')}</h1>
            <p className="text-neutral-500 text-sm">{t('login.subtitle')}</p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-sm border transition-all ${
                loginMethod === 'email'
                  ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">{t('auth.with_email')}</span>
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-sm border transition-all ${
                loginMethod === 'phone'
                  ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">{t('auth.with_phone')}</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {loginMethod === 'email' ? (
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('login.email')}
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  error={!!error}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('auth.phone_number')}
                </label>
                <Input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+49 123 456789"
                  error={!!error}
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs uppercase tracking-widest text-neutral-400">
                  {t('login.password')}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-luxury-gold hover:underline"
                >
                  {t('auth.forgot_password')}
                </Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.enter_password')}
                error={!!error}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm p-3 bg-red-900/20 border border-red-500/30 rounded-sm flex items-center gap-2">
                <span className="text-red-400">!</span> {error}
              </div>
            )}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('auth.logging_in')}
                </span>
              ) : t('login.button')}
            </Button>
          </form>
        </div>

        {/* Divider */}
        <div className="relative px-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-neutral-900/50 px-4 text-xs uppercase tracking-widest text-neutral-600">{t('common.or')}</span>
          </div>
        </div>

        {/* Registration CTA Section */}
        <div className="p-8 bg-neutral-950/50 border-t border-neutral-800">
          <div className="text-center">
            <h3 className="text-white font-serif text-xl mb-2">{t('login.new')}</h3>
            <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
              {t('login.new_customer')}
            </p>
            <Link href="/register">
              <Button variant="outline" fullWidth className="border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-black">
                {t('login.create_account')}
              </Button>
            </Link>
            <p className="text-neutral-600 text-xs mt-4">{t('login.no_card')} • {t('login.quick')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
