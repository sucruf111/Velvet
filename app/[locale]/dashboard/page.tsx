'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/lib/auth-context';
import { Profile, District, Agency, isProfileBoosted } from '@/lib/types';
import { Button } from '@/components/ui';
import { ProfileCard } from '@/components/ProfileCard';
import { useToast } from '@/components/Toast';
import {
  BarChart3, Image as ImageIcon, CreditCard, Heart, LogOut,
  Save, Check, Eye, EyeOff, Trash2, AlertCircle, Upload,
  Phone, MessageCircle, User, Euro, Sparkles, Building2, Users, Globe, Plus,
  ShieldCheck, Camera, Clock, X, Zap, Lock, Crown, Star, Calendar, Send, Video, Play
} from 'lucide-react';
import { VerificationApplication, ModelTier, AgencyTier, ServiceType } from '@/lib/types';
import {
  getPhotoLimit, getVideoLimit, getServiceLimit, canBoost,
  canUseSchedule, canSeeStatistics, canSeeAdvancedStatistics,
  getAgencyTierLimits, TIER_LIMITS
} from '@/lib/packages';

type DashboardTab = 'overview' | 'profile' | 'schedule' | 'billing' | 'account' | 'verify';
type AgencyTab = 'overview' | 'agency' | 'models' | 'billing';

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
  other: { label: 'Massage & Other', services: ['Massage', 'Erotic Massage', 'Body to Body Massage', 'Striptease'] }
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
  const [agencyTab, setAgencyTab] = useState<AgencyTab>('overview');
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [myAgency, setMyAgency] = useState<Agency | null>(null);
  const [agencyProfiles, setAgencyProfiles] = useState<Profile[]>([]);
  const [favoriteProfiles, setFavoriteProfiles] = useState<Profile[]>([]);
  const [verificationApp, setVerificationApp] = useState<VerificationApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tCommon = useTranslations('common');

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
    setError(null);

    try {
      if (user.role === 'customer') {
        if (user.favorites && user.favorites.length > 0) {
          const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', user.favorites);
          if (fetchError) throw fetchError;
          setFavoriteProfiles(data || []);
        }
      } else if (user.role === 'model' && user.profileId) {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.profileId)
          .maybeSingle();
        if (fetchError) throw fetchError;
        setMyProfile(data);

        // Update lastActive timestamp when model visits dashboard (makes them "Available Now")
        if (data) {
          (async () => {
            try {
              await supabase
                .from('profiles')
                .update({ lastActive: new Date().toISOString() })
                .eq('id', user.profileId);
              // Update local state too
              setMyProfile(prev => prev ? { ...prev, lastActive: new Date().toISOString() } : null);
            } catch {
              // Silently ignore errors
            }
          })();
        }

        // Fetch verification application via API route (bypasses RLS issues)
        try {
          const response = await fetch(`/api/verification-status?profileId=${user.profileId}`);
          if (response.ok) {
            const { data: verApp } = await response.json();
            if (verApp) setVerificationApp(verApp);
          }
        } catch {
          // Silently ignore - verification status will be fetched later if needed
        }
      } else if (user.role === 'agency') {
        // Fetch agency by userId
        const { data: agency, error: fetchError } = await supabase
          .from('agencies')
          .select('*')
          .eq('userId', user.id)
          .maybeSingle();
        if (fetchError) throw fetchError;

        if (agency) {
          setMyAgency(agency);
          // Fetch all profiles belonging to this agency
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('agencyId', agency.id);
          setAgencyProfiles(profiles || []);
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(tCommon('error_loading_data'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Show loading while checking auth, redirect happens in useEffect
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
          ) : error ? (
            <div className="text-center py-20 bg-red-900/10 border border-red-900/30 rounded-lg">
              <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
              <p className="text-red-300 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchUserData}>{tCommon('retry')}</Button>
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

  // Agency Dashboard
  if (user.role === 'agency') {
    return (
      <div className="min-h-screen bg-luxury-black pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-serif text-3xl text-white flex items-center gap-3">
                <Building2 className="text-luxury-gold" size={28} />
                {t('agency_dashboard')}
              </h1>
              {myAgency && (
                <p className="text-luxury-gold text-sm mt-1">{myAgency.name}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-neutral-500 text-sm">{user.username}</span>
              <button onClick={handleLogout} className="text-neutral-400 hover:text-white text-sm flex items-center gap-1">
                <LogOut size={14} /> {t('logout')}
              </button>
            </div>
          </div>

          {/* Subscription Banner */}
          {myAgency && <AgencySubscriptionBanner agency={myAgency} modelCount={agencyProfiles.length} />}

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-8 bg-neutral-900/50 p-1 rounded-lg w-fit">
            <TabButton active={agencyTab === 'overview'} onClick={() => setAgencyTab('overview')} icon={<BarChart3 size={16} />} label={t('overview')} />
            <TabButton active={agencyTab === 'agency'} onClick={() => setAgencyTab('agency')} icon={<Building2 size={16} />} label={t('edit_agency')} />
            <TabButton active={agencyTab === 'models'} onClick={() => setAgencyTab('models')} icon={<Users size={16} />} label={t('manage_models')} />
            <TabButton active={agencyTab === 'billing'} onClick={() => setAgencyTab('billing')} icon={<CreditCard size={16} />} label={t('billing')} />
          </div>

          {/* Content */}
          <div className="min-h-[500px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mb-4" />
              </div>
            ) : error ? (
              <div className="text-center py-20 bg-red-900/10 border border-red-900/30 rounded-lg">
                <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                <p className="text-red-300 mb-4">{error}</p>
                <Button variant="outline" onClick={fetchUserData}>{tCommon('retry')}</Button>
              </div>
            ) : !myAgency ? (
              <div className="bg-amber-900/20 border border-amber-900/50 p-6 text-amber-200 rounded-lg">
                <strong>{tCommon('no_agency_found')}:</strong> {tCommon('no_agency_found_desc')}
              </div>
            ) : (
              <>
                {agencyTab === 'overview' && <AgencyOverviewTab agency={myAgency} profiles={agencyProfiles} setAgencyTab={setAgencyTab} />}
                {agencyTab === 'agency' && <AgencyProfileEditor agency={myAgency} onUpdate={fetchUserData} />}
                {agencyTab === 'models' && <AgencyModelsTab agency={myAgency} profiles={agencyProfiles} onUpdate={fetchUserData} />}
                {agencyTab === 'billing' && <AgencyBillingTab agency={myAgency} />}
              </>
            )}
          </div>
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
        <div className="flex gap-1 mb-8 bg-neutral-900/50 p-1 rounded-lg w-fit flex-wrap">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart3 size={16} />} label={t('overview')} />
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={16} />} label={t('edit_profile')} />
          <TabButton
            active={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
            icon={canUseSchedule(myProfile?.tier || 'free') ? <Calendar size={16} /> : <Lock size={16} />}
            label={t('schedule')}
            locked={!canUseSchedule(myProfile?.tier || 'free')}
          />
          {!myProfile?.isVerified && (
            <TabButton active={activeTab === 'verify'} onClick={() => setActiveTab('verify')} icon={<ShieldCheck size={16} />} label={t('verification')} />
          )}
          <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={<CreditCard size={16} />} label={t('billing')} />
          <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={<Eye size={16} />} label={t('account_settings')} />
        </div>

        {/* Content */}
        <div className="min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mb-4" />
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-red-900/10 border border-red-900/30 rounded-lg">
              <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
              <p className="text-red-300 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchUserData}>{tCommon('retry')}</Button>
            </div>
          ) : !myProfile ? (
            <div className="bg-amber-900/20 border border-amber-900/50 p-6 text-amber-200 rounded-lg">
              <strong>{tCommon('no_profile_found')}:</strong> {tCommon('no_profile_found_desc')}
            </div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab profile={myProfile} setActiveTab={setActiveTab} onUpdate={fetchUserData} />}
              {activeTab === 'profile' && <ProfileEditor profile={myProfile} onUpdate={fetchUserData} />}
              {activeTab === 'schedule' && <ScheduleTab profile={myProfile} onUpdate={fetchUserData} />}
              {activeTab === 'verify' && <VerificationTab profile={myProfile} application={verificationApp} onUpdate={fetchUserData} />}
              {activeTab === 'billing' && <BillingTab profile={myProfile} onUpdate={fetchUserData} />}
              {activeTab === 'account' && <AccountTab profile={myProfile} onUpdate={fetchUserData} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, locked }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; locked?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
        active
          ? 'bg-luxury-gold text-black'
          : locked
          ? 'text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/50'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
      }`}
    >
      {icon} {label} {locked && <span className="text-[10px] ml-1 text-amber-500">PRO</span>}
    </button>
  );
}

// Overview Tab
function OverviewTab({ profile, setActiveTab, onUpdate }: { profile: Profile; setActiveTab: (tab: DashboardTab) => void; onUpdate: () => void }) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const [isOnline, setIsOnline] = useState(profile.isOnline || false);
  const [isBoostLoading, setIsBoostLoading] = useState(false);
  const [boostError, setBoostError] = useState<string | null>(null);
  const [showBoostConfirm, setShowBoostConfirm] = useState(false);
  const [boostTimeRemaining, setBoostTimeRemaining] = useState<string | null>(null);

  const tier = (profile.tier as ModelTier) || 'free';
  const isBoosted = isProfileBoosted(profile);
  const canUseBoost = canBoost(tier);
  const showStats = canSeeStatistics(tier);

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    await supabase
      .from('profiles')
      .update({ isOnline: newStatus, lastActive: new Date().toISOString() })
      .eq('id', profile.id);
  };

  const handleBoost = async () => {
    if (!canUseBoost || isBoosted) return;
    setIsBoostLoading(true);
    setBoostError(null);
    try {
      const res = await fetch('/api/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id })
      });
      const data = await res.json();
      if (!res.ok) {
        setBoostError(data.error || 'Failed to activate boost');
        showToast(data.error || 'Failed to activate boost', 'error');
      } else {
        showToast('Boost activated! Your profile is now at the top of search results.', 'success');
        onUpdate();
      }
    } catch {
      setBoostError('Failed to activate boost');
      showToast('Failed to activate boost', 'error');
    } finally {
      setIsBoostLoading(false);
    }
  };

  // Live countdown timer for active boost
  useEffect(() => {
    if (!profile.boostedUntil) {
      setBoostTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const remaining = new Date(profile.boostedUntil!).getTime() - Date.now();
      if (remaining <= 0) {
        setBoostTimeRemaining(null);
        return;
      }
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setBoostTimeRemaining(`${hours}h ${minutes}m remaining`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [profile.boostedUntil]);

  const metrics = {
    views: profile.clicks || 0,
    contacts: profile.contactClicks || 0,
    searches: profile.searchAppearances || 0,
    favorites: 0
  };

  const completionItems = [
    { label: 'Photos', done: (profile.images?.length || 0) > 0 },
    { label: 'Description', done: !!profile.description },
    { label: 'Services', done: (profile.services?.length || 0) > 0 },
    { label: 'Contact', done: !!(profile.phone || profile.whatsapp || profile.telegram) },
  ];
  const completionPercent = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100);

  const getTierBadge = () => {
    if (tier === 'elite') return { icon: <Crown size={16} />, label: 'Elite', color: 'bg-purple-500/20 border-purple-500 text-purple-400' };
    if (tier === 'premium') return { icon: <Star size={16} />, label: 'Premium', color: 'bg-amber-500/20 border-amber-500 text-amber-400' };
    return { icon: null, label: 'Free', color: 'bg-neutral-800 border-neutral-700 text-neutral-400' };
  };
  const tierBadge = getTierBadge();

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
          <div className="flex gap-2 mt-3 flex-wrap">
            {completionItems.map(item => (
              <span key={item.label} className={`text-xs px-2 py-1 rounded ${item.done ? 'bg-green-900/30 text-green-400' : 'bg-neutral-800 text-neutral-500'}`}>
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Tier Status */}
        <div className={`border rounded-lg p-5 ${tier === 'elite' ? 'bg-purple-900/10 border-purple-500/50' : tier === 'premium' ? 'bg-amber-900/10 border-amber-500/50' : 'bg-neutral-900 border-neutral-800'}`}>
          <p className="text-neutral-400 text-xs uppercase tracking-wider mb-1">Your Plan</p>
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold ${tierBadge.color}`}>
              {tierBadge.icon} {tierBadge.label}
            </span>
          </div>
          {tier === 'free' ? (
            <Button variant="primary" className="w-full !py-2 !text-xs" onClick={() => router.push('/packages')}>
              <Zap size={14} className="mr-1" /> Upgrade Now
            </Button>
          ) : (
            <Button variant="outline" className="w-full !py-2 !text-xs" onClick={() => setActiveTab('billing')}>
              Manage Subscription
            </Button>
          )}
        </div>
      </div>

      {/* Boost Section - Only for Premium/Elite */}
      {canUseBoost && (
        <div className={`border rounded-lg p-5 ${isBoosted ? 'bg-orange-900/10 border-orange-500/50' : 'bg-neutral-900 border-neutral-800'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                <Zap size={12} className="text-orange-400" /> Profile Boost
              </p>
              {isBoosted ? (
                <div>
                  <p className="text-orange-400 font-semibold">
                    🔥 {boostTimeRemaining || 'Boost Active'}
                  </p>
                  <p className="text-orange-300/70 text-xs mt-0.5">
                    Expires: {new Date(profile.boostedUntil!).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-neutral-300">
                  Appear at the top of search results for 24 hours
                </p>
              )}
              <p className="text-neutral-500 text-xs mt-1">
                {tier === 'elite' ? 'Unlimited boosts' : `${profile.boostsRemaining || 0} boosts remaining this month`}
              </p>
            </div>
            <button
              onClick={() => setShowBoostConfirm(true)}
              disabled={isBoosted || isBoostLoading || (tier !== 'elite' && (profile.boostsRemaining || 0) <= 0)}
              className={`px-6 py-3 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${
                isBoosted
                  ? 'bg-orange-500/20 text-orange-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
              }`}
            >
              <Zap size={16} />
              {isBoostLoading ? 'Activating...' : isBoosted ? 'Active' : 'Boost Now'}
            </button>
          </div>
          {boostError && <p className="text-red-400 text-sm mt-2">{boostError}</p>}
        </div>
      )}

      {/* Boost Confirmation Modal */}
      {showBoostConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowBoostConfirm(false)}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Zap size={24} className="text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Activate Boost?</h3>
            </div>
            <p className="text-neutral-300 mb-2">
              {tier === 'elite'
                ? 'Your profile will appear at the top of search results for 24 hours.'
                : `This will use 1 of your ${profile.boostsRemaining || 0} monthly boosts.`}
            </p>
            <p className="text-neutral-400 text-sm mb-6">
              Your profile will be highlighted and appear at the top of search results for the next 24 hours, increasing your visibility significantly.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowBoostConfirm(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 !bg-gradient-to-r !from-orange-500 !to-red-500 hover:!from-orange-600 hover:!to-red-600"
                onClick={() => { handleBoost(); setShowBoostConfirm(false); }}
                disabled={isBoostLoading}
              >
                <Zap size={16} className="mr-1" />
                {isBoostLoading ? 'Activating...' : 'Activate Boost'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="relative">
        {!showStats && (
          <div className="absolute inset-0 z-10 bg-neutral-900/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            <Lock size={32} className="text-neutral-500 mb-3" />
            <p className="text-white font-semibold mb-1">Statistics Locked</p>
            <p className="text-neutral-400 text-sm mb-4">Upgrade to Premium to see your analytics</p>
            <Button onClick={() => router.push('/packages')} className="!py-2 !px-6 !text-xs">
              <Zap size={14} className="mr-1" /> Upgrade to Premium
            </Button>
          </div>
        )}
        <div className={!showStats ? 'filter blur-sm pointer-events-none' : ''}>
          <p className="text-neutral-400 text-xs uppercase tracking-wider mb-3">📊 Your Statistics</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label={t('profile_views')} value={metrics.views} emoji="👁️" />
            <MetricCard label={t('contact_clicks')} value={metrics.contacts} emoji="📞" />
            <MetricCard label={t('search_appearances')} value={metrics.searches} emoji="🔍" />
            <MetricCard label={t('favorited_by')} value={metrics.favorites} emoji="❤️" />
          </div>
        </div>
      </div>

      {/* Advanced Analytics - Elite Only */}
      {canSeeAdvancedStatistics(tier) ? (
        <div className="space-y-6">
          {/* Traffic Sources */}
          <div className="bg-neutral-900 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={18} className="text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Traffic Sources</h3>
              <span className="text-purple-400 text-xs bg-purple-500/20 px-2 py-0.5 rounded-full">Elite</span>
            </div>
            <div className="space-y-3">
              {[
                { source: 'Search Results', percent: 45, color: 'bg-luxury-gold' },
                { source: 'Homepage', percent: 25, color: 'bg-purple-500' },
                { source: 'Direct Link', percent: 20, color: 'bg-blue-500' },
                { source: 'External', percent: 10, color: 'bg-green-500' },
              ].map(item => (
                <div key={item.source} className="flex items-center gap-3">
                  <span className="text-neutral-400 text-sm w-32">{item.source}</span>
                  <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} transition-all`} style={{ width: `${item.percent}%` }} />
                  </div>
                  <span className="text-white text-sm font-medium w-12 text-right">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly Breakdown */}
          <div className="bg-neutral-900 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Hourly Activity</h3>
              <span className="text-purple-400 text-xs bg-purple-500/20 px-2 py-0.5 rounded-full">Elite</span>
            </div>
            <div className="flex items-end gap-1 h-32">
              {[
                5, 3, 2, 1, 1, 2, 4, 8, 12, 15, 18, 20,
                22, 25, 22, 18, 15, 20, 28, 35, 42, 38, 25, 12
              ].map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all hover:from-purple-500 hover:to-purple-300"
                    style={{ height: `${(value / 42) * 100}%` }}
                    title={`${i}:00 - ${value} views`}
                  />
                  {i % 6 === 0 && (
                    <span className="text-[10px] text-neutral-500">{i}h</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-neutral-500 text-xs mt-3 text-center">
              Peak activity: 20:00 - 22:00
            </p>
          </div>
        </div>
      ) : showStats ? (
        <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-6 text-center">
          <Crown size={32} className="mx-auto text-purple-400 mb-3" />
          <h3 className="text-white font-semibold mb-2">Advanced Analytics</h3>
          <p className="text-neutral-400 text-sm mb-4">
            Upgrade to Elite to see traffic sources, hourly breakdowns, and more detailed insights
          </p>
          <Button onClick={() => router.push('/packages')} className="!bg-purple-600 hover:!bg-purple-500">
            <Crown size={14} className="mr-2" /> Upgrade to Elite
          </Button>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickActionCard icon={<User size={20} />} label={t('edit_profile')} onClick={() => setActiveTab('profile')} />
        <QuickActionCard icon={<ImageIcon size={20} />} label={t('add_photos')} onClick={() => setActiveTab('profile')} />
        <QuickActionCard icon={<Calendar size={20} />} label={t('schedule')} onClick={() => setActiveTab('schedule')} locked={!canUseSchedule(tier)} />
        <QuickActionCard icon={<CreditCard size={20} />} label={t('view_packages')} onClick={() => router.push('/packages')} />
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

function QuickActionCard({ icon, label, onClick, locked }: { icon: React.ReactNode; label: string; onClick: () => void; locked?: boolean }) {
  return (
    <button onClick={onClick} className={`bg-neutral-900 border rounded-lg p-4 transition-all group text-left ${locked ? 'border-neutral-800 opacity-60' : 'border-neutral-800 hover:border-luxury-gold'}`}>
      <div className={`mb-2 ${locked ? 'text-neutral-600' : 'text-neutral-400 group-hover:text-luxury-gold'}`}>{icon}</div>
      <p className={`text-sm ${locked ? 'text-neutral-500' : 'text-neutral-300 group-hover:text-white'}`}>
        {label} {locked && <span className="text-amber-500 text-[10px] ml-1">PRO</span>}
      </p>
    </button>
  );
}

// Unified Profile Editor Tab
function ProfileEditor({ profile, onUpdate }: { profile: Profile; onUpdate: () => void }) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const tier: ModelTier = (['free', 'premium', 'elite'].includes(profile.tier as string) ? profile.tier : 'free') as ModelTier;
  const photoLimit = getPhotoLimit(tier);
  const videoLimit = getVideoLimit(tier);
  const serviceLimit = getServiceLimit(tier);
  const isFree = tier === 'free';

  const [formData, setFormData] = useState({
    name: profile.name,
    age: profile.age,
    priceStart: profile.priceStart,
    description: profile.description,
    district: profile.district,
    phone: profile.phone || '',
    whatsapp: profile.whatsapp || '',
    telegram: profile.telegram || '',
    primaryContact: (profile.primaryContact as 'phone' | 'whatsapp' | 'telegram') || 'phone',
    services: (profile.services || []) as string[],
    languages: profile.languages || [],
    visitType: profile.visitType || 'both',
    images: profile.images || [],
    videoUrls: profile.videoUrls || []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [videoUploadError, setVideoUploadError] = useState('');
  const [activeSection, setActiveSection] = useState<string>('basic');

  const updateField = <K extends keyof typeof formData>(key: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const toggleService = (service: string) => {
    const currentServices = Array.isArray(formData.services) ? formData.services.filter(s => s) : [];
    const isSelected = currentServices.includes(service);
    const count = currentServices.length;

    // Only block if trying to add AND at/over limit
    if (!isSelected && serviceLimit !== Infinity && count >= serviceLimit) {
      return;
    }

    const newServices = isSelected
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    updateField('services', newServices);
  };

  const isAtPhotoLimit = photoLimit !== Infinity && formData.images.length >= photoLimit;
  const isAtVideoLimit = videoLimit === 0 || (formData.videoUrls.length >= videoLimit);
  // Service limit: can add more if under limit (free=3, premium/elite=unlimited)
  const currentServiceCount = Array.isArray(formData.services) ? formData.services.filter(s => s).length : 0;
  const isAtServiceLimit = serviceLimit !== Infinity && currentServiceCount >= serviceLimit;

  const toggleLanguage = (lang: string) => {
    const newLangs = formData.languages.includes(lang)
      ? formData.languages.filter(l => l !== lang)
      : [...formData.languages, lang];
    updateField('languages', newLangs);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check photo limit before upload
    if (isAtPhotoLimit) {
      setUploadError(`You've reached the ${photoLimit} photo limit. Upgrade to add more photos.`);
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const uploadFormData = new FormData();
      const remainingSlots = photoLimit === Infinity ? files.length : photoLimit - formData.images.length;
      let addedCount = 0;

      for (const file of Array.from(files)) {
        if (addedCount >= remainingSlots) {
          setUploadError(`Only ${remainingSlots} more photo(s) allowed with your plan.`);
          break;
        }
        if (!file.type.startsWith('image/')) {
          setUploadError('Only image files allowed');
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setUploadError('Max 5MB per image');
          continue;
        }
        uploadFormData.append('images', file);
        addedCount++;
      }

      if (addedCount === 0) {
        setIsUploading(false);
        return;
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const result = await response.json();

      if (result.success && result.urls) {
        const newImages = [...formData.images, ...result.urls];
        updateField('images', newImages);

        // Auto-save images to database immediately
        await supabase
          .from('profiles')
          .update({ images: newImages })
          .eq('id', profile.id);
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
    const newImages = formData.images.filter((_, i) => i !== index);

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

    updateField('images', newImages);

    // Auto-save to database
    await supabase
      .from('profiles')
      .update({ images: newImages })
      .eq('id', profile.id);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (videoLimit === 0) {
      setVideoUploadError('Video upload is not available on your plan. Upgrade to Premium.');
      return;
    }

    if (isAtVideoLimit) {
      setVideoUploadError(`You've reached the ${videoLimit} video limit.`);
      return;
    }

    setIsUploadingVideo(true);
    setVideoUploadError('');

    try {
      const file = files[0];

      if (!file.type.startsWith('video/')) {
        setVideoUploadError('Only video files allowed');
        setIsUploadingVideo(false);
        return;
      }

      // 50MB limit for videos
      if (file.size > 50 * 1024 * 1024) {
        setVideoUploadError('Max 50MB per video');
        setIsUploadingVideo(false);
        return;
      }

      // 30 second duration check would need to happen client-side or server-side
      // For now we'll just upload and trust the limit

      const uploadFormData = new FormData();
      uploadFormData.append('videos', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const result = await response.json();

      if (result.success && result.urls) {
        const newVideos = [...formData.videoUrls, ...result.urls];
        updateField('videoUrls', newVideos);

        // Auto-save to database
        await supabase
          .from('profiles')
          .update({ video_urls: newVideos })
          .eq('id', profile.id);
      } else {
        setVideoUploadError(result.error || 'Video upload failed');
      }
    } catch (error) {
      console.error('Video upload error:', error);
      setVideoUploadError('Video upload failed');
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const removeVideo = async (index: number) => {
    const videoUrl = formData.videoUrls[index];
    const newVideos = formData.videoUrls.filter((_, i) => i !== index);

    // Try to delete from server
    if (videoUrl.startsWith('/uploads/')) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: [videoUrl] })
        });
      } catch (e) {
        console.error('Failed to delete video from server:', e);
      }
    }

    updateField('videoUrls', newVideos);

    // Auto-save to database
    await supabase
      .from('profiles')
      .update({ video_urls: newVideos })
      .eq('id', profile.id);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
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
          primary_contact: isFree ? formData.primaryContact : null,
          services: formData.services,
          languages: formData.languages,
          visitType: formData.visitType,
          images: formData.images,
          video_urls: formData.videoUrls
        })
        .eq('id', profile.id);

      if (error) {
        showToast('Failed to save profile', 'error');
        return;
      }

      setSaveSuccess(true);
      showToast('Profile saved successfully', 'success');
      onUpdate();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      showToast('Failed to save profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const photoLimitLabel = photoLimit === Infinity ? '' : `${formData.images.length}/${photoLimit}`;
  const serviceLimitLabel = serviceLimit === Infinity ? `${formData.services.length}` : `${formData.services.length}/${serviceLimit}`;

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: <User size={16} /> },
    { id: 'photos', label: 'Photos', icon: <ImageIcon size={16} />, count: photoLimitLabel || formData.images.length },
    { id: 'services', label: 'Services', icon: <Sparkles size={16} />, count: serviceLimitLabel },
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
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ImageIcon size={18} className="text-luxury-gold" /> {t('my_photos')}
                </h3>
                {photoLimit !== Infinity && (
                  <p className={`text-sm mt-1 ${isAtPhotoLimit ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {formData.images.length} / {photoLimit} photos used
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isAtPhotoLimit}
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                {isUploading ? 'Uploading...' : isAtPhotoLimit ? 'Limit Reached' : t('upload_photos')}
              </Button>
            </div>

            {/* Photo Limit Warning */}
            {isAtPhotoLimit && (
              <div className="bg-amber-900/20 border border-amber-800 p-4 rounded-md flex items-center justify-between">
                <div>
                  <p className="text-amber-400 font-semibold text-sm">Photo limit reached</p>
                  <p className="text-neutral-400 text-xs mt-1">
                    {tier === 'free' ? 'Upgrade to Premium for up to 5 photos' : 'Upgrade to Elite for unlimited photos'}
                  </p>
                </div>
                <Button onClick={() => router.push('/packages')} className="!py-2 !px-4 !text-xs">
                  <Zap size={14} className="mr-1" /> Upgrade
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={!isFree}
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

            {/* Video Upload Section */}
            <div className="pt-6 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Video size={18} className="text-purple-400" /> Videos
                  </h4>
                  {videoLimit > 0 ? (
                    <p className={`text-sm mt-1 ${isAtVideoLimit ? 'text-amber-400' : 'text-neutral-500'}`}>
                      {formData.videoUrls.length} / {videoLimit} videos
                    </p>
                  ) : (
                    <p className="text-sm mt-1 text-neutral-500">
                      Not available on Free plan
                    </p>
                  )}
                </div>
                {videoLimit > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploadingVideo || isAtVideoLimit}
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} />
                    {isUploadingVideo ? 'Uploading...' : isAtVideoLimit ? 'Limit Reached' : 'Upload Video'}
                  </Button>
                )}
              </div>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
              />

              {videoUploadError && (
                <div className="bg-red-900/20 border border-red-900/50 p-3 text-red-300 rounded-md text-sm mb-4">
                  {videoUploadError}
                </div>
              )}

              {/* Video Locked for Free */}
              {videoLimit === 0 ? (
                <div className="bg-purple-900/10 border border-purple-800 p-6 rounded-lg text-center">
                  <Video size={32} className="mx-auto text-purple-400 mb-3" />
                  <p className="text-white font-semibold mb-2">Video Upload - Premium Feature</p>
                  <p className="text-neutral-400 text-sm mb-4">
                    Upgrade to Premium to upload 1 video, or Elite for up to 3 videos
                  </p>
                  <Button onClick={() => router.push('/packages')} className="!py-2 !px-6">
                    <Zap size={14} className="mr-2" /> Upgrade Now
                  </Button>
                </div>
              ) : formData.videoUrls.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.videoUrls.map((videoUrl, i) => (
                    <div key={i} className="relative group aspect-video bg-neutral-800 rounded-lg overflow-hidden">
                      <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => removeVideo(i)}
                          className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          <Play size={12} /> Video {i + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-purple-700/50 rounded-lg p-8 text-center">
                  <Video size={32} className="mx-auto text-purple-400 mb-3" />
                  <p className="text-neutral-500 mb-4">No videos uploaded yet</p>
                  <Button variant="outline" onClick={() => videoInputRef.current?.click()}>
                    <Upload size={16} className="mr-2" /> Upload Video
                  </Button>
                  <p className="text-neutral-600 text-xs mt-2">Max 50MB per video</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services Section */}
        {activeSection === 'services' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-luxury-gold" /> {t('select_services')}
                </h3>
                {serviceLimit !== Infinity && (
                  <p className={`text-sm mt-1 ${isAtServiceLimit ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {formData.services.length} / {serviceLimit} services selected
                  </p>
                )}
              </div>
              <span className={`text-sm ${isAtServiceLimit ? 'text-amber-400' : 'text-luxury-gold'}`}>
                {formData.services.length} selected
              </span>
            </div>

            {/* Service Limit Warning */}
            {isAtServiceLimit && (
              <div className="bg-amber-900/20 border border-amber-800 p-4 rounded-md flex items-center justify-between">
                <div>
                  <p className="text-amber-400 font-semibold text-sm">Service limit reached</p>
                  <p className="text-neutral-400 text-xs mt-1">Upgrade to Premium for unlimited services</p>
                </div>
                <Button onClick={() => router.push('/packages')} className="!py-2 !px-4 !text-xs">
                  <Zap size={14} className="mr-1" /> Upgrade
                </Button>
              </div>
            )}

            <p className="text-neutral-500 text-sm">{t('services_hint')}</p>

            <div className="space-y-6">
              {Object.entries(SERVICE_CATEGORIES).map(([key, { label, services }]) => (
                <div key={key}>
                  <h4 className="text-luxury-gold text-xs uppercase tracking-wider font-bold mb-3 pb-2 border-b border-neutral-800">
                    {label}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {services.map(service => {
                      const isSelected = formData.services.includes(service);
                      const isDisabled = !isSelected && isAtServiceLimit;
                      return (
                        <label
                          key={service}
                          className={`flex items-center gap-3 p-3 rounded-md transition-all ${
                            isDisabled
                              ? 'bg-neutral-950 border border-neutral-800 opacity-50 cursor-not-allowed'
                              : isSelected
                              ? 'bg-luxury-gold/10 border border-luxury-gold/30 cursor-pointer'
                              : 'bg-neutral-950 border border-neutral-800 hover:border-neutral-700 cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleService(service)}
                            disabled={isDisabled}
                            className="w-4 h-4 accent-luxury-gold rounded"
                          />
                          <span className={`text-sm ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
                            {service}
                          </span>
                        </label>
                      );
                    })}
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

            {isFree ? (
              <>
                {/* Free tier: Single contact selection */}
                <div className="bg-amber-900/20 border border-amber-800 p-4 rounded-md">
                  <p className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> Free tier: One contact method only
                  </p>
                  <p className="text-neutral-400 text-xs mt-1">
                    Upgrade to Premium to display all your contact methods
                  </p>
                </div>

                <p className="text-neutral-400 text-sm">Select your primary contact method:</p>

                <div className="space-y-4">
                  {/* Phone Option */}
                  <div className={`p-4 rounded-md border transition-all ${formData.primaryContact === 'phone' ? 'border-luxury-gold bg-luxury-gold/10' : 'border-neutral-700'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="primaryContact"
                        checked={formData.primaryContact === 'phone'}
                        onChange={() => updateField('primaryContact', 'phone')}
                        className="w-4 h-4 accent-luxury-gold"
                      />
                      <Phone size={18} className={formData.primaryContact === 'phone' ? 'text-luxury-gold' : 'text-neutral-500'} />
                      <span className={formData.primaryContact === 'phone' ? 'text-white font-medium' : 'text-neutral-400'}>Phone</span>
                    </label>
                    {formData.primaryContact === 'phone' && (
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => updateField('phone', e.target.value)}
                        placeholder="+49 123 456789"
                        className="w-full mt-3 bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                      />
                    )}
                  </div>

                  {/* WhatsApp Option */}
                  <div className={`p-4 rounded-md border transition-all ${formData.primaryContact === 'whatsapp' ? 'border-luxury-gold bg-luxury-gold/10' : 'border-neutral-700'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="primaryContact"
                        checked={formData.primaryContact === 'whatsapp'}
                        onChange={() => updateField('primaryContact', 'whatsapp')}
                        className="w-4 h-4 accent-luxury-gold"
                      />
                      <MessageCircle size={18} className={formData.primaryContact === 'whatsapp' ? 'text-green-500' : 'text-neutral-500'} />
                      <span className={formData.primaryContact === 'whatsapp' ? 'text-white font-medium' : 'text-neutral-400'}>WhatsApp</span>
                    </label>
                    {formData.primaryContact === 'whatsapp' && (
                      <input
                        type="text"
                        value={formData.whatsapp}
                        onChange={e => updateField('whatsapp', e.target.value)}
                        placeholder="+49 123 456789"
                        className="w-full mt-3 bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Telegram Option */}
                  <div className={`p-4 rounded-md border transition-all ${formData.primaryContact === 'telegram' ? 'border-luxury-gold bg-luxury-gold/10' : 'border-neutral-700'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="primaryContact"
                        checked={formData.primaryContact === 'telegram'}
                        onChange={() => updateField('primaryContact', 'telegram')}
                        className="w-4 h-4 accent-luxury-gold"
                      />
                      <Send size={18} className={formData.primaryContact === 'telegram' ? 'text-blue-400' : 'text-neutral-500'} />
                      <span className={formData.primaryContact === 'telegram' ? 'text-white font-medium' : 'text-neutral-400'}>Telegram</span>
                    </label>
                    {formData.primaryContact === 'telegram' && (
                      <input
                        type="text"
                        value={formData.telegram}
                        onChange={e => updateField('telegram', e.target.value)}
                        placeholder="@username"
                        className="w-full mt-3 bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                <Button onClick={() => router.push('/packages')} variant="outline" className="w-full !py-3">
                  <Zap size={16} className="mr-2" /> Upgrade to show all contact methods
                </Button>
              </>
            ) : (
              <>
                {/* Premium/Elite: All contact methods */}
                <p className="text-neutral-500 text-sm">Add all your contact methods. Clients can reach you on any of these.</p>

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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Schedule Tab
function ScheduleTab({ profile, onUpdate }: { profile: Profile; onUpdate: () => void }) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const tier = (profile.tier as ModelTier) || 'free';
  const canSchedule = canUseSchedule(tier);

  const [availability, setAvailability] = useState<string[]>(profile.availability || []);
  const [showSchedule, setShowSchedule] = useState(profile.showSchedule || false);
  const [isSaving, setIsSaving] = useState(false);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const TIME_SLOTS = ['Morning (8-12)', 'Afternoon (12-18)', 'Evening (18-22)', 'Night (22-8)'];

  const toggleAvailability = (slot: string) => {
    setAvailability(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ availability, showSchedule })
        .eq('id', profile.id);
      if (error) {
        showToast('Failed to save schedule', 'error');
        return;
      }
      showToast('Schedule saved successfully', 'success');
      onUpdate();
    } catch {
      showToast('Failed to save schedule', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Locked state for free tier
  if (!canSchedule) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-neutral-500" />
          </div>
          <h3 className="text-xl font-serif text-white mb-2">Weekly Schedule</h3>
          <p className="text-neutral-400 mb-6 max-w-md mx-auto">
            Let clients know when you&apos;re available. Upgrade to Premium to enable your weekly schedule.
          </p>
          <Button onClick={() => router.push('/packages')}>
            <Zap size={16} className="mr-2" /> Upgrade to Premium
          </Button>
        </div>

        {/* Blurred preview */}
        <div className="mt-8 filter blur-sm pointer-events-none opacity-50">
          <div className="grid grid-cols-8 gap-2">
            <div></div>
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs text-neutral-500 font-medium">
                {day.slice(0, 3)}
              </div>
            ))}
            {TIME_SLOTS.map(slot => (
              <div key={slot} className="contents">
                <div className="text-xs text-neutral-500 text-right pr-2">{slot.split(' ')[0]}</div>
                {DAYS.map(day => (
                  <div
                    key={`${day}-${slot}`}
                    className="h-8 bg-neutral-800 rounded"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar size={18} className="text-luxury-gold" /> Weekly Schedule
        </h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-neutral-400">Show on profile</span>
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className={`relative w-12 h-6 rounded-full transition-colors ${showSchedule ? 'bg-luxury-gold' : 'bg-neutral-700'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${showSchedule ? 'translate-x-6' : ''}`} />
          </button>
        </label>
      </div>

      <p className="text-neutral-500 text-sm">
        Click on time slots to mark when you&apos;re typically available. This helps clients plan ahead.
      </p>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 gap-2 min-w-[600px]">
          <div></div>
          {DAYS.map(day => (
            <div key={day} className="text-center text-xs text-neutral-400 font-medium pb-2">
              {day.slice(0, 3)}
            </div>
          ))}
          {TIME_SLOTS.map(slot => (
            <div key={slot} className="contents">
              <div className="text-xs text-neutral-500 text-right pr-2 flex items-center justify-end">
                {slot.split(' ')[0]}
              </div>
              {DAYS.map(day => {
                const key = `${day}-${slot}`;
                const isSelected = availability.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleAvailability(key)}
                    className={`h-10 rounded transition-all ${
                      isSelected
                        ? 'bg-luxury-gold/30 border border-luxury-gold'
                        : 'bg-neutral-800 hover:bg-neutral-700 border border-transparent'
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 bg-luxury-gold/30 border border-luxury-gold rounded" /> Available
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 bg-neutral-800 rounded" /> Not set
          </span>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Schedule'}
        </Button>
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
function BillingTab({ profile, onUpdate }: { profile: Profile; onUpdate: () => void }) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const tier = (profile.tier as ModelTier) || 'free';
  const limits = TIER_LIMITS[tier];
  const expiresAt = profile.subscriptionExpiresAt ? new Date(profile.subscriptionExpiresAt) : null;
  const isActive = tier !== 'free' && expiresAt && expiresAt > new Date();
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || 'Failed to cancel subscription');
      } else {
        setShowCancelConfirm(false);
        onUpdate();
      }
    } catch {
      setCancelError('Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

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
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <div className={`border rounded-lg p-6 ${isActive ? (tier === 'elite' ? 'bg-purple-900/10 border-purple-500/30' : 'bg-amber-900/10 border-amber-500/30') : 'bg-neutral-900 border-neutral-800'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {tier === 'elite' ? (
              <Crown className="text-purple-400" size={24} />
            ) : tier === 'premium' ? (
              <Star className="text-amber-400" size={24} />
            ) : (
              <CreditCard className="text-neutral-600" size={24} />
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">
                {tier === 'elite' ? 'Elite Plan' : tier === 'premium' ? 'Premium Plan' : 'Free Plan'}
              </h3>
              {isActive && expiresAt && (
                <p className="text-sm text-neutral-400">
                  {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expires today'} • {expiresAt.toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          {isActive && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full font-medium">
              Active
            </span>
          )}
        </div>

        {tier !== 'free' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{limits.photos === Infinity ? '∞' : limits.photos}</p>
              <p className="text-xs text-neutral-500 uppercase">Photos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{limits.videos}</p>
              <p className="text-xs text-neutral-500 uppercase">Videos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{limits.boostsPerMonth === Infinity ? '∞' : limits.boostsPerMonth}</p>
              <p className="text-xs text-neutral-500 uppercase">Boosts/Month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{tier === 'elite' ? '👑' : '⭐'}</p>
              <p className="text-xs text-neutral-500 uppercase">Badge</p>
            </div>
          </div>
        ) : (
          <p className="text-neutral-400 text-sm">Upgrade to get more visibility, badges, and features.</p>
        )}
      </div>

      {/* Upgrade Options */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{tier === 'free' ? 'Choose a Plan' : 'Change Plan'}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Premium */}
          <div className={`border rounded-lg p-5 ${tier === 'premium' ? 'border-amber-500 bg-amber-500/5' : 'border-neutral-700 hover:border-neutral-600'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <Star size={16} className="text-amber-400" /> Premium
              </h4>
              {tier === 'premium' && <span className="text-xs text-amber-400">Current</span>}
            </div>
            <p className="text-3xl font-bold text-white mb-1">29€<span className="text-sm text-neutral-500">/mo</span></p>
            <ul className="text-sm text-neutral-400 space-y-1 mb-4">
              <li>• Up to 10 photos</li>
              <li>• 1 video</li>
              <li>• 2 boosts per month</li>
              <li>• Premium badge ⭐</li>
              <li>• Statistics access</li>
            </ul>
            {tier !== 'premium' && (
              <Button variant={tier === 'elite' ? 'outline' : 'primary'} className="w-full" onClick={() => router.push('/packages')}>
                {tier === 'free' ? 'Upgrade' : 'Downgrade'}
              </Button>
            )}
          </div>

          {/* Elite */}
          <div className={`border rounded-lg p-5 ${tier === 'elite' ? 'border-purple-500 bg-purple-500/5' : 'border-neutral-700 hover:border-neutral-600'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <Crown size={16} className="text-purple-400" /> Elite
                <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded">BEST</span>
              </h4>
              {tier === 'elite' && <span className="text-xs text-purple-400">Current</span>}
            </div>
            <p className="text-3xl font-bold text-white mb-1">59€<span className="text-sm text-neutral-500">/mo</span></p>
            <ul className="text-sm text-neutral-400 space-y-1 mb-4">
              <li>• Unlimited photos</li>
              <li>• 3 videos</li>
              <li>• Unlimited boosts</li>
              <li>• Elite badge 👑</li>
              <li>• Advanced analytics</li>
              <li>• Priority placement</li>
            </ul>
            {tier !== 'elite' && (
              <Button className="w-full !bg-purple-600 hover:!bg-purple-700" onClick={() => router.push('/packages')}>
                Upgrade to Elite
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Subscription */}
      {isActive && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Cancel Subscription</h3>
          <p className="text-neutral-400 text-sm mb-4">
            If you cancel, you&apos;ll keep access until your current billing period ends on {expiresAt?.toLocaleDateString()}.
          </p>
          <Button variant="outline" className="!border-red-500/50 !text-red-400 hover:!bg-red-500/10" onClick={() => setShowCancelConfirm(true)}>
            Cancel Subscription
          </Button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-3">Cancel Subscription?</h3>
            <p className="text-neutral-300 mb-2">
              Are you sure you want to cancel your {tier} subscription?
            </p>
            <p className="text-neutral-400 text-sm mb-6">
              You&apos;ll keep access to {tier} features until {expiresAt?.toLocaleDateString()}, then your account will revert to the free plan.
            </p>
            {cancelError && <p className="text-red-400 text-sm mb-4">{cancelError}</p>}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(false)}>
                Keep Subscription
              </Button>
              <Button
                className="flex-1 !bg-red-600 hover:!bg-red-700"
                onClick={handleCancelSubscription}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Account Tab
function AccountTab({ profile, onUpdate }: { profile: Profile; onUpdate: () => void }) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { logout } = useAuth();
  const supabase = createClient();
  const { showToast } = useToast();
  const [isDisabled, setIsDisabled] = useState(profile.isDisabled || false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleDisabled = async () => {
    setIsSaving(true);
    const newState = !isDisabled;
    const { error } = await supabase.from('profiles').update({ isDisabled: newState }).eq('id', profile.id);
    if (error) {
      showToast('Failed to update visibility', 'error');
      setIsSaving(false);
      return;
    }
    setIsDisabled(newState);
    showToast(newState ? 'Profile hidden from search' : 'Profile visible in search', 'success');
    onUpdate();
    setIsSaving(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
    if (error) {
      showToast('Failed to delete profile', 'error');
      return;
    }
    showToast('Profile deleted', 'info');
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

// Verification Tab - Simplified: just selfie with handwritten note (profile name + date)
function VerificationTab({
  profile,
  application,
  onUpdate
}: {
  profile: Profile;
  application: VerificationApplication | null;
  onUpdate: () => void;
}) {
  const t = useTranslations('dashboard');
  const { user } = useAuth();
  const supabase = createClient();
  const selfieRef = useRef<HTMLInputElement>(null);

  const [selfieUrl, setSelfieUrl] = useState(application?.selfieWithIdUrl || '');
  const [notes, setNotes] = useState(application?.notes || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Get today's date formatted
  const todayDate = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('images', file);
      formData.append('folder', 'verifications'); // Store in separate folder

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success && result.urls?.[0]) {
        setSelfieUrl(result.urls[0]);
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selfieUrl || !user) return;

    setIsSubmitting(true);
    try {
      if (application) {
        // Update existing application
        // Note: Table uses snake_case columns
        await supabase
          .from('verification_applications')
          .update({
            selfie_with_id_url: selfieUrl,
            id_photo_url: selfieUrl,
            notes,
            status: 'pending',
            "updatedAt": new Date().toISOString()
          })
          .eq('id', application.id);
      } else {
        // Create new application
        // Note: Table uses snake_case columns
        await supabase
          .from('verification_applications')
          .insert({
            profile_id: profile.id,
            user_id: user.id,
            selfie_with_id_url: selfieUrl,
            id_photo_url: selfieUrl,
            notes,
            status: 'pending',
            "createdAt": new Date().toISOString(),
            "updatedAt": new Date().toISOString()
          });
      }
      onUpdate();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Already has a pending application
  if (application?.status === 'pending') {
    return (
      <div className="space-y-6">
        <div className="bg-amber-900/10 border border-amber-800 rounded-lg p-8 text-center">
          <Clock className="mx-auto text-amber-400 mb-4" size={48} />
          <h3 className="text-xl font-serif text-white mb-2">{t('verification_pending_title')}</h3>
          <p className="text-neutral-400 mb-4">{t('verification_pending_desc')}</p>
          <p className="text-amber-400 text-sm">{t('verification_submitted_on')} {new Date(application.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">{t('verification_photo')}</p>
          <div className="aspect-video bg-neutral-800 rounded-lg overflow-hidden max-w-md mx-auto">
            <img src={application.selfieWithIdUrl} alt="Verification" className="w-full h-full object-cover blur-sm" />
          </div>
        </div>
      </div>
    );
  }

  // Approved - show success message
  if (application?.status === 'approved' || profile.isVerified) {
    return (
      <div className="space-y-6">
        <div className="bg-green-900/10 border border-green-800 rounded-lg p-8 text-center">
          <ShieldCheck className="mx-auto text-green-400 mb-4" size={48} />
          <h3 className="text-xl font-serif text-white mb-2">{t('verification_approved_title')}</h3>
          <p className="text-neutral-400 mb-4">{t('verification_approved_desc')}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
            <Check size={16} /> {t('verified_badge')}
          </div>
        </div>
      </div>
    );
  }

  // Rejected - allow resubmission
  if (application?.status === 'rejected') {
    return (
      <div className="space-y-6">
        <div className="bg-red-900/10 border border-red-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <X className="text-red-400" size={24} />
            <h3 className="text-lg font-semibold text-white">{t('verification_rejected_title')}</h3>
          </div>
          <p className="text-neutral-400 mb-2">{t('verification_rejected_desc')}</p>
          {application.adminNotes && (
            <p className="text-red-300 text-sm bg-red-900/20 p-3 rounded-md mt-3">
              <strong>{t('reason')}:</strong> {application.adminNotes}
            </p>
          )}
        </div>

        {/* Show resubmission form */}
        <VerificationFormSimple
          profile={profile}
          selfieUrl={selfieUrl}
          setSelfieUrl={setSelfieUrl}
          notes={notes}
          setNotes={setNotes}
          handleImageUpload={handleImageUpload}
          handleSubmit={handleSubmit}
          isUploading={isUploading}
          isSubmitting={isSubmitting}
          uploadError={uploadError}
          selfieRef={selfieRef}
          todayDate={todayDate}
          t={t}
        />
      </div>
    );
  }

  // No application yet - show form
  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="text-luxury-gold" size={24} />
          <h3 className="text-lg font-semibold text-white">{t('get_verified')}</h3>
        </div>
        <p className="text-neutral-400 mb-4">{t('verification_benefits')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-green-400">
            <Check size={16} /> {t('benefit_badge')}
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <Check size={16} /> {t('benefit_trust')}
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <Check size={16} /> {t('benefit_visibility')}
          </div>
        </div>
      </div>

      <VerificationFormSimple
        profile={profile}
        selfieUrl={selfieUrl}
        setSelfieUrl={setSelfieUrl}
        notes={notes}
        setNotes={setNotes}
        handleImageUpload={handleImageUpload}
        handleSubmit={handleSubmit}
        isUploading={isUploading}
        isSubmitting={isSubmitting}
        uploadError={uploadError}
        selfieRef={selfieRef}
        todayDate={todayDate}
        t={t}
      />
    </div>
  );
}

// Simplified verification form - just one photo with handwritten note
function VerificationFormSimple({
  profile,
  selfieUrl,
  setSelfieUrl,
  notes,
  setNotes,
  handleImageUpload,
  handleSubmit,
  isUploading,
  isSubmitting,
  uploadError,
  selfieRef,
  todayDate,
  t
}: {
  profile: Profile;
  selfieUrl: string;
  setSelfieUrl: (url: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  isUploading: boolean;
  isSubmitting: boolean;
  uploadError: string;
  selfieRef: React.RefObject<HTMLInputElement>;
  todayDate: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      {uploadError && (
        <div className="bg-red-900/20 border border-red-900/50 p-3 text-red-300 rounded-md text-sm">
          {uploadError}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-900/10 border border-blue-800/50 rounded-lg p-6">
        <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
          <Camera size={18} /> {t('verification_instructions_title')}
        </h4>
        <ol className="text-neutral-300 text-sm space-y-2 list-decimal list-inside">
          <li>{t('verification_step_1')}</li>
          <li>{t('verification_step_2', { name: profile.name, date: todayDate })}</li>
          <li>{t('verification_step_3')}</li>
        </ol>
        <div className="mt-4 p-3 bg-neutral-900/50 rounded-md border border-neutral-800">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{t('verification_note_example')}</p>
          <p className="text-luxury-gold font-medium">&quot;{profile.name}&quot; - {todayDate}</p>
        </div>
      </div>

      {/* Selfie Upload */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
          <Camera size={18} className="text-luxury-gold" /> {t('verification_photo')}
        </h4>
        <p className="text-neutral-500 text-sm mb-4">{t('verification_photo_desc')}</p>

        <input
          ref={selfieRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {selfieUrl ? (
          <div className="relative aspect-video bg-neutral-800 rounded-lg overflow-hidden group max-w-md mx-auto">
            <img src={selfieUrl} alt="Verification" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                onClick={() => selfieRef.current?.click()}
                className="bg-luxury-gold text-black px-4 py-2 rounded-md text-sm font-medium"
              >
                {t('change')}
              </button>
              <button
                onClick={() => setSelfieUrl('')}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {t('remove')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => selfieRef.current?.click()}
            disabled={isUploading}
            className="w-full max-w-md mx-auto aspect-video border-2 border-dashed border-neutral-700 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-luxury-gold transition-colors"
          >
            <Upload size={32} className="text-neutral-500" />
            <span className="text-neutral-400 text-sm">{isUploading ? 'Uploading...' : t('upload_verification_photo')}</span>
          </button>
        )}
      </div>

      {/* Notes */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h4 className="text-white font-semibold mb-2">{t('additional_notes')}</h4>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none resize-none"
          placeholder={t('notes_placeholder')}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!selfieUrl || isSubmitting}
          className="flex items-center gap-2 px-8"
        >
          <ShieldCheck size={16} />
          {isSubmitting ? t('submitting') : t('submit_verification')}
        </Button>
      </div>
    </>
  );
}

// Agency Overview Tab
function AgencyOverviewTab({
  agency,
  profiles,
  setAgencyTab
}: {
  agency: Agency;
  profiles: Profile[];
  setAgencyTab: (tab: AgencyTab) => void;
}) {
  const t = useTranslations('dashboard');

  const totalClicks = profiles.reduce((sum, p) => sum + (p.clicks || 0), 0);
  const totalContactClicks = profiles.reduce((sum, p) => sum + (p.contactClicks || 0), 0);
  const totalFavorites = profiles.reduce((sum, p) => sum + (p.favoritesCount || 0), 0);
  const activeModels = profiles.filter(p => !p.isDisabled).length;

  // Get tier info
  const tier = (agency.subscriptionTier || 'none') as AgencyTier;
  const limits = getAgencyTierLimits(tier);

  return (
    <div className="space-y-6">
      {/* Agency Info Banner */}
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {agency.banner && (
          <div className="absolute inset-0 opacity-20">
            <img src={agency.banner} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative p-6 flex items-center gap-6">
          <div className="w-20 h-20 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-700">
            {agency.logo ? (
              <img src={agency.logo} alt={agency.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 size={32} className="text-neutral-600" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-serif text-2xl text-white">{agency.name}</h2>
              {tier !== 'none' && (
                <span className={`text-xs px-2 py-0.5 rounded ${tier === 'pro' ? 'bg-luxury-gold/20 text-luxury-gold' : 'bg-neutral-700 text-neutral-300'}`}>
                  {tier === 'pro' ? 'PRO' : 'STARTER'}
                </span>
              )}
            </div>
            <p className="text-neutral-400 text-sm line-clamp-2">{agency.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Users size={12} /> {profiles.length}/{limits.maxModels || '∞'} {t('models')}
              </span>
              {agency.website && (
                <span className="flex items-center gap-1">
                  <Globe size={12} /> {agency.website}
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={() => setAgencyTab('agency')} className="flex items-center gap-2">
            <Building2 size={14} /> {t('edit_agency')}
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label={t('total_views')} value={totalClicks} emoji="👁️" />
        <MetricCard label={t('contact_clicks')} value={totalContactClicks} emoji="📞" />
        <MetricCard label={t('favorites')} value={totalFavorites} emoji="❤️" />
        <MetricCard label={t('active_models')} value={activeModels} emoji="✨" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickActionCard icon={<Building2 size={20} />} label={t('edit_agency')} onClick={() => setAgencyTab('agency')} />
        <QuickActionCard icon={<Users size={20} />} label={t('manage_models')} onClick={() => setAgencyTab('models')} />
        <QuickActionCard icon={<Plus size={20} />} label={t('add_model')} onClick={() => setAgencyTab('models')} />
        <QuickActionCard icon={<CreditCard size={20} />} label={t('billing')} onClick={() => setAgencyTab('billing')} />
      </div>

      {/* Recent Models with Metrics */}
      {profiles.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">{t('your_models')}</h3>
            <button onClick={() => setAgencyTab('models')} className="text-luxury-gold text-sm hover:underline">
              {t('view_all')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {profiles.slice(0, 4).map(profile => (
              <div key={profile.id} className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                <div className="aspect-square w-full mb-3 rounded-md overflow-hidden bg-neutral-800 relative">
                  {profile.images?.[0] ? (
                    <img src={profile.images[0]} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={24} className="text-neutral-600" />
                    </div>
                  )}
                  {profile.isDisabled && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-red-400 text-xs font-bold">{t('disabled')}</span>
                    </div>
                  )}
                </div>
                <h4 className="text-white font-medium text-sm truncate">{profile.name}</h4>
                <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Eye size={10} /> {profile.clicks || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone size={10} /> {profile.contactClicks || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={10} /> {profile.favoritesCount || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Agency Profile Editor Tab
function AgencyProfileEditor({ agency, onUpdate }: { agency: Agency; onUpdate: () => void }) {
  const t = useTranslations('dashboard');
  const supabase = createClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: agency.name,
    description: agency.description,
    logo: agency.logo || '',
    banner: agency.banner || '',
    website: agency.website || '',
    phone: agency.phone || '',
    whatsapp: agency.whatsapp || '',
    telegram: agency.telegram || '',
    email: agency.email,
    district: agency.district
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const updateField = <K extends keyof typeof formData>(key: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('images', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const result = await response.json();
      if (result.success && result.urls?.[0]) {
        updateField(field, result.urls[0]);
        // Auto-save
        await supabase.from('agencies').update({ [field]: result.urls[0] }).eq('id', agency.id);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await supabase.from('agencies').update({
        name: formData.name,
        description: formData.description,
        logo: formData.logo,
        banner: formData.banner,
        website: formData.website,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        telegram: formData.telegram,
        email: formData.email,
        district: formData.district
      }).eq('id', agency.id);

      setSaveSuccess(true);
      onUpdate();
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner & Logo */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {/* Banner */}
        <div
          className="relative h-40 bg-neutral-800 cursor-pointer group"
          onClick={() => bannerInputRef.current?.click()}
        >
          {formData.banner ? (
            <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={32} className="text-neutral-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm flex items-center gap-2">
              <Upload size={16} /> {t('upload_banner')}
            </span>
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleImageUpload(e, 'banner')}
          />
        </div>

        {/* Logo & Name */}
        <div className="p-6 flex items-center gap-6">
          <div
            className="w-24 h-24 bg-neutral-800 rounded-lg overflow-hidden cursor-pointer group relative flex-shrink-0 border border-neutral-700"
            onClick={() => logoInputRef.current?.click()}
          >
            {formData.logo ? (
              <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 size={32} className="text-neutral-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload size={16} className="text-white" />
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleImageUpload(e, 'logo')}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('agency_name')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md text-xl font-serif focus:border-luxury-gold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white">{t('agency_details')}</h3>

        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('about')}</label>
          <textarea
            value={formData.description}
            onChange={e => updateField('description', e.target.value)}
            rows={4}
            className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none resize-none"
            placeholder="Tell clients about your agency..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <InputField
            label={t('website')}
            value={formData.website}
            onChange={v => updateField('website', v)}
            icon={<Globe size={16} />}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Contact */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Phone size={18} className="text-luxury-gold" /> {t('contact_info')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={t('email')}
            value={formData.email}
            onChange={v => updateField('email', v)}
            placeholder="contact@agency.com"
          />
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

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isUploading} className="flex items-center gap-2 px-8">
          {saveSuccess ? <Check size={16} /> : <Save size={16} />}
          {isSaving ? 'Saving...' : saveSuccess ? t('saved') : t('save')}
        </Button>
      </div>
    </div>
  );
}

// Agency Models Tab
function AgencyModelsTab({
  agency,
  profiles,
  onUpdate
}: {
  agency: Agency;
  profiles: Profile[];
  onUpdate: () => void;
}) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Capacity calculations
  const tier = (agency.subscriptionTier || 'none') as AgencyTier;
  const limits = getAgencyTierLimits(tier);
  const maxModels = limits.maxModels;
  const isAtLimit = profiles.length >= maxModels;
  const hasActiveSubscription = tier !== 'none' && agency.subscriptionExpiresAt && new Date(agency.subscriptionExpiresAt) > new Date();

  const toggleModelStatus = async (profileId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('profiles').update({ isDisabled: !currentStatus }).eq('id', profileId);
    if (error) {
      showToast('Failed to update model status', 'error');
      return;
    }
    showToast(currentStatus ? 'Model activated' : 'Model deactivated', 'success');
    onUpdate();
  };

  const handleDelete = async (profileId: string) => {
    // Soft delete - unlink from agency and disable
    const { error } = await supabase.from('profiles').update({ agencyId: null, isDisabled: true }).eq('id', profileId);
    if (error) {
      showToast('Failed to remove model', 'error');
      return;
    }
    showToast('Model removed from agency', 'success');
    setShowDeleteConfirm(null);
    onUpdate();
  };

  const handleAddModel = () => {
    if (!hasActiveSubscription) {
      router.push('/packages');
      return;
    }
    if (isAtLimit) {
      router.push('/packages');
      return;
    }
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Capacity */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{t('your_models')}</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-neutral-500 text-sm">{profiles.length}/{maxModels || '∞'} {t('models')}</p>
            {maxModels > 0 && (
              <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isAtLimit ? 'bg-red-500' : 'bg-luxury-gold'}`}
                  style={{ width: `${Math.min((profiles.length / maxModels) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
        <Button
          onClick={handleAddModel}
          disabled={!hasActiveSubscription}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> {t('add_model')}
        </Button>
      </div>

      {/* Capacity Warning */}
      {isAtLimit && hasActiveSubscription && (
        <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-400" size={20} />
            <div>
              <p className="text-white font-medium">{t('at_model_limit')}</p>
              <p className="text-amber-200/70 text-sm">{t('upgrade_for_more_models')}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/packages')} className="text-sm">
            {t('upgrade_plan')}
          </Button>
        </div>
      )}

      {/* No Subscription Warning */}
      {!hasActiveSubscription && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="text-red-400" size={20} />
            <div>
              <p className="text-white font-medium">{t('subscription_required')}</p>
              <p className="text-red-200/70 text-sm">{t('subscribe_to_manage_models')}</p>
            </div>
          </div>
          <Button onClick={() => router.push('/packages')} className="text-sm">
            {t('view_plans')}
          </Button>
        </div>
      )}

      {/* Models Grid */}
      {profiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className={`bg-neutral-900 border rounded-lg overflow-hidden ${
                profile.isDisabled ? 'border-red-900/50 opacity-75' : 'border-neutral-800'
              }`}
            >
              <div className="aspect-video bg-neutral-800 relative">
                {profile.images?.[0] ? (
                  <img src={profile.images[0]} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={32} className="text-neutral-600" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {limits.badge === 'elite' && (
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">ELITE</span>
                  )}
                  {limits.badge === 'premium' && (
                    <span className="bg-luxury-gold text-black text-[10px] font-bold px-2 py-0.5 rounded">PREMIUM</span>
                  )}
                  {profile.isVerified && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                      <ShieldCheck size={10} /> VERIFIED
                    </span>
                  )}
                </div>
                {profile.isDisabled && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-red-400 text-sm font-bold uppercase">{t('disabled')}</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">{profile.name}</h3>
                  <span className="text-luxury-gold font-bold">{profile.priceStart}€/h</span>
                </div>

                {/* Model Info */}
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                  <span>{profile.age} {t('years')}</span>
                  <span>•</span>
                  <span>{profile.district}</span>
                </div>

                {/* Metrics Row */}
                <div className="flex items-center gap-4 text-xs text-neutral-400 mb-4 py-2 border-y border-neutral-800">
                  <span className="flex items-center gap-1">
                    <Eye size={12} className="text-neutral-500" />
                    {profile.clicks || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-neutral-500" />
                    {profile.contactClicks || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={12} className="text-neutral-500" />
                    {profile.favoritesCount || 0}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingProfile(profile)}
                    className="flex-1 px-3 py-2 bg-luxury-gold hover:bg-luxury-gold/90 text-black text-sm rounded-md flex items-center justify-center gap-1 font-medium"
                  >
                    <Sparkles size={14} /> {t('edit')}
                  </button>
                  <button
                    onClick={() => router.push(`/profile/${profile.id}`)}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded-md flex items-center justify-center"
                    title={t('view')}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => toggleModelStatus(profile.id, profile.isDisabled || false)}
                    className={`px-3 py-2 text-sm rounded-md flex items-center justify-center ${
                      profile.isDisabled
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                    }`}
                    title={profile.isDisabled ? t('enable') : t('disable')}
                  >
                    {profile.isDisabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(profile.id)}
                    className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm rounded-md flex items-center justify-center"
                    title={t('delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : hasActiveSubscription ? (
        <div className="text-center py-20 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-lg">
          <Users size={48} className="mx-auto text-neutral-700 mb-4" />
          <h3 className="text-xl text-white font-serif mb-2">{t('no_models')}</h3>
          <p className="text-neutral-500 mb-6">{t('no_models_desc')}</p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} className="mr-2" /> {t('add_first_model')}
          </Button>
        </div>
      ) : (
        <div className="text-center py-20 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-lg">
          <Lock size={48} className="mx-auto text-neutral-700 mb-4" />
          <h3 className="text-xl text-white font-serif mb-2">{t('subscribe_first')}</h3>
          <p className="text-neutral-500 mb-6">{t('subscribe_to_add_models')}</p>
          <Button onClick={() => router.push('/packages')}>
            {t('view_plans')}
          </Button>
        </div>
      )}

      {/* Add Model Modal */}
      {showAddModal && (
        <AddModelModal
          agencyId={agency.id}
          agencyTier={tier}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            onUpdate();
          }}
        />
      )}

      {/* Edit Model Modal */}
      {editingProfile && (
        <AgencyModelEditor
          profile={editingProfile}
          agencyTier={tier}
          onClose={() => setEditingProfile(null)}
          onSave={() => {
            setEditingProfile(null);
            onUpdate();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center">
                <Trash2 className="text-red-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('delete_model')}</h3>
                <p className="text-neutral-400 text-sm">{t('delete_model_confirm')}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-md font-medium"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Model Modal
function AddModelModal({
  agencyId,
  agencyTier,
  onClose,
  onSuccess
}: {
  agencyId: string;
  agencyTier: AgencyTier;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('dashboard');
  const supabase = createClient();
  const [name, setName] = useState('');
  const [age, setAge] = useState(18);
  const [district, setDistrict] = useState<District>(District.MITTE);
  const [priceStart, setPriceStart] = useState(150);
  const [isCreating, setIsCreating] = useState(false);

  const limits = getAgencyTierLimits(agencyTier);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      // Set tier based on agency tier (models inherit from agency)
      const modelTier: ModelTier = agencyTier === 'pro' ? 'elite' : agencyTier === 'starter' ? 'premium' : 'free';

      await supabase.from('profiles').insert({
        name: name.trim(),
        age,
        district,
        priceStart,
        agencyId,
        description: '',
        images: [],
        services: [],
        languages: ['Deutsch'],
        isPremium: modelTier === 'premium' || modelTier === 'elite',
        tier: modelTier,
        isNew: true,
        isVerified: false,
        isVelvetChoice: false,
        clicks: 0,
        contactClicks: 0,
        searchAppearances: 0,
        favoritesCount: 0,
        reviews: [],
        availability: [],
        videoUrls: [],
        boostsRemaining: limits.boostsPerMonth === Infinity ? 999 : limits.boostsPerMonth,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-serif text-white flex items-center gap-2">
            <Plus size={20} className="text-luxury-gold" /> {t('add_new_model')}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <AlertCircle size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('name')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Model name"
              className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('age')}</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(Number(e.target.value))}
                min={18}
                className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('hourly_rate')}</label>
              <input
                type="number"
                value={priceStart}
                onChange={e => setPriceStart(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('district')}</label>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value as District)}
              className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
            >
              {Object.values(District).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md font-medium"
          >
            {t('cancel')}
          </button>
          <Button onClick={handleCreate} disabled={isCreating || !name.trim()} className="flex-1">
            {isCreating ? 'Creating...' : t('create_model')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Agency Model Editor - Full profile editing modal for agencies
function AgencyModelEditor({
  profile,
  agencyTier,
  onClose,
  onSave
}: {
  profile: Profile;
  agencyTier: AgencyTier;
  onClose: () => void;
  onSave: () => void;
}) {
  const t = useTranslations('dashboard');
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const limits = getAgencyTierLimits(agencyTier);
  const photoLimit = limits.photos;
  const videoLimit = limits.videos;

  type EditorTab = 'basic' | 'photos' | 'services' | 'contact' | 'schedule';
  const [activeTab, setActiveTab] = useState<EditorTab>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: profile.name,
    age: profile.age,
    priceStart: profile.priceStart,
    description: profile.description,
    district: profile.district,
    visitType: profile.visitType || 'both',
    languages: profile.languages || [],
    services: profile.services || [],
    images: profile.images || [],
    videoUrls: profile.videoUrls || [],
    phone: profile.phone || '',
    whatsapp: profile.whatsapp || '',
    telegram: profile.telegram || '',
    availability: profile.availability || [],
    showSchedule: profile.showSchedule ?? true,
    height: profile.height || 0,
    dressSize: profile.dressSize || '',
    shoeSize: profile.shoeSize || 0,
    braSize: profile.braSize || ''
  });

  const updateField = <K extends keyof typeof formData>(key: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = photoLimit === Infinity ? 99 : photoLimit - formData.images.length;
    if (remainingSlots <= 0) return;

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      filesToUpload.forEach(file => uploadFormData.append('images', file));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const result = await response.json();
      if (result.success && result.urls) {
        updateField('images', [...formData.images, ...result.urls]);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    updateField('images', formData.images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...formData.images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newImages.length) return;
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    updateField('images', newImages);
  };

  const toggleService = (service: string) => {
    const current = formData.services;
    const serviceValue = service as ServiceType;
    if (current.includes(serviceValue)) {
      updateField('services', current.filter(s => s !== serviceValue));
    } else {
      updateField('services', [...current, serviceValue]);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (formData.languages.includes(lang)) {
      updateField('languages', formData.languages.filter(l => l !== lang));
    } else {
      updateField('languages', [...formData.languages, lang]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await supabase.from('profiles').update({
        name: formData.name,
        age: formData.age,
        priceStart: formData.priceStart,
        description: formData.description,
        district: formData.district,
        visitType: formData.visitType,
        languages: formData.languages,
        services: formData.services,
        images: formData.images,
        videoUrls: formData.videoUrls.slice(0, videoLimit),
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        telegram: formData.telegram,
        availability: formData.availability,
        showSchedule: formData.showSchedule,
        height: formData.height,
        dressSize: formData.dressSize,
        shoeSize: formData.shoeSize,
        braSize: formData.braSize
      }).eq('id', profile.id);

      onSave();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabClass = (tab: EditorTab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      activeTab === tab
        ? 'bg-neutral-800 text-white border-b-2 border-luxury-gold'
        : 'text-neutral-400 hover:text-white'
    }`;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-neutral-800 rounded-lg overflow-hidden">
                {formData.images[0] ? (
                  <img src={formData.images[0]} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={24} className="text-neutral-600" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-serif text-white">{t('edit_model')}: {profile.name}</h2>
                <p className="text-neutral-500 text-sm flex items-center gap-2">
                  {limits.badge === 'elite' && <span className="text-purple-400">Elite</span>}
                  {limits.badge === 'premium' && <span className="text-luxury-gold">Premium</span>}
                  {t('tier_features')}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-white p-2">
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-4 border-b border-neutral-800">
            <button className={tabClass('basic')} onClick={() => setActiveTab('basic')}>
              <User size={14} className="inline mr-1" /> {t('basic_info')}
            </button>
            <button className={tabClass('photos')} onClick={() => setActiveTab('photos')}>
              <ImageIcon size={14} className="inline mr-1" /> {t('photos')}
              <span className="ml-1 text-xs text-neutral-500">({formData.images.length}/{photoLimit === Infinity ? '∞' : photoLimit})</span>
            </button>
            <button className={tabClass('services')} onClick={() => setActiveTab('services')}>
              <Sparkles size={14} className="inline mr-1" /> {t('services')}
            </button>
            <button className={tabClass('contact')} onClick={() => setActiveTab('contact')}>
              <Phone size={14} className="inline mr-1" /> {t('contact')}
            </button>
            {limits.schedule && (
              <button className={tabClass('schedule')} onClick={() => setActiveTab('schedule')}>
                <Calendar size={14} className="inline mr-1" /> {t('schedule')}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 min-h-[400px]">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('name')}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => updateField('name', e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('age')}</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={e => updateField('age', Number(e.target.value))}
                      min={18}
                      className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('hourly_rate')} (€)</label>
                    <input
                      type="number"
                      value={formData.priceStart}
                      onChange={e => updateField('priceStart', Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                    />
                  </div>
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
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('visit_type')}</label>
                  <div className="flex gap-3">
                    {(['incall', 'outcall', 'both'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => updateField('visitType', type)}
                        className={`flex-1 py-3 rounded-md text-sm font-medium transition-colors ${
                          formData.visitType === type
                            ? 'bg-luxury-gold text-black'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {t(`visit_${type}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('description')}</label>
                  <textarea
                    value={formData.description}
                    onChange={e => updateField('description', e.target.value)}
                    rows={4}
                    className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none resize-none"
                    placeholder={t('description_placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('languages')}</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_LANGUAGES.map(lang => (
                      <button
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                          formData.languages.includes(lang)
                            ? 'bg-luxury-gold text-black'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Physical attributes */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('height')} (cm)</label>
                    <input
                      type="number"
                      value={formData.height || ''}
                      onChange={e => updateField('height', Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('dress_size')}</label>
                    <input
                      type="text"
                      value={formData.dressSize}
                      onChange={e => updateField('dressSize', e.target.value)}
                      placeholder="S, M, L..."
                      className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('shoe_size')}</label>
                    <input
                      type="number"
                      value={formData.shoeSize || ''}
                      onChange={e => updateField('shoeSize', Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">{t('bra_size')}</label>
                    <input
                      type="text"
                      value={formData.braSize}
                      onChange={e => updateField('braSize', e.target.value)}
                      placeholder="75B..."
                      className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{t('photos')}</h3>
                    <p className="text-neutral-500 text-sm">
                      {formData.images.length}/{photoLimit === Infinity ? '∞' : photoLimit} {t('photos_uploaded')}
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || (photoLimit !== Infinity && formData.images.length >= photoLimit)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} />
                    {isUploading ? t('uploading') : t('upload_photos')}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                {formData.images.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative group aspect-square bg-neutral-800 rounded-lg overflow-hidden">
                        <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-2 left-2 bg-luxury-gold text-black text-[10px] font-bold px-2 py-0.5 rounded">
                            MAIN
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {i > 0 && (
                            <button
                              onClick={() => moveImage(i, 'up')}
                              className="p-2 bg-neutral-900 rounded-md text-white hover:bg-neutral-800"
                            >
                              ←
                            </button>
                          )}
                          <button
                            onClick={() => removeImage(i)}
                            className="p-2 bg-red-600 rounded-md text-white hover:bg-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                          {i < formData.images.length - 1 && (
                            <button
                              onClick={() => moveImage(i, 'down')}
                              className="p-2 bg-neutral-900 rounded-md text-white hover:bg-neutral-800"
                            >
                              →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-neutral-700 rounded-lg p-12 text-center">
                    <ImageIcon size={48} className="mx-auto text-neutral-600 mb-4" />
                    <p className="text-neutral-400">{t('no_photos_yet')}</p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4"
                    >
                      {t('upload_first_photo')}
                    </Button>
                  </div>
                )}

                {/* Videos Section */}
                {videoLimit > 0 && (
                  <div className="mt-8">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Video size={18} /> {t('videos')} ({formData.videoUrls.length}/{videoLimit})
                    </h3>
                    <div className="space-y-3">
                      {Array.from({ length: videoLimit }).map((_, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={formData.videoUrls[i] || ''}
                            onChange={e => {
                              const newUrls = [...formData.videoUrls];
                              newUrls[i] = e.target.value;
                              updateField('videoUrls', newUrls.filter(u => u));
                            }}
                            placeholder={`Video URL ${i + 1} (YouTube, etc.)`}
                            className="flex-1 bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                          />
                          {formData.videoUrls[i] && (
                            <button
                              onClick={() => {
                                const newUrls = formData.videoUrls.filter((_, idx) => idx !== i);
                                updateField('videoUrls', newUrls);
                              }}
                              className="px-3 bg-red-900/30 text-red-400 rounded-md hover:bg-red-900/50"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                {Object.entries(SERVICE_CATEGORIES).map(([key, { label, services }]) => (
                  <div key={key}>
                    <h4 className="text-white font-medium mb-3">{label}</h4>
                    <div className="flex flex-wrap gap-2">
                      {services.map(service => (
                        <button
                          key={service}
                          onClick={() => toggleService(service)}
                          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                            (formData.services as string[]).includes(service)
                              ? 'bg-luxury-gold text-black'
                              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          }`}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-2">
                    <Phone size={14} /> {t('phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    placeholder="+49 123 456789"
                    className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-2">
                    <MessageCircle size={14} /> WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={e => updateField('whatsapp', e.target.value)}
                    placeholder="+49 123 456789"
                    className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-2">
                    <Send size={14} /> Telegram
                  </label>
                  <input
                    type="text"
                    value={formData.telegram}
                    onChange={e => updateField('telegram', e.target.value)}
                    placeholder="@username"
                    className="w-full bg-neutral-950 border border-neutral-700 text-white p-3 rounded-md focus:border-luxury-gold focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && limits.schedule && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-medium">{t('weekly_schedule')}</h3>
                    <p className="text-neutral-500 text-sm">{t('schedule_desc')}</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showSchedule}
                      onChange={e => updateField('showSchedule', e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-700 bg-neutral-950 text-luxury-gold focus:ring-luxury-gold"
                    />
                    <span className="text-neutral-300 text-sm">{t('show_schedule')}</span>
                  </label>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const isAvailable = formData.availability.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          if (isAvailable) {
                            updateField('availability', formData.availability.filter(d => d !== day));
                          } else {
                            updateField('availability', [...formData.availability, day]);
                          }
                        }}
                        className={`py-4 rounded-lg text-sm font-medium transition-colors ${
                          isAvailable
                            ? 'bg-luxury-gold text-black'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-800 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md font-medium"
            >
              {t('cancel')}
            </button>
            <Button onClick={handleSave} disabled={isSaving} className="px-8 flex items-center gap-2">
              {isSaving ? (
                <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> {t('saving')}</>
              ) : (
                <><Save size={16} /> {t('save_changes')}</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Agency Billing Tab
function AgencyBillingTab({ agency }: { agency: Agency }) {
  const t = useTranslations('dashboard');
  const router = useRouter();

  const tier = (agency.subscriptionTier || 'none') as AgencyTier;
  const limits = getAgencyTierLimits(tier);
  const expiresAt = agency.subscriptionExpiresAt ? new Date(agency.subscriptionExpiresAt) : null;
  const isActive = tier !== 'none' && expiresAt && expiresAt > new Date();
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <div className={`border rounded-lg p-6 ${isActive ? 'bg-luxury-gold/5 border-luxury-gold/30' : 'bg-neutral-900 border-neutral-800'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {tier === 'pro' ? (
              <Crown className="text-luxury-gold" size={24} />
            ) : tier === 'starter' ? (
              <Star className="text-luxury-gold" size={24} />
            ) : (
              <CreditCard className="text-neutral-600" size={24} />
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">
                {tier === 'pro' ? 'Agency Pro' : tier === 'starter' ? 'Agency Starter' : t('no_subscription')}
              </h3>
              {isActive && expiresAt && (
                <p className="text-sm text-neutral-400">
                  {daysLeft > 0 ? `${daysLeft} ${t('days_remaining')}` : t('expires_today')} • {expiresAt.toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          {isActive && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full font-medium">
              {t('active')}
            </span>
          )}
        </div>

        {isActive ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{limits.maxModels}</p>
              <p className="text-xs text-neutral-500 uppercase">{t('max_models')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{limits.photos === Infinity ? '∞' : limits.photos}</p>
              <p className="text-xs text-neutral-500 uppercase">{t('photos_per_model')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{limits.videos}</p>
              <p className="text-xs text-neutral-500 uppercase">{t('videos_per_model')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{limits.badge === 'elite' ? '👑' : limits.badge === 'premium' ? '⭐' : '—'}</p>
              <p className="text-xs text-neutral-500 uppercase">{t('model_badge')}</p>
            </div>
          </div>
        ) : (
          <p className="text-neutral-400 text-sm">{t('no_subscription_desc')}</p>
        )}
      </div>

      {/* Upgrade Options */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{tier === 'none' ? t('get_started') : t('upgrade_plan')}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Starter */}
          <div className={`border rounded-lg p-5 ${tier === 'starter' ? 'border-luxury-gold bg-luxury-gold/5' : 'border-neutral-700 hover:border-neutral-600'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Agency Starter</h4>
              {tier === 'starter' && <span className="text-xs text-luxury-gold">{t('current')}</span>}
            </div>
            <p className="text-3xl font-bold text-white mb-1">499€<span className="text-sm text-neutral-500">/mo</span></p>
            <ul className="text-sm text-neutral-400 space-y-1 mb-4">
              <li>• {t('up_to_models', { count: 5 })}</li>
              <li>• {t('premium_badge_models')}</li>
              <li>• {t('agency_dashboard')}</li>
            </ul>
            {tier !== 'starter' && (
              <Button variant="outline" className="w-full" onClick={() => router.push('/packages')}>
                {tier === 'none' ? t('get_started') : t('downgrade')}
              </Button>
            )}
          </div>

          {/* Pro */}
          <div className={`border rounded-lg p-5 ${tier === 'pro' ? 'border-luxury-gold bg-luxury-gold/5' : 'border-neutral-700 hover:border-neutral-600'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold flex items-center gap-2">
                Agency Pro <span className="text-[10px] bg-luxury-gold text-black px-1.5 py-0.5 rounded">POPULAR</span>
              </h4>
              {tier === 'pro' && <span className="text-xs text-luxury-gold">{t('current')}</span>}
            </div>
            <p className="text-3xl font-bold text-white mb-1">899€<span className="text-sm text-neutral-500">/mo</span></p>
            <ul className="text-sm text-neutral-400 space-y-1 mb-4">
              <li>• {t('up_to_models', { count: 15 })}</li>
              <li>• {t('elite_badge_models')}</li>
              <li>• {t('advanced_analytics')}</li>
              <li>• {t('priority_support')}</li>
            </ul>
            {tier !== 'pro' && (
              <Button className="w-full" onClick={() => router.push('/packages')}>
                {tier === 'none' ? t('get_started') : t('upgrade_now')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Agency Subscription Banner
function AgencySubscriptionBanner({ agency, modelCount }: { agency: Agency; modelCount: number }) {
  const t = useTranslations('dashboard');
  const router = useRouter();

  const tier = (agency.subscriptionTier || 'none') as AgencyTier;
  const limits = getAgencyTierLimits(tier);
  const maxModels = limits.maxModels;
  const expiresAt = agency.subscriptionExpiresAt ? new Date(agency.subscriptionExpiresAt) : null;
  const isActive = tier !== 'none' && expiresAt && expiresAt > new Date();
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const capacityPercent = maxModels > 0 ? Math.min((modelCount / maxModels) * 100, 100) : 0;
  const isNearLimit = capacityPercent >= 80;
  const isAtLimit = modelCount >= maxModels;

  // No subscription - show CTA
  if (tier === 'none' || !isActive) {
    return (
      <div className="mb-6 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-800/50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Zap className="text-amber-400" size={20} />
          </div>
          <div>
            <p className="text-white font-medium">{t('no_active_subscription')}</p>
            <p className="text-amber-200/70 text-sm">{t('subscribe_to_add_models')}</p>
          </div>
        </div>
        <Button onClick={() => router.push('/packages')} className="flex items-center gap-2">
          <Crown size={16} /> {t('view_plans')}
        </Button>
      </div>
    );
  }

  return (
    <div className={`mb-6 rounded-lg p-4 border ${isNearLimit ? 'bg-amber-900/10 border-amber-800/50' : 'bg-luxury-gold/5 border-luxury-gold/20'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Plan Badge */}
          <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${tier === 'pro' ? 'bg-luxury-gold/20 text-luxury-gold' : 'bg-neutral-800 text-neutral-300'}`}>
            {tier === 'pro' ? <Crown size={14} /> : <Star size={14} />}
            <span className="text-sm font-medium">{tier === 'pro' ? 'Pro' : 'Starter'}</span>
          </div>

          {/* Model Capacity */}
          <div className="flex items-center gap-3">
            <div className="w-32">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={isAtLimit ? 'text-red-400' : 'text-neutral-400'}>{modelCount}/{maxModels} {t('models')}</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-luxury-gold'}`}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Expiration */}
          <div className="text-sm text-neutral-400 flex items-center gap-1">
            <Calendar size={14} />
            {daysLeft > 30 ? (
              <span>{t('expires')} {expiresAt?.toLocaleDateString()}</span>
            ) : daysLeft > 0 ? (
              <span className={daysLeft <= 7 ? 'text-amber-400' : ''}>{daysLeft} {t('days_left')}</span>
            ) : (
              <span className="text-red-400">{t('expired')}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isAtLimit && (
            <Button variant="outline" onClick={() => router.push('/packages')} className="text-xs px-3 py-1">
              {t('upgrade_for_more')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
