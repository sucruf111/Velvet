'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/auth-context';
import {
  User,
  Camera,
  Building2,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  MessageCircle,
  Globe,
  Sparkles,
  Mail
} from 'lucide-react';

type RegistrationType = 'customer' | 'model' | 'agency' | null;
type AuthMethod = 'email' | 'phone';

interface FormData {
  authMethod: AuthMethod;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  username: string;
  displayName: string;
  agencyName: string;
  district: string;
  age: string;
  priceStart: string;
  description: string;
  contactPhone: string;
  whatsapp: string;
  telegram: string;
  website: string;
  height: string;
  dressSize: string;
  shoeSize: string;
  braSize: string;
  visitType: 'incall' | 'outcall' | 'both';
  services: string[];
}

interface StoredRegistrationState {
  registrationType: RegistrationType;
  step: number;
  formData: FormData;
}

const STORAGE_KEY = 'velvet_registration_state';

const DISTRICTS = [
  'Mitte', 'Charlottenburg', 'Kreuzberg', 'Prenzlauer Berg',
  'Friedrichshain', 'Schöneberg', 'Neukölln', 'Tempelhof',
  'Wilmersdorf', 'Steglitz', 'Spandau', 'Reinickendorf'
];

const SERVICES = [
  'Girlfriend Experience', 'Dinner Date', 'Travel Companion',
  'Overnight', 'Massage', 'Roleplay', 'Duo', 'Couples'
];

const DEFAULT_FORM_DATA: FormData = {
  authMethod: 'email',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  username: '',
  displayName: '',
  agencyName: '',
  district: 'Mitte',
  age: '',
  priceStart: '',
  description: '',
  contactPhone: '',
  whatsapp: '',
  telegram: '',
  website: '',
  height: '',
  dressSize: '',
  shoeSize: '',
  braSize: '',
  visitType: 'both',
  services: []
};

export default function RegisterPage() {
  const { register, isLoggingIn, isAuthenticated, isRegistering } = useAuth();
  const t = useTranslations();
  const router = useRouter();

  const [registrationType, setRegistrationType] = useState<RegistrationType>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);

  // Redirect if already authenticated (but NOT during registration process)
  useEffect(() => {
    if (isAuthenticated && !isRegistering && !isLoggingIn) {
      // Clear registration state when already logged in
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore errors
      }
      router.push('/dashboard');
    }
  }, [isAuthenticated, isRegistering, isLoggingIn, router]);

  // Load saved state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: StoredRegistrationState = JSON.parse(saved);
        if (parsed.registrationType) {
          setRegistrationType(parsed.registrationType);
          // Only restore step if it's not the final step (prevent auto-submit on reload)
          const maxSteps = parsed.registrationType === 'customer' ? 1 :
                          parsed.registrationType === 'model' ? 3 : 2;
          setStep(Math.min(parsed.step || 1, maxSteps));
          setFormData(parsed.formData || DEFAULT_FORM_DATA);
        }
      }
    } catch {
      // Ignore parse errors
    }
    setIsInitialized(true);
  }, []);

  // Save state to sessionStorage whenever it changes
  const saveState = useCallback(() => {
    if (!isInitialized) return;
    try {
      const state: StoredRegistrationState = {
        registrationType,
        step,
        formData
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [registrationType, step, formData, isInitialized]);

  useEffect(() => {
    saveState();
  }, [saveState]);

  // Clear saved state on successful registration
  const clearSavedState = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore errors
    }
  };

  const updateForm = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const validateStep = (): boolean => {
    setError('');

    if (registrationType === 'customer') {
      if (!formData.username || formData.username.length < 3) {
        setError(t('register.error_username_short'));
        return false;
      }
      if (!formData.password || formData.password.length < 6) {
        setError(t('register.error_password_short'));
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(t('register.error_password_match'));
        return false;
      }
    }

    if (registrationType === 'model') {
      if (step === 1) {
        if (formData.authMethod === 'email') {
          if (!formData.email || !formData.email.includes('@')) {
            setError(t('register.error_email_invalid'));
            return false;
          }
        } else {
          if (!formData.phone || formData.phone.length < 6) {
            setError(t('auth.error_phone_invalid'));
            return false;
          }
        }
        if (!formData.password || formData.password.length < 6) {
          setError(t('register.error_password_short'));
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError(t('register.error_password_match'));
          return false;
        }
      }
      if (step === 2) {
        if (!formData.displayName || formData.displayName.length < 2) {
          setError(t('register.error_name_required'));
          return false;
        }
        if (!formData.age || parseInt(formData.age) < 18) {
          setError(t('register.error_age_invalid'));
          return false;
        }
        if (!formData.contactPhone && !formData.whatsapp && !formData.telegram) {
          setError(t('register.error_contact_required'));
          return false;
        }
      }
    }

    if (registrationType === 'agency') {
      if (step === 1) {
        if (formData.authMethod === 'email') {
          if (!formData.email || !formData.email.includes('@')) {
            setError(t('register.error_email_invalid'));
            return false;
          }
        } else {
          if (!formData.phone || formData.phone.length < 6) {
            setError(t('auth.error_phone_invalid'));
            return false;
          }
        }
        if (!formData.password || formData.password.length < 6) {
          setError(t('register.error_password_short'));
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError(t('register.error_password_match'));
          return false;
        }
      }
      if (step === 2) {
        if (!formData.agencyName || formData.agencyName.length < 2) {
          setError(t('register.error_agency_name_required'));
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setError(''); // Clear any previous errors when advancing
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      setRegistrationType(null);
      // Clear saved state when going back to role selection
      clearSavedState();
    } else {
      setStep(prev => prev - 1);
    }
    setError('');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Only submit on the FINAL step - this is critical!
    const maxSteps = getMaxSteps();
    if (step !== maxSteps) {
      // If not on final step, do nothing (use Next button instead)
      return;
    }

    // Prevent double submission
    if (isLoggingIn || isSubmitting) return;

    if (!validateStep()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const role: UserRole = registrationType as UserRole;

      await register({
        email: formData.authMethod === 'email'
          ? (registrationType === 'customer'
            ? `${formData.username.toLowerCase()}@velvet-guest.com`
            : formData.email)
          : undefined,
        phone: formData.authMethod === 'phone' ? formData.phone : undefined,
        password: formData.password,
        username: formData.username || formData.displayName || formData.agencyName,
        displayName: formData.displayName,
        agencyName: formData.agencyName,
        district: formData.district,
        age: formData.age,
        priceStart: formData.priceStart ? parseFloat(formData.priceStart) : undefined,
        description: formData.description,
        contactPhone: formData.contactPhone,
        whatsapp: formData.whatsapp,
        telegram: formData.telegram,
        website: formData.website,
        height: formData.height ? parseInt(formData.height) : undefined,
        dressSize: formData.dressSize,
        shoeSize: formData.shoeSize ? parseInt(formData.shoeSize) : undefined,
        braSize: formData.braSize,
        services: formData.services,
        visitType: formData.visitType
      }, role);

      // Clear saved state on successful registration
      clearSavedState();

      // Force redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('register.error_generic'));
      setIsSubmitting(false);
    }
  };

  const getMaxSteps = () => {
    if (registrationType === 'customer') return 1;
    if (registrationType === 'model') return 3;
    if (registrationType === 'agency') return 2;
    return 1;
  };

  // Loading state while hydrating from storage
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Role Selection Screen
  if (!registrationType) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center px-4 py-12 animate-fade-in">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl text-white mb-4">{t('register.join')}</h1>
            <p className="text-neutral-400">{t('register.select_type')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Customer Card */}
            <button
              onClick={() => setRegistrationType('customer')}
              className="group bg-neutral-900/50 border border-neutral-800 rounded-sm p-8 text-left hover:border-luxury-gold transition-all duration-300"
            >
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-6 group-hover:bg-luxury-gold/20 transition-colors">
                <User className="w-8 h-8 text-neutral-400 group-hover:text-luxury-gold" />
              </div>
              <h3 className="text-white font-serif text-2xl mb-2">{t('register.guest')}</h3>
              <p className="text-neutral-500 text-sm mb-4">{t('register.guest_desc')}</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-neutral-400">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('register.guest_benefit_1')}
                </li>
                <li className="flex items-center gap-2 text-neutral-400">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('register.guest_benefit_2')}
                </li>
                <li className="flex items-center gap-2 text-neutral-400">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('register.guest_benefit_3')}
                </li>
              </ul>
            </button>

            {/* Model Card */}
            <button
              onClick={() => setRegistrationType('model')}
              className="group bg-neutral-900/50 border border-neutral-800 rounded-sm p-8 text-left hover:border-luxury-gold transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <span className="bg-luxury-gold text-black text-xs font-bold px-2 py-1 rounded-sm">
                  {t('register.popular')}
                </span>
              </div>
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-6 group-hover:bg-luxury-gold/20 transition-colors">
                <Camera className="w-8 h-8 text-neutral-400 group-hover:text-luxury-gold" />
              </div>
              <h3 className="text-white font-serif text-2xl mb-2">{t('register.model')}</h3>
              <p className="text-neutral-500 text-sm mb-4">{t('register.model_desc')}</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-neutral-400">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('register.model_benefit_1')}
                </li>
                <li className="flex items-center gap-2 text-neutral-400">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('register.model_benefit_2')}
                </li>
                <li className="flex items-center gap-2 text-neutral-400">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('register.model_benefit_3')}
                </li>
              </ul>
            </button>

            {/* Agency Card */}
            <button
              onClick={() => setRegistrationType('agency')}
              className="group bg-neutral-900/50 border border-neutral-800 rounded-sm p-8 text-left hover:border-luxury-gold transition-all duration-300"
            >
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-6 group-hover:bg-luxury-gold/20 transition-colors">
                <Building2 className="w-8 h-8 text-neutral-400 group-hover:text-luxury-gold" />
              </div>
              <h3 className="text-white font-serif text-2xl mb-2">{t('register.agency')}</h3>
              <p className="text-neutral-500 text-sm mb-4">{t('register.agency_desc')}</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-neutral-400">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('register.agency_benefit_1')}
                </li>
                <li className="flex items-center gap-2 text-neutral-400">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('register.agency_benefit_2')}
                </li>
                <li className="flex items-center gap-2 text-neutral-400">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('register.agency_benefit_3')}
                </li>
              </ul>
            </button>
          </div>

          <div className="text-center mt-8">
            <p className="text-neutral-500 text-sm">
              {t('register.already_member')}{' '}
              <Link href="/login" className="text-luxury-gold hover:underline">
                {t('register.login_here')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="max-w-lg w-full bg-neutral-900/50 border border-neutral-800 rounded-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('register.back')}
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-luxury-gold/20 rounded-full flex items-center justify-center">
              {registrationType === 'customer' && <User className="w-6 h-6 text-luxury-gold" />}
              {registrationType === 'model' && <Camera className="w-6 h-6 text-luxury-gold" />}
              {registrationType === 'agency' && <Building2 className="w-6 h-6 text-luxury-gold" />}
            </div>
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-widest">{t('register.creating')}</p>
              <h2 className="text-white font-serif text-xl">
                {registrationType === 'customer' && t('register.guest')}
                {registrationType === 'model' && t('register.model')}
                {registrationType === 'agency' && t('register.agency')}
              </h2>
            </div>
          </div>

          {/* Progress Steps */}
          {getMaxSteps() > 1 && (
            <div className="flex gap-2 mt-6">
              {Array.from({ length: getMaxSteps() }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i + 1 <= step ? 'bg-luxury-gold' : 'bg-neutral-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Form Content - Using div instead of form to prevent auto-submit */}
        <div className="p-6 space-y-6">
          {/* Customer Registration - Single Step */}
          {registrationType === 'customer' && (
            <>
              <div className="text-center mb-6">
                <Sparkles className="w-8 h-8 text-luxury-gold mx-auto mb-2" />
                <h3 className="text-white font-serif text-lg">{t('register.guest_welcome')}</h3>
                <p className="text-neutral-500 text-sm">{t('register.guest_anon_note')}</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('login.username')} *
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => updateForm('username', e.target.value)}
                  placeholder={t('register.username_placeholder')}
                  error={!!error}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('login.password')} *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateForm('password', e.target.value)}
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
                  {t('register.confirm_password')} *
                </label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateForm('confirmPassword', e.target.value)}
                  placeholder={t('register.confirm_placeholder')}
                  error={!!error}
                />
              </div>
            </>
          )}

          {/* Model Registration - Step 1: Credentials */}
          {registrationType === 'model' && step === 1 && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-white font-serif text-lg">{t('register.step1_title')}</h3>
                <p className="text-neutral-500 text-sm">{t('register.step1_desc')}</p>
              </div>

              {/* Auth Method Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => updateForm('authMethod', 'email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-sm border transition-all ${
                    formData.authMethod === 'email'
                      ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{t('auth.with_email')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm('authMethod', 'phone')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-sm border transition-all ${
                    formData.authMethod === 'phone'
                      ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{t('auth.with_phone')}</span>
                </button>
              </div>

              {formData.authMethod === 'email' ? (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    {t('login.email')} *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="email@example.com"
                    error={!!error}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    {t('auth.phone_number')} *
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="+49 123 456789"
                    error={!!error}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('login.password')} *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateForm('password', e.target.value)}
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
                  {t('register.confirm_password')} *
                </label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateForm('confirmPassword', e.target.value)}
                  placeholder={t('register.confirm_placeholder')}
                  error={!!error}
                />
              </div>
            </>
          )}

          {/* Model Registration - Step 2: Profile Basics */}
          {registrationType === 'model' && step === 2 && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-white font-serif text-lg">{t('register.step2_title')}</h3>
                <p className="text-neutral-500 text-sm">{t('register.step2_desc')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    {t('register.display_name')} *
                  </label>
                  <Input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => updateForm('displayName', e.target.value)}
                    placeholder={t('register.display_name_placeholder')}
                    error={!!error}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    {t('attr.age')} *
                  </label>
                  <Input
                    type="number"
                    min="18"
                    max="99"
                    value={formData.age}
                    onChange={(e) => updateForm('age', e.target.value)}
                    placeholder="25"
                    error={!!error}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {t('search.district')} *
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => updateForm('district', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-sm px-4 py-2.5 text-white focus:border-luxury-gold focus:outline-none"
                  >
                    {DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('register.contact_method')} *
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-neutral-500" />
                    <Input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => updateForm('contactPhone', e.target.value)}
                      placeholder={t('register.phone_placeholder')}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <Input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => updateForm('whatsapp', e.target.value)}
                      placeholder="WhatsApp"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                    <Input
                      type="text"
                      value={formData.telegram}
                      onChange={(e) => updateForm('telegram', e.target.value)}
                      placeholder="Telegram @username"
                      className="flex-1"
                    />
                  </div>
                </div>
                <p className="text-neutral-600 text-xs mt-2">{t('register.contact_hint')}</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('visit.title')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['incall', 'outcall', 'both'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateForm('visitType', type)}
                      className={`p-3 rounded-sm border text-center transition-all ${
                        formData.visitType === type
                          ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                          : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                      }`}
                    >
                      <span className="text-sm">{t(`visit.${type}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Model Registration - Step 3: Additional Details */}
          {registrationType === 'model' && step === 3 && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-white font-serif text-lg">{t('register.step3_title')}</h3>
                <p className="text-neutral-500 text-sm">{t('register.step3_desc')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    {t('attr.height')} (cm)
                  </label>
                  <Input
                    type="number"
                    min="100"
                    max="220"
                    value={formData.height}
                    onChange={(e) => updateForm('height', e.target.value)}
                    placeholder="170"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    {t('attr.hourly_rate')} (EUR)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.priceStart}
                    onChange={(e) => updateForm('priceStart', e.target.value)}
                    placeholder="150"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    {t('attr.dress')}
                  </label>
                  <Input
                    type="text"
                    value={formData.dressSize}
                    onChange={(e) => updateForm('dressSize', e.target.value)}
                    placeholder="36"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    {t('attr.bra')}
                  </label>
                  <Input
                    type="text"
                    value={formData.braSize}
                    onChange={(e) => updateForm('braSize', e.target.value)}
                    placeholder="75B"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('dashboard.services')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map(service => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`px-3 py-1.5 rounded-sm text-sm transition-all ${
                        formData.services.includes(service)
                          ? 'bg-luxury-gold text-black'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('profile.about')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder={t('register.description_placeholder')}
                  rows={4}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-sm px-4 py-2.5 text-white placeholder:text-neutral-500 focus:border-luxury-gold focus:outline-none resize-none"
                />
              </div>
            </>
          )}

          {/* Agency Registration - Step 1: Credentials */}
          {registrationType === 'agency' && step === 1 && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-white font-serif text-lg">{t('register.agency_step1_title')}</h3>
                <p className="text-neutral-500 text-sm">{t('register.agency_step1_desc')}</p>
              </div>

              {/* Auth Method Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => updateForm('authMethod', 'email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-sm border transition-all ${
                    formData.authMethod === 'email'
                      ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{t('auth.with_email')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm('authMethod', 'phone')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-sm border transition-all ${
                    formData.authMethod === 'phone'
                      ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{t('auth.with_phone')}</span>
                </button>
              </div>

              {formData.authMethod === 'email' ? (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    {t('login.email')} *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="agency@example.com"
                    error={!!error}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    {t('auth.phone_number')} *
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="+49 123 456789"
                    error={!!error}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('login.password')} *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateForm('password', e.target.value)}
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
                  {t('register.confirm_password')} *
                </label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateForm('confirmPassword', e.target.value)}
                  placeholder={t('register.confirm_placeholder')}
                  error={!!error}
                />
              </div>
            </>
          )}

          {/* Agency Registration - Step 2: Agency Details */}
          {registrationType === 'agency' && step === 2 && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-white font-serif text-lg">{t('register.agency_step2_title')}</h3>
                <p className="text-neutral-500 text-sm">{t('register.agency_step2_desc')}</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('register.agency_name')} *
                </label>
                <Input
                  type="text"
                  value={formData.agencyName}
                  onChange={(e) => updateForm('agencyName', e.target.value)}
                  placeholder={t('register.agency_name_placeholder')}
                  error={!!error}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {t('search.district')}
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => updateForm('district', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-sm px-4 py-2.5 text-white focus:border-luxury-gold focus:outline-none"
                >
                  {DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('register.contact_info')}
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-neutral-500" />
                    <Input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => updateForm('contactPhone', e.target.value)}
                      placeholder={t('register.phone_placeholder')}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-neutral-500" />
                    <Input
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateForm('website', e.target.value)}
                      placeholder="https://www.your-agency.com"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                  {t('register.agency_description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder={t('register.agency_desc_placeholder')}
                  rows={4}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-sm px-4 py-2.5 text-white placeholder:text-neutral-500 focus:border-luxury-gold focus:outline-none resize-none"
                />
              </div>
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="text-red-400 text-sm p-3 bg-red-900/20 border border-red-500/30 rounded-sm flex items-center gap-2">
              <span className="text-red-400">!</span> {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('register.back')}
              </Button>
            )}

            {step < getMaxSteps() ? (
              <Button type="button" onClick={handleNext} fullWidth={step === 1}>
                {t('register.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} fullWidth={step === 1} disabled={isLoggingIn || isSubmitting}>
                {(isLoggingIn || isSubmitting) ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('register.creating')}...
                  </span>
                ) : (
                  <>
                    {t('register.complete')}
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Terms Notice */}
          <p className="text-neutral-600 text-xs text-center">
            {t('register.terms_notice')}{' '}
            <Link href="/terms" className="text-luxury-gold hover:underline">{t('footer.terms')}</Link>
            {' '}{t('common.and')}{' '}
            <Link href="/privacy" className="text-luxury-gold hover:underline">{t('footer.privacy')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
