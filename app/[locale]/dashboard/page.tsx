'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/lib/auth-context';
import { Profile } from '@/lib/types';
import { Button } from '@/components/ui';
import { ProfileCard } from '@/components/ProfileCard';
import {
  BarChart3, Image as ImageIcon, CreditCard, Settings, Heart, LogOut,
  Save, Check, Users, Eye, EyeOff, Trash2, AlertCircle
} from 'lucide-react';

type DashboardTab = 'overview' | 'services' | 'photos' | 'billing' | 'settings' | 'account';

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

  // Redirect if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login?redirect=/dashboard');
    } else if (user?.role === 'admin') {
      router.push('/vb-control');
    }
  }, [isAuthenticated, user, router]);

  // Fetch user data
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
        // Fetch favorites for customers
        if (user.favorites && user.favorites.length > 0) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .in('id', user.favorites);
          setFavoriteProfiles(data || []);
        }
      } else if (user.role === 'model' && user.profileId) {
        // Fetch model's own profile
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

  // Customer Dashboard
  if (user.role === 'customer') {
    return (
      <div className="min-h-screen bg-luxury-black pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10 border-b border-neutral-800 pb-6">
            <div>
              <h1 className="font-serif text-4xl text-white mb-2">{t('my_favorites')}</h1>
              <p className="text-neutral-400">{t('favorites_welcome').replace('{name}', user.username)}</p>
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-3xl text-white">
              {user.role === 'model' ? t('model_dashboard') : t('agency_management')}
            </h1>
            {myProfile && (
              <p className="text-luxury-gold text-sm mt-1">{t('editing_profile')}: {myProfile.name}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-neutral-400 text-sm">
              {t('logged_in_as')} <span className="text-white font-bold">{user.username}</span>
            </span>
            <button onClick={handleLogout} className="text-neutral-500 hover:text-white">
              {t('logout')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <div className="lg:col-span-1 space-y-2">
            <NavButton icon={<BarChart3 size={18} />} label={t('overview')} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <NavButton icon={<ImageIcon size={18} />} label={t('my_photos')} active={activeTab === 'photos'} onClick={() => setActiveTab('photos')} />
            <NavButton icon={<CreditCard size={18} />} label={t('billing')} active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
            <NavButton icon={<Settings size={18} />} label={t('settings')} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            <NavButton icon={<Users size={18} />} label={t('account_settings')} active={activeTab === 'account'} onClick={() => setActiveTab('account')} />
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 bg-neutral-900/50 border border-neutral-800 p-8 min-h-[500px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-luxury-gold text-sm uppercase tracking-widest">Loading...</p>
              </div>
            ) : !myProfile ? (
              <div className="bg-red-900/20 border border-red-900/50 p-4 text-red-200 rounded-sm">
                <strong>No Profile Found:</strong> Your account is not linked to a profile.
                Please contact support if you believe this is an error.
              </div>
            ) : (
              <>
                {activeTab === 'overview' && <ModelOverview profile={myProfile} setActiveTab={setActiveTab} />}
                {activeTab === 'photos' && <ModelPhotos profile={myProfile} onUpdate={fetchUserData} />}
                {activeTab === 'billing' && <ModelBilling />}
                {activeTab === 'settings' && <ModelSettings profile={myProfile} onUpdate={fetchUserData} />}
                {activeTab === 'account' && <ModelAccount profile={myProfile} onUpdate={fetchUserData} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Navigation Button Component
function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-luxury-gold/10 text-luxury-gold border-r-2 border-luxury-gold'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
      }`}
    >
      {icon} {label}
    </button>
  );
}

// Model Overview Tab
function ModelOverview({ profile, setActiveTab }: { profile: Profile; setActiveTab: (tab: DashboardTab) => void }) {
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
    totalViews: profile.clicks || 0,
    contacts: Math.floor((profile.clicks || 0) / 15),
    searches: (profile.clicks || 0) * 8,
    favorites: Math.floor((profile.clicks || 0) / 30)
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800 pb-6">
        <h2 className="font-serif text-3xl text-white mb-2">{t('welcome')}, {profile.name}!</h2>
        <p className="text-neutral-400 text-sm">{t('performance')}</p>
      </div>

      {/* Availability Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold mb-1">{t('availability')}</h3>
              <p className="text-neutral-500 text-xs">{t('availability_desc')}</p>
            </div>
            <button
              onClick={toggleOnlineStatus}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isOnline ? 'bg-green-600' : 'bg-neutral-700'
              }`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isOnline ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-neutral-600'}`} />
            <span className={`text-sm font-medium ${isOnline ? 'text-green-500' : 'text-neutral-500'}`}>
              {isOnline ? t('available') : t('not_available')}
            </span>
          </div>
        </div>

        {/* Package Status */}
        <div className={`border p-6 rounded-sm ${profile.isPremium ? 'bg-luxury-gold/5 border-luxury-gold' : 'bg-neutral-950 border-neutral-800'}`}>
          <h3 className="text-white font-semibold mb-1">
            {profile.isPremium ? `Premium Package` : `Standard Package`}
          </h3>
          <p className="text-neutral-500 text-xs mb-4">
            {profile.isPremium ? 'Enhanced visibility' : t('upgrade_visibility')}
          </p>
          <Button
            variant={profile.isPremium ? 'outline' : 'primary'}
            className="w-full !py-2 !text-sm"
            onClick={() => setActiveTab('billing')}
          >
            {profile.isPremium ? t('extend_package') : t('upgrade_now')}
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div>
        <h3 className="text-luxury-gold text-sm uppercase tracking-widest font-bold mb-4">{t('metrics_title')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label={t('profile_views')} value={metrics.totalViews.toLocaleString()} icon="views" />
          <MetricCard label={t('contact_clicks')} value={metrics.contacts.toString()} icon="contacts" />
          <MetricCard label={t('search_appearances')} value={metrics.searches.toLocaleString()} icon="searches" />
          <MetricCard label={t('favorited_by')} value={metrics.favorites.toString()} icon="favorites" />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-luxury-gold text-sm uppercase tracking-widest font-bold mb-4">{t('quick_actions')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction icon={<Settings size={20} />} label={t('edit_profile')} onClick={() => setActiveTab('settings')} />
          <QuickAction icon={<ImageIcon size={20} />} label={t('add_photos')} onClick={() => setActiveTab('photos')} />
          <QuickAction icon={<CreditCard size={20} />} label={t('view_packages')} onClick={() => setActiveTab('billing')} />
          <QuickAction icon={<Users size={20} />} label={t('account_settings')} onClick={() => setActiveTab('account')} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  const icons: Record<string, string> = {
    views: '👁️', contacts: '📞', searches: '🔍', favorites: '❤️'
  };
  return (
    <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-sm">
      <span className="text-2xl mb-2 block">{icons[icon]}</span>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-neutral-950 border border-neutral-800 hover:border-luxury-gold p-4 rounded-sm transition-all group flex flex-col items-center gap-2"
    >
      <div className="text-neutral-400 group-hover:text-luxury-gold transition-colors">{icon}</div>
      <span className="text-xs text-neutral-400 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}

// Model Photos Tab
function ModelPhotos({ profile, onUpdate }: { profile: Profile; onUpdate: () => void }) {
  const t = useTranslations('dashboard');
  const supabase = createClient();
  const [images, setImages] = useState<string[]>(profile.images || []);
  const [isSaved, setIsSaved] = useState(false);

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setIsSaved(false);
  };

  const handleSave = async () => {
    await supabase
      .from('profiles')
      .update({ images })
      .eq('id', profile.id);
    setIsSaved(true);
    onUpdate();
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-6">
        <div>
          <h2 className="font-serif text-3xl text-white">{t('my_photos')}</h2>
          <p className="text-neutral-400 text-sm mt-1">{images.length} images</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2">
          {isSaved ? <Check size={16} /> : <Save size={16} />}
          {isSaved ? t('saved') : t('save')}
        </Button>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-[3/4] bg-neutral-800 border border-neutral-700 rounded-sm overflow-hidden">
              <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => removeImage(i)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
              {i === 0 && (
                <div className="absolute top-2 left-2 bg-luxury-gold text-black text-xs font-bold px-2 py-1 rounded">
                  Main Photo
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-neutral-700 rounded-sm">
          <ImageIcon size={48} className="mx-auto text-neutral-600 mb-3" />
          <p className="text-neutral-500">No images yet.</p>
        </div>
      )}
    </div>
  );
}

// Model Billing Tab
function ModelBilling() {
  const t = useTranslations('dashboard');
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800 pb-6">
        <h2 className="font-serif text-3xl text-white">{t('billing')}</h2>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-8 text-center">
        <CreditCard className="mx-auto text-neutral-700 mb-4" size={48} />
        <h3 className="text-xl font-serif text-white mb-2">Upgrade Your Profile</h3>
        <p className="text-neutral-400 mb-6">
          Get more visibility and premium features with a subscription package.
        </p>
        <Button onClick={() => router.push('/packages')}>
          Browse Packages
        </Button>
      </div>
    </div>
  );
}

// Model Settings Tab
function ModelSettings({ profile, onUpdate }: { profile: Profile; onUpdate: () => void }) {
  const t = useTranslations('dashboard');
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: profile.name,
    age: profile.age,
    priceStart: profile.priceStart,
    description: profile.description,
    district: profile.district,
    phone: profile.phone || '',
    whatsapp: profile.whatsapp || '',
    telegram: profile.telegram || ''
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
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
        telegram: formData.telegram
      })
      .eq('id', profile.id);
    setIsSaved(true);
    onUpdate();
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-6">
        <h2 className="font-serif text-3xl text-white">{t('settings')}</h2>
        <Button onClick={handleSave} className="flex items-center gap-2">
          {isSaved ? <Check size={16} /> : <Save size={16} />}
          {isSaved ? t('saved') : t('save')}
        </Button>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 rounded-sm focus:border-luxury-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
              className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 rounded-sm focus:border-luxury-gold focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Hourly Rate (€)</label>
          <input
            type="number"
            value={formData.priceStart}
            onChange={e => setFormData({ ...formData, priceStart: Number(e.target.value) })}
            className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 rounded-sm focus:border-luxury-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">About</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 rounded-sm focus:border-luxury-gold focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 rounded-sm focus:border-luxury-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">WhatsApp</label>
            <input
              type="text"
              value={formData.whatsapp}
              onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 rounded-sm focus:border-luxury-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Telegram</label>
            <input
              type="text"
              value={formData.telegram}
              onChange={e => setFormData({ ...formData, telegram: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 rounded-sm focus:border-luxury-gold focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Model Account Tab
function ModelAccount({ profile, onUpdate }: { profile: Profile; onUpdate: () => void }) {
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
    await supabase
      .from('profiles')
      .update({ isDisabled: newState })
      .eq('id', profile.id);
    setIsDisabled(newState);
    onUpdate();
    setIsSaving(false);
  };

  const handleDelete = async () => {
    await supabase
      .from('profiles')
      .delete()
      .eq('id', profile.id);
    await logout();
    router.push('/');
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-neutral-800 pb-6">
        <h2 className="font-serif text-3xl text-white">{t('account_settings')}</h2>
        <p className="text-neutral-400 text-sm mt-1">{t('disable_profile_desc')}</p>
      </div>

      {/* Visibility Toggle */}
      <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isDisabled ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
              {isDisabled ? <EyeOff size={24} /> : <Eye size={24} />}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{t('profile_visibility')}</h3>
              <p className="text-neutral-500 text-sm">
                {isDisabled ? t('profile_disabled') : t('profile_enabled')}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDisabled}
            disabled={isSaving}
            className={`px-6 py-3 rounded-sm font-bold uppercase tracking-widest text-xs transition-all ${
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
      <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-sm">
        <h3 className="text-red-400 text-sm uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
          <AlertCircle size={16} />
          {t('danger_zone')}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-semibold">{t('delete_profile')}</h4>
            <p className="text-neutral-500 text-sm mt-1">{t('delete_profile_desc')}</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-sm font-bold uppercase tracking-widest text-xs flex items-center gap-2"
          >
            <Trash2 size={16} />
            {t('delete_profile')}
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-900/50 rounded-sm max-w-md w-full p-6">
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
                className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-sm font-bold uppercase tracking-widest text-xs"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-sm font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                {t('delete_confirm_button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
