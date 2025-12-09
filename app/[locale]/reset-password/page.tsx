'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button, Input } from '@/components/ui';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, Lock, Check, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session - the link might be invalid or expired
        setError(t('auth.reset_link_invalid'));
      }
    };
    checkSession();
  }, [supabase.auth, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('register.error_password_short'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('register.error_password_match'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(locale === 'de' ? '/login' : `/${locale}/login`);
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.reset_error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center px-4 py-12 animate-fade-in">
        <div className="max-w-md w-full bg-neutral-900/50 border border-neutral-800 rounded-sm overflow-hidden p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="font-serif text-2xl text-white mb-4">{t('auth.password_updated_title')}</h1>
            <p className="text-neutral-400 mb-6">{t('auth.password_updated_desc')}</p>
            <Link href="/login">
              <Button fullWidth>
                {t('auth.go_to_login')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="max-w-md w-full bg-neutral-900/50 border border-neutral-800 rounded-sm overflow-hidden">
        <div className="p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.back_to_login')}
          </Link>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-luxury-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-luxury-gold" />
            </div>
            <h1 className="font-serif text-3xl text-white mb-2">{t('auth.new_password_title')}</h1>
            <p className="text-neutral-500 text-sm">{t('auth.new_password_desc')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                {t('auth.new_password')}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('register.password_placeholder')}
                  error={!!error}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                {t('register.confirm_password')}
              </label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('register.confirm_placeholder')}
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
                  {t('auth.updating')}
                </span>
              ) : t('auth.update_password')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
