'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/lib/auth-context';
import { Profile, District } from '@/lib/types';
import { Button } from '@/components/ui';
import { ProfileCard } from '@/components/ProfileCard';
import {
  BarChart3, Image as ImageIcon, CreditCard, Heart, LogOut,
  Save, Check, Eye, EyeOff, Trash2, AlertCircle, Upload,
  Phone, MessageCircle, User, Euro, Sparkles
} from 'lucide-react';

type DashboardTab = 'overview' | 'profile' | 'billing' | 'account';

const AVAILABLE_LANGUAGES = [
  'Deutsch', 'English', 'Русский', 'Español', 'Français',
  'Italiano', 'Polski', 'Türkçe', 'العربية', 'فارسی',
  'Português', 'Nederlands', 'Čeština', 'Magyar', 'Română'
];

const SERVICE_CATEGORIES: Record<string, { label: string; services: string[] }> = {
  core: { label: 'Core Services', services: ['Escort Service', 'Outcall', 'Incall', 'Overnight possibility', 'Dinner Date', 'Travel Companion'] },
  oral: { label: 'Oral Services', services: ['BJ Natur INCLUDED IN PRICE', 'BJ Natur extra price', 'BJ with Condom', 'Swallow', 'Cum in Mouth (CIM)', 'Cum on Body', 'Cum on Face', 'Deep Throat'] },
  intimacy: { label: 'Intimacy', services: ['Kiss', 'Tongue kiss', 'French Kissing', 'Girlfriend Experience'] },
  positions: { label: 'Positions & Acts', services: ['69 Position', 'Anal', 'Rimming', 'Prostate massage', 'Spanish'] },
  special: { label: 'Special / Fetish', services: ['BDSM', 'BDSM Light', 'Devote Spiele', 'Dominante Spiele', 'Rollen Spiele', 'Golden Shower Aktiv', 'Golden Shower Passiv', 'Kinky / Fetish'] },
  group: { label: 'Group', services: ['Couple', 'Sex with two men', 'Threesome (2 Girls)'] },
  other: { label: 'Massage & Other', services: ['Erotic Massage', 'Body to Body Massage', 'Striptease'] }
};

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [favoriteProfiles, setFavoriteProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login?redirect=/dashboard');
    } else if (user?.role === 'admin') {
      router.push('/vb-control');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (user.role === 'customer') {
        if (user.favorites && user.favorites.length > 0) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .in('id', user.favorites);
          setFavoriteProfiles(data || []);
        }
      } else if (user.role === 'model' && user.profileId) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.profileId)
          .single();
        setMyProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Customer Dashboard - Favorites
  if (user.role === 'customer') {
    return (
      <div className="min-h-screen bg-luxury-black pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10 border-b border-neutral-800 pb-6">
            <div>
              <h1 className="font-serif text-4xl text-white mb-2">{t('my_favorites')}</h1>
              <p className="text-neutral-400">{t('favorites_welcome', { name: user.username })}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex gap-2 items-center">
              <LogOut size={16} /> {t('logout')}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : favoriteProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {favoriteProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-sm">
              <Heart size={48} className="mx-auto text-neutral-700 mb-4" />
              <h3 className="text-xl text-white font-serif mb-2">{t('no_favorites')}</h3>
              <p className="text-neutral-500 mb-6">{t('no_favorites_desc')}</p>
              <Button onClick={() => router.push('/search')}>{t('browse_escorts')}</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Model Dashboard
  return (
    <div className="min-h-screen bg-luxury-black pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-serif text-3xl text-white">{t('model_dashboard')}</h1>
            {myProfile && (
              <p className="text-luxury-gold text-sm mt-1">{myProfile.name}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-neutral-500 text-sm">
              {user.username}
            </span>
            <button onClick={handleLogout} className="text-neutral-400 hover:text-white text-sm flex items-center gap-1">
              <LogOut size={14} /> {t('logout')}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-neutral-900/50 p-1 rounded-lg w-fit">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart3 size={16} />} label={t('overview')} />
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={16} />} label={t('edit_profile')} />
          <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={<CreditCard size={16} />} label={t('billing')} />
          <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={<Eye size={16} />} label={t('account_settings')} />
        </div>

        {/* Content */}
        <div className="min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mb-4" />
            </div>
          ) : !myProfile ? (
            <div className="bg-red-900/20 border border-red-900/50 p-6 text-red-200 rounded-lg">
              <strong>No Profile Found:</strong> Your account is not linked to a profile.
            </div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab profile={myProfile} setActiveTab={setActiveTab} />}
              {activeTab === 'profile' && <ProfileEditor profile={myProfile} onUpdate={fetchUserData} />}
              {activeTab === 'billing' && <BillingTab profile={myProfile} />}
              {activeTab === 'account' && <AccountTab profile={myProfile} onUpdate={fetchUserData} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
        active
          ? 'bg-luxury-gold text-black'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
      }`}
    >
      {icon} {label}
    </button>
  );
}

// Overview Tab
function OverviewTab({ profile, setActiveTab }: { profile: Profile; setActiveTab: (tab: DashboardTab) => void }) {
  const t = useTranslations('dashboard');
  const supabase = createClient();
  const [isOnline, setIsOnline] = useState(profile.isOnline || false);

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    await supabase
      .from('profiles')
      .update({ isOnline: newStatus, lastActive: new Date().toISOString() })
      .eq('id', profile.id);
  };

  const metrics = {
    views: profile.clicks || 0,
    contacts: Math.floor((profile.clicks || 0) / 15),
    searches: (profile.clicks || 0) * 8,
    favorites: Math.floor((profile.clicks || 0) / 30)
  };

  const completionItems = [
    { label: 'Photos', done: (profile.images?.length || 0) > 0 },
    { label: 'Description', done: !!profile.description },
    { label: 'Services', done: (profile.services?.length || 0) > 0 },
    { label: 'Contact', done: !!(profile.phone || profile.whatsapp || profile.telegram) },
  ];
  const completionPercent = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100);

  return (
    <div className="space-y-6">
      {/* Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Online Toggle */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wider mb-1">{t('availability')}</p>
              <p className={`text-lg font-semibold ${isOnline ? 'text-green-400' : 'text-neutral-500'}`}>
                {isOnline ? t('available') : t('not_available')}
              </p>
            </div>
            <button
              onClick={toggleOnlineStatus}
              className={`relative w-14 h-8 rounded-full transition-colors ${isOnline ? 'bg-green-600' : 'bg-neutral-700'}`}
            >
              <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${isOnline ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <p className="text-neutral-400 text-xs uppercase tracking-wider mb-2">{t('profile_completion')}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-luxury-gold transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
            <span className="text-white font-bold">{completionPercent}%</span>
          </div>
          <div className="flex gap-2 mt-3">
            {completionItems.map(item => (
              <span key={item.label} className={`text-xs px-2 py-1 rounded ${item.done ? 'bg-green-900/30 text-green-400' : 'bg-neutral-800 text-neutral-500'}`}>
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Package Status */}
        <div className={`border rounded-lg p-5 ${profile.isVerified ? (profile.isPremium ? 'bg-luxury-gold/10 border-luxury-gold' : 'bg-neutral-900 border-neutral-800') : 'bg-amber-900/10 border-amber-800'}`}>
          {profile.isVerified ? (
            <>
              <p className="text-neutral-400 text-xs uppercase tracking-wider mb-1">Package</p>
              <p className="text-lg font-semibold text-white">{profile.isPremium ? t('premium_package') : t('standard_package')}</p>
              <Button
                variant={profile.isPremium ? 'outline' : 'primary'}
                className="w-full mt-3 !py-2 !text-xs"
                onClick={() => setActiveTab('billing')}
              >
                {profile.isPremium ? t('extend_package') : t('upgrade_now')}
              </Button>
            </>
          ) : (
            <>
              <p className="text-amber-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertCircle size={12} /> {t('profile_not_verified')}
              </p>
              <p className="text-neutral-400 text-sm">{t('verification_pending')}</p>
            </>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label={t('profile_views')} value={metrics.views} emoji="👁️" />
        <MetricCard label={t('contact_clicks')} value={metrics.contacts} emoji="📞" />
        <MetricCard label={t('search_appearances')} value={metrics.searches} emoji="🔍" />
        <MetricCard label={t('favorited_by')} value={metrics.favorites} emoji="❤️" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickActionCard icon={<User size={20} />} label={t('edit_profile')} onClick={() => setActiveTab('profile')} />
        <QuickActionCard icon={<ImageIcon size={20} />} label={t('add_photos')} onClick={() => setActiveTab('profile')} />
        <QuickActionCard icon={<Sparkles size={20} />} label={t('update_services')} onClick={() => setActiveTab('profile')} />
        <QuickActionCard icon={<CreditCard size={20} />} label={t('view_packages')} onClick={() => setActiveTab('billing')} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <span className="text-2xl">{emoji}</span>
      <p className="text-2xl font-bold text-white mt-2">{value.toLocaleString()}</p>
      <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function QuickActionCard({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-neutral-900 border border-neutral-800 hover:border-luxury-gold rounded-lg p-4 transition-all group text-left">
      <div className="text-neutral-400 group-hover:text-luxury-gold mb-2">{icon}</div>
      <p className="text-sm text-neutral-300 group-hover:text-white">{label}</p>
    </button>
  );
}

// Unified Profile Editor Tab
function ProfileEditor({ profile, onUpdate }: { profile: Profile; onUpdate: () => void }) {
  const t = useTranslations('dashboard');
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: profile.name,
    age: profile.age,
    priceStart: profile.priceStart,
    description: profile.description,
    district: profile.district,
    phone: profile.phone || '',
    whatsapp: profile.whatsapp || '',
    telegram: profile.telegram || '',
    services: (profile.services || []) as string[],
    languages: profile.languages || [],
    visitType: profile.visitType || 'both',
    images: profile.images || []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeSection, setActiveSection] = useState<string>('basic');

  const updateField = <K extends keyof typeof formData>(key: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const toggleService = (service: string) => {
    const newServices = formData.services.includes(service)
      ? formData.services.filter(s => s !== service)
      : [...formData.services, service];
    updateField('services', newServices);
  };

  const toggleLanguage = (lang: string) => {
    const newLangs = formData.languages.includes(lang)
      ? formData.languages.filter(l => l !== lang)
      : [...formData.languages, lang];
    updateField('languages', newLangs);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const uploadFormData = new FormData();
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setUploadError('Only image files allowed');
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setUploadError('Max 5MB per image');
          continue;
        }
        uploadFormData.append('images', file);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const result = await response.json();

      if (result.success && result.urls) {
        updateField('images', [...formData.images, ...result.urls]);
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = formData.images[index];

    // Try to delete from server if it's a local upload
    if (imageUrl.startsWith('/uploads/')) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: [imageUrl] })
        });
      } catch (e) {
        console.error('Failed to delete from server:', e);
      }
    }

    updateField('images', formData.images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({
          name: formData.name,
          age: formData.age,
          priceStart: formData.priceStart,
          description: formData.description,
          district: formData.district,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          telegram: formData.telegram,
          services: formData.services,
          languages: formData.languages,
          visitType: formData.visitType,
          images: formData.images
        })
        .eq('id', profile.id);

      setSaveSuccess(true);
      onUpdate();
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: <User size={16} /> },
    { id: 'photos', label: 'Photos', icon: <ImageIcon size={16} />, count: formData.images.length },
    { id: 'services', label: 'Services', icon: <Sparkles size={16} />, count: formData.services.length },
    { id: 'contact', label: 'Contact', icon: <Phone size={16} /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Section Navigation */}
      <div className="lg:col-span-1">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 space-y-1 sticky top-24">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-sm transition-all ${
                activeSection === section.id
                  ? 'bg-luxury-gold/10 text-luxury-gold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <span className="flex items-center gap-2">{section.icon} {section.label}</span>
              {section.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeSection === section.id ? 'bg-luxury-gold/20' : 'bg-neutral-800'}`}>
                  {section.count}
                </span>
              )}
            </button>
          ))}

          <div className="border-t border-neutral-800 pt-3 mt-3">
            <Button onClick={handleSave} fullWidth disabled={isSaving} className="flex items-center justify-center gap-2">
              {saveSuccess ? <Check size={16} /> : <Save size={16} />}
              {isSaving ? 'Saving...' : saveSuccess ? t('saved') : t('save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="lg:col-span-3 space-y-6">
        {/* Basic Info Section */}
        {activeSection === 'basic' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User size={18} className="text-luxury-gold" /> Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label={t('name')} value={formData.name} onChange={v => updateField('name', v)} />
              <InputField label={t('age')} type="number" value={formData.age} onChange={v => updateField('age', Number(v))} />
              <InputField label={t('hourly_rate')} type="number" value={formData.priceStart} onChange={v => updateField('priceStart', Number(v))} icon={<Euro size={16} />} />
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('district')}</label>
                <select
                  value={formData.district}
                  onChange={e => updateField('district', e.target.value as District)}
                  className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                >
                  {Object.values(District).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('about')}</label>
              <textarea
                value={formData.description}
                onChange={e => updateField('description', e.target.value)}
                rows={4}
                className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none resize-none"
                placeholder="Tell clients about yourself..."
              />
            </div>

            {/* Visit Type */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-3">{t('visit_type')}</label>
              <div className="grid grid-cols-3 gap-3">
                {(['incall', 'outcall', 'both'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => updateField('visitType', type)}
                    className={`py-3 px-4 rounded-md border text-sm font-medium transition-all ${
                      formData.visitType === type
                        ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                        : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    {type === 'incall' ? '🏠 My Place' : type === 'outcall' ? '🚗 Your Place' : '✨ Both'}
                  </button>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-3">{t('select_languages')}</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      formData.languages.includes(lang)
                        ? 'bg-luxury-gold text-black'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Photos Section */}
        {activeSection === 'photos' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-luxury-gold" /> {t('my_photos')}
              </h3>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                {isUploading ? 'Uploading...' : t('upload_photos')}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />

            {uploadError && (
              <div className="bg-red-900/20 border border-red-900/50 p-3 text-red-300 rounded-md text-sm">
                {uploadError}
              </div>
            )}

            <p className="text-neutral-500 text-sm">{t('upload_hint')} - First image is your main photo.</p>

            {formData.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((img, i) => (
                  <div key={i} className="relative group aspect-[3/4] bg-neutral-800 rounded-lg overflow-hidden">
                    <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => removeImage(i)}
                        className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {i === 0 && (
                      <div className="absolute top-2 left-2 bg-luxury-gold text-black text-xs font-bold px-2 py-1 rounded">
                        {t('main_photo')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-neutral-700 rounded-lg p-12 text-center">
                <ImageIcon size={48} className="mx-auto text-neutral-600 mb-3" />
                <p className="text-neutral-500 mb-4">{t('no_images')}</p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} className="mr-2" /> {t('upload_photos')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Services Section */}
        {activeSection === 'services' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-luxury-gold" /> {t('select_services')}
              </h3>
              <span className="text-luxury-gold text-sm">{formData.services.length} selected</span>
            </div>

            <p className="text-neutral-500 text-sm">{t('services_hint')}</p>

            <div className="space-y-6">
              {Object.entries(SERVICE_CATEGORIES).map(([key, { label, services }]) => (
                <div key={key}>
                  <h4 className="text-luxury-gold text-xs uppercase tracking-wider font-bold mb-3 pb-2 border-b border-neutral-800">
                    {label}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {services.map(service => (
                      <label
                        key={service}
                        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all ${
                          formData.services.includes(service)
                            ? 'bg-luxury-gold/10 border border-luxury-gold/30'
                            : 'bg-neutral-950 border border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service)}
                          onChange={() => toggleService(service)}
                          className="w-4 h-4 accent-luxury-gold rounded"
                        />
                        <span className={`text-sm ${formData.services.includes(service) ? 'text-white' : 'text-neutral-400'}`}>
                          {service}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Section */}
        {activeSection === 'contact' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Phone size={18} className="text-luxury-gold" /> Contact Information
            </h3>

            <p className="text-neutral-500 text-sm">At least one contact method is required.</p>

            <div className="space-y-4">
              <InputField
                label={t('phone')}
                value={formData.phone}
                onChange={v => updateField('phone', v)}
                icon={<Phone size={16} />}
                placeholder="+49 123 456789"
              />
              <InputField
                label={t('whatsapp')}
                value={formData.whatsapp}
                onChange={v => updateField('whatsapp', v)}
                icon={<MessageCircle size={16} />}
                placeholder="+49 123 456789"
              />
              <InputField
                label={t('telegram')}
                value={formData.telegram}
                onChange={v => updateField('telegram', v)}
                icon={<MessageCircle size={16} />}
                placeholder="@username"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  icon,
  placeholder
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  icon?: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none ${icon ? 'pl-10' : ''}`}
        />
      </div>
    </div>
  );
}

// Billing Tab
function BillingTab({ profile }: { profile: Profile }) {
  const t = useTranslations('dashboard');
  const router = useRouter();

  if (!profile.isVerified) {
    return (
      <div className="bg-amber-900/10 border border-amber-800 rounded-lg p-8 text-center">
        <AlertCircle className="mx-auto text-amber-400 mb-4" size={48} />
        <h3 className="text-xl font-serif text-white mb-2">{t('profile_not_verified')}</h3>
        <p className="text-neutral-400">{t('verification_pending')}</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 text-center">
      <CreditCard className="mx-auto text-neutral-600 mb-4" size={48} />
      <h3 className="text-xl font-serif text-white mb-2">{t('upgrade_visibility')}</h3>
      <p className="text-neutral-400 mb-6">Get more visibility with our premium packages.</p>
      <Button onClick={() => router.push('/packages')}>{t('view_packages')}</Button>
    </div>
  );
}

// Account Tab
function AccountTab({ profile, onUpdate }: { profile: Profile; onUpdate: () => void }) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { logout } = useAuth();
  const supabase = createClient();
  const [isDisabled, setIsDisabled] = useState(profile.isDisabled || false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleDisabled = async () => {
    setIsSaving(true);
    const newState = !isDisabled;
    await supabase.from('profiles').update({ isDisabled: newState }).eq('id', profile.id);
    setIsDisabled(newState);
    onUpdate();
    setIsSaving(false);
  };

  const handleDelete = async () => {
    await supabase.from('profiles').delete().eq('id', profile.id);
    await logout();
    router.push('/');
  };

  return (
    <div className="space-y-6">
      {/* Visibility */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isDisabled ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
              {isDisabled ? <EyeOff size={24} /> : <Eye size={24} />}
            </div>
            <div>
              <h3 className="text-white font-semibold">{t('profile_visibility')}</h3>
              <p className="text-neutral-500 text-sm">
                {isDisabled ? t('profile_disabled') : t('profile_enabled')}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDisabled}
            disabled={isSaving}
            className={`px-5 py-2.5 rounded-md font-medium text-sm transition-all ${
              isDisabled
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
            }`}
          >
            {isSaving ? '...' : isDisabled ? t('enable_profile') : t('disable_profile')}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-6">
        <h3 className="text-red-400 text-sm uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
          <AlertCircle size={16} /> {t('danger_zone')}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-semibold">{t('delete_profile')}</h4>
            <p className="text-neutral-500 text-sm">{t('delete_profile_desc')}</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-md font-medium text-sm flex items-center gap-2"
          >
            <Trash2 size={16} /> {t('delete_profile')}
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-900/50 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-900/30 rounded-full">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <h3 className="text-xl font-serif text-white">{t('delete_confirm_title')}</h3>
            </div>
            <p className="text-neutral-400 mb-6">{t('delete_confirm_desc')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-md font-medium flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> {t('delete_confirm_button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
