'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createBrowserClient } from '@supabase/ssr';
import {
  Users, Building2, BarChart3, CheckCircle, Trash2, Eye, Shield, TrendingUp,
  AlertTriangle, Search, Download, RefreshCw, DollarSign,
  Activity, Flag, Ban, Phone, Image as ImageIcon, MapPin,
  ChevronDown, ChevronUp, ExternalLink, Star, CreditCard, Settings,
  ShieldCheck, X, Award, UserX, ZoomIn, Crown, Zap, Rocket
} from 'lucide-react';
import { Profile, Agency, VerificationApplication, ModelTier, AgencyTier } from '@/lib/types';
import { TIER_LIMITS } from '@/lib/packages';

type Tab = 'overview' | 'profiles' | 'fraud' | 'agencies' | 'users' | 'revenue' | 'activity' | 'verifications';

interface FraudIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  points: number;
}

interface FraudAnalysis {
  score: number;
  level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  indicators: FraudIndicator[];
}

// User data interface for future user management
// interface UserData {
//   id: string;
//   email: string;
//   created_at: string;
//   user_metadata: {
//     username?: string;
//     role?: string;
//     profile_id?: string;
//   };
// }

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Anti-Fraud Detection System
function analyzeFraudRisk(profile: Profile): FraudAnalysis {
  const indicators: FraudIndicator[] = [];
  let score = 0;

  // 1. Image Analysis
  if (!profile.images || profile.images.length === 0) {
    indicators.push({
      type: 'no_images',
      severity: 'critical',
      description: 'No profile images uploaded',
      points: 30
    });
    score += 30;
  } else if (profile.images.length === 1) {
    indicators.push({
      type: 'single_image',
      severity: 'medium',
      description: 'Only one image uploaded - possible fake profile',
      points: 15
    });
    score += 15;
  }

  // 2. Stock Photo Detection (check for common stock photo patterns in URLs)
  const stockPatterns = ['shutterstock', 'istock', 'gettyimages', 'stock', 'depositphotos', 'pexels', 'unsplash'];
  if (profile.images?.some(img => stockPatterns.some(p => img.toLowerCase().includes(p)))) {
    indicators.push({
      type: 'stock_photos',
      severity: 'critical',
      description: 'Possible stock photos detected in profile images',
      points: 40
    });
    score += 40;
  }

  // 3. Contact Information Analysis
  const hasPhone = !!profile.phone;
  const hasWhatsapp = !!profile.whatsapp;
  const hasTelegram = !!profile.telegram;
  const contactMethods = [hasPhone, hasWhatsapp, hasTelegram].filter(Boolean).length;

  if (contactMethods === 0) {
    indicators.push({
      type: 'no_contact',
      severity: 'high',
      description: 'No contact information provided',
      points: 25
    });
    score += 25;
  }

  // 4. Description Analysis
  if (!profile.description || profile.description.length < 50) {
    indicators.push({
      type: 'short_description',
      severity: 'medium',
      description: 'Profile description is too short or missing',
      points: 10
    });
    score += 10;
  }

  // Check for suspicious keywords in description
  const suspiciousKeywords = ['bitcoin', 'crypto', 'western union', 'wire transfer', 'gift card', 'advance payment', 'deposit first'];
  const descLower = profile.description?.toLowerCase() || '';
  if (suspiciousKeywords.some(k => descLower.includes(k))) {
    indicators.push({
      type: 'suspicious_keywords',
      severity: 'critical',
      description: 'Suspicious payment keywords detected in description',
      points: 35
    });
    score += 35;
  }

  // 5. Price Analysis
  if (profile.priceStart < 50) {
    indicators.push({
      type: 'unrealistic_price',
      severity: 'high',
      description: 'Unrealistically low price - likely scam',
      points: 25
    });
    score += 25;
  } else if (profile.priceStart > 1000) {
    indicators.push({
      type: 'high_price',
      severity: 'low',
      description: 'Very high price - verify legitimacy',
      points: 5
    });
    score += 5;
  }

  // 6. Age Analysis
  if (profile.age < 18) {
    indicators.push({
      type: 'underage',
      severity: 'critical',
      description: 'Age below 18 - ILLEGAL',
      points: 100
    });
    score += 100;
  } else if (profile.age > 65) {
    indicators.push({
      type: 'unusual_age',
      severity: 'low',
      description: 'Unusual age for profile',
      points: 5
    });
    score += 5;
  }

  // 7. Activity Analysis
  if (!profile.lastActive) {
    indicators.push({
      type: 'never_active',
      severity: 'medium',
      description: 'Profile has never been active',
      points: 10
    });
    score += 10;
  } else {
    const lastActive = new Date(profile.lastActive);
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive > 30) {
      indicators.push({
        type: 'inactive',
        severity: 'low',
        description: `Profile inactive for ${Math.floor(daysSinceActive)} days`,
        points: 5
      });
      score += 5;
    }
  }

  // 8. Profile Completeness
  const requiredFields = ['name', 'age', 'district', 'description', 'priceStart'];
  const missingFields = requiredFields.filter(field => !profile[field as keyof Profile]);
  if (missingFields.length > 0) {
    indicators.push({
      type: 'incomplete_profile',
      severity: 'medium',
      description: `Missing required fields: ${missingFields.join(', ')}`,
      points: missingFields.length * 5
    });
    score += missingFields.length * 5;
  }

  // 9. Services Analysis
  if (!profile.services || profile.services.length === 0) {
    indicators.push({
      type: 'no_services',
      severity: 'medium',
      description: 'No services listed',
      points: 10
    });
    score += 10;
  }

  // 10. Duplicate Detection Patterns
  const nameParts = profile.name?.toLowerCase().split(' ') || [];
  if (nameParts.some(part => /^[a-z]+\d{2,}$/.test(part))) {
    indicators.push({
      type: 'generated_name',
      severity: 'high',
      description: 'Name appears to be auto-generated (contains numbers)',
      points: 20
    });
    score += 20;
  }

  // Determine risk level
  let level: FraudAnalysis['level'] = 'safe';
  if (score >= 80) level = 'critical';
  else if (score >= 50) level = 'high';
  else if (score >= 30) level = 'medium';
  else if (score >= 10) level = 'low';

  return { score, level, indicators };
}

// Format date helper
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Transform database snake_case to camelCase for verification applications
interface DbVerificationApp {
  id: string;
  profile_id: string;
  user_id: string;
  status: string;
  id_photo_url: string;
  selfie_with_id_url: string;
  notes?: string;
  admin_notes?: string;
  createdAt: string;
  updatedAt: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

function transformVerificationApp(dbApp: DbVerificationApp): VerificationApplication {
  return {
    id: dbApp.id,
    profileId: dbApp.profile_id,
    userId: dbApp.user_id,
    status: dbApp.status as VerificationApplication['status'],
    idPhotoUrl: dbApp.id_photo_url,
    selfieWithIdUrl: dbApp.selfie_with_id_url,
    notes: dbApp.notes,
    adminNotes: dbApp.admin_notes,
    createdAt: dbApp.createdAt,
    updatedAt: dbApp.updatedAt,
    reviewedAt: dbApp.reviewed_at,
    reviewedBy: dbApp.reviewed_by
  };
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export default function VBControlPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [verificationApps, setVerificationApps] = useState<(VerificationApplication & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified' | 'premium' | 'disabled' | 'flagged'>('all');
  const [filterTier, setFilterTier] = useState<'all' | ModelTier>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'clicks' | 'fraud' | 'tier'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProfiles: 0,
    verifiedProfiles: 0,
    premiumProfiles: 0,
    totalAgencies: 0,
    totalClicks: 0,
    newThisWeek: 0,
    flaggedProfiles: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingVerifications: 0
  });

  const supabase = createClient();

  // Check admin access
  useEffect(() => {
    if (isAuthenticated !== undefined && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Fetch all data
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('createdAt', { ascending: false });

      // Fetch agencies
      const { data: agenciesData } = await supabase
        .from('agencies')
        .select('*')
        .order('name', { ascending: true });

      // Fetch subscriptions for revenue
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('*');

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'completed');

      // Fetch verification applications
      const { data: verificationsData } = await supabase
        .from('verification_applications')
        .select('*')
        .order('createdAt', { ascending: false });

      if (profilesData) {
        setProfiles(profilesData);

        // Calculate stats
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Count flagged profiles (fraud score >= 50)
        const flaggedCount = profilesData.filter(p => {
          const analysis = analyzeFraudRisk(p);
          return analysis.score >= 50;
        }).length;

        const totalRevenue = transactionsData?.reduce((sum, t) => {
          if (t.type === 'new_sale' || t.type === 'renewal') {
            return sum + (t.amount || 0);
          }
          return sum;
        }, 0) || 0;

        const activeSubscriptions = subscriptionsData?.filter(s => s.status === 'active').length || 0;
        const pendingVerifications = verificationsData?.filter(v => v.status === 'pending').length || 0;

        setStats({
          totalProfiles: profilesData.length,
          verifiedProfiles: profilesData.filter(p => p.isVerified).length,
          premiumProfiles: profilesData.filter(p => p.tier === 'premium' || p.tier === 'elite').length,
          totalAgencies: agenciesData?.length || 0,
          totalClicks: profilesData.reduce((sum, p) => sum + (p.clicks || 0), 0),
          newThisWeek: profilesData.filter(p => new Date(p.createdAt) > weekAgo).length,
          flaggedProfiles: flaggedCount,
          totalUsers: 0, // Will be updated if we can fetch users
          totalRevenue,
          activeSubscriptions,
          pendingVerifications
        });

        // Set verification apps with profile data (transform snake_case to camelCase)
        if (verificationsData) {
          const appsWithProfiles = verificationsData.map((dbApp: DbVerificationApp) => {
            const app = transformVerificationApp(dbApp);
            return {
              ...app,
              profile: profilesData.find(p => p.id === app.profileId)
            };
          });
          setVerificationApps(appsWithProfiles);
        }
      }

      if (agenciesData) {
        setAgencies(agenciesData);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Computed: Profiles with fraud analysis
  const profilesWithFraud = useMemo(() => {
    return profiles.map(profile => ({
      ...profile,
      fraudAnalysis: analyzeFraudRisk(profile)
    }));
  }, [profiles]);

  // Filtered and sorted profiles
  const filteredProfiles = useMemo(() => {
    let result = profilesWithFraud;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.district?.toLowerCase().includes(query) ||
        p.phone?.includes(query) ||
        p.whatsapp?.includes(query)
      );
    }

    // Status filter
    switch (filterStatus) {
      case 'verified':
        result = result.filter(p => p.isVerified);
        break;
      case 'unverified':
        result = result.filter(p => !p.isVerified);
        break;
      case 'premium':
        result = result.filter(p => p.tier === 'premium' || p.tier === 'elite');
        break;
      case 'disabled':
        result = result.filter(p => p.isDisabled);
        break;
      case 'flagged':
        result = result.filter(p => p.fraudAnalysis.level === 'high' || p.fraudAnalysis.level === 'critical');
        break;
    }

    // Tier filter
    if (filterTier !== 'all') {
      result = result.filter(p => (p.tier || 'free') === filterTier);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'clicks':
          comparison = (b.clicks || 0) - (a.clicks || 0);
          break;
        case 'fraud':
          comparison = b.fraudAnalysis.score - a.fraudAnalysis.score;
          break;
        case 'tier':
          // Sort order: elite > premium > free
          const tierOrder: Record<ModelTier, number> = { elite: 3, premium: 2, free: 1 };
          comparison = tierOrder[b.tier || 'free'] - tierOrder[a.tier || 'free'];
          break;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [profilesWithFraud, searchQuery, filterStatus, filterTier, sortBy, sortOrder]);

  // Actions
  const toggleVerified = async (profileId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ isVerified: !currentValue })
      .eq('id', profileId);

    if (!error) {
      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, isVerified: !currentValue } : p
      ));
      setStats(prev => ({
        ...prev,
        verifiedProfiles: prev.verifiedProfiles + (currentValue ? -1 : 1)
      }));
    }
  };

  const togglePremium = async (profileId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ isPremium: !currentValue })
      .eq('id', profileId);

    if (!error) {
      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, isPremium: !currentValue } : p
      ));
      setStats(prev => ({
        ...prev,
        premiumProfiles: prev.premiumProfiles + (currentValue ? -1 : 1)
      }));
    }
  };

  const toggleVelvetChoice = async (profileId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ isVelvetChoice: !currentValue })
      .eq('id', profileId);

    if (!error) {
      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, isVelvetChoice: !currentValue } : p
      ));
    }
  };

  const toggleTopModel = async (profileId: string, currentClicks: number) => {
    // Set clicks to 2001 to make "Top", or 0 to remove "Top"
    const newClicks = currentClicks > 2000 ? 0 : 2001;
    const { error } = await supabase
      .from('profiles')
      .update({ clicks: newClicks })
      .eq('id', profileId);

    if (!error) {
      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, clicks: newClicks } : p
      ));
    }
  };

  const toggleDisabled = async (profileId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ isDisabled: !currentValue })
      .eq('id', profileId);

    if (!error) {
      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, isDisabled: !currentValue } : p
      ));
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile and associated user account? This cannot be undone.')) {
      return;
    }

    // Find the profile to get userId
    const profile = profiles.find(p => p.id === profileId);
    const userId = profile?.userId;

    try {
      // Call API to properly delete from auth.users and all tables
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          profileId: profileId
        })
      });

      if (response.ok) {
        setProfiles(profiles.filter(p => p.id !== profileId));
        setStats(prev => ({
          ...prev,
          totalProfiles: prev.totalProfiles - 1
        }));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete profile');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete profile');
    }
  };

  const bulkAction = async (action: 'verify' | 'unverify' | 'disable' | 'delete') => {
    if (selectedProfiles.size === 0) return;

    const confirmMsg = action === 'delete'
      ? `Are you sure you want to delete ${selectedProfiles.size} profiles? This cannot be undone.`
      : `Apply ${action} to ${selectedProfiles.size} profiles?`;

    if (!confirm(confirmMsg)) return;

    const ids = Array.from(selectedProfiles);

    switch (action) {
      case 'verify':
        await supabase.from('profiles').update({ isVerified: true }).in('id', ids);
        setProfiles(profiles.map(p => ids.includes(p.id) ? { ...p, isVerified: true } : p));
        break;
      case 'unverify':
        await supabase.from('profiles').update({ isVerified: false }).in('id', ids);
        setProfiles(profiles.map(p => ids.includes(p.id) ? { ...p, isVerified: false } : p));
        break;
      case 'disable':
        await supabase.from('profiles').update({ isDisabled: true }).in('id', ids);
        setProfiles(profiles.map(p => ids.includes(p.id) ? { ...p, isDisabled: true } : p));
        break;
      case 'delete':
        // Get userIds for proper auth deletion
        const userIds = profiles
          .filter(p => ids.includes(p.id) && p.userId)
          .map(p => p.userId as string);

        if (userIds.length > 0) {
          try {
            const response = await fetch('/api/admin/delete-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds })
            });

            if (!response.ok) {
              const data = await response.json();
              console.error('Bulk delete error:', data);
            }
          } catch (error) {
            console.error('Bulk delete error:', error);
          }
        }
        setProfiles(profiles.filter(p => !ids.includes(p.id)));
        break;
    }

    setSelectedProfiles(new Set());
  };

  const toggleAgencyFeatured = async (agencyId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('agencies')
      .update({ isFeatured: !currentValue })
      .eq('id', agencyId);

    if (!error) {
      setAgencies(agencies.map(a =>
        a.id === agencyId ? { ...a, isFeatured: !currentValue } : a
      ));
    }
  };

  const deleteAgency = async (agencyId: string) => {
    if (!confirm('Are you sure you want to delete this agency and associated user account? This cannot be undone.')) return;

    // Find the agency to get userId
    const agency = agencies.find(a => a.id === agencyId);
    const userId = agency?.userId;

    try {
      // Call API to properly delete from auth.users and all tables
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          agencyId: agencyId
        })
      });

      if (response.ok) {
        setAgencies(agencies.filter(a => a.id !== agencyId));
        setStats(prev => ({ ...prev, totalAgencies: prev.totalAgencies - 1 }));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete agency');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete agency');
    }
  };

  // Verification Actions
  const approveVerification = async (appId: string, profileId: string) => {
    if (!confirm('Approve this verification? This will mark the profile as verified.')) return;

    const now = new Date().toISOString();

    // Update verification application (snake_case columns)
    const { error: appError } = await supabase
      .from('verification_applications')
      .update({
        status: 'approved',
        reviewed_at: now,
        reviewed_by: user?.id
      })
      .eq('id', appId);

    // Update profile to verified
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ isVerified: true })
      .eq('id', profileId);

    if (!appError && !profileError) {
      setVerificationApps(verificationApps.map(app =>
        app.id === appId ? { ...app, status: 'approved', reviewedAt: now } : app
      ));
      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, isVerified: true } : p
      ));
      setStats(prev => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications - 1,
        verifiedProfiles: prev.verifiedProfiles + 1
      }));
    }
  };

  const [rejectNotes, setRejectNotes] = useState<string>('');
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<(VerificationApplication & { profile?: Profile }) | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Subscription/Tier Edit Modal state
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editTier, setEditTier] = useState<ModelTier>('free');
  const [editExpiresAt, setEditExpiresAt] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [savingTier, setSavingTier] = useState(false);

  // Agency Tier Edit Modal state
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [editAgencyTier, setEditAgencyTier] = useState<AgencyTier>('none');
  const [editAgencyLimit, setEditAgencyLimit] = useState<number>(0);
  const [editAgencyExpiresAt, setEditAgencyExpiresAt] = useState<string>('');
  const [savingAgencyTier, setSavingAgencyTier] = useState(false);

  const rejectVerification = async (appId: string) => {
    if (!rejectNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    const now = new Date().toISOString();

    // snake_case columns
    const { error } = await supabase
      .from('verification_applications')
      .update({
        status: 'rejected',
        admin_notes: rejectNotes,
        reviewed_at: now,
        reviewed_by: user?.id
      })
      .eq('id', appId);

    if (!error) {
      setVerificationApps(verificationApps.map(app =>
        app.id === appId ? { ...app, status: 'rejected', adminNotes: rejectNotes, reviewedAt: now } : app
      ));
      setStats(prev => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications - 1
      }));
      setRejectingAppId(null);
      setRejectNotes('');
    }
  };

  const exportData = () => {
    const data = filteredProfiles.map(p => ({
      name: p.name,
      age: p.age,
      district: p.district,
      priceStart: p.priceStart,
      isVerified: p.isVerified,
      isPremium: p.isPremium,
      clicks: p.clicks,
      fraudScore: p.fraudAnalysis.score,
      fraudLevel: p.fraudAnalysis.level,
      createdAt: p.createdAt
    }));

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profiles-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Lightbox component for full-size image viewing
  const ImageLightbox = () => {
    if (!lightboxImage) return null;

    return (
      <div
        className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
        onClick={() => setLightboxImage(null)}
      >
        <button
          onClick={() => setLightboxImage(null)}
          className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
        >
          <X size={32} />
        </button>
        <img
          src={lightboxImage}
          alt="Full size"
          className="max-w-[90vw] max-h-[90vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  };

  // Verification Detail Modal component
  const VerificationModal = () => {
    if (!selectedVerification) return null;

    const app = selectedVerification;
    const profile = app.profile;

    const handleApprove = async () => {
      await approveVerification(app.id, app.profileId);
      setSelectedVerification(null);
    };

    const handleReject = async () => {
      if (!rejectNotes.trim()) {
        alert('Please provide a reason for rejection');
        return;
      }
      setRejectingAppId(app.id);
      await rejectVerification(app.id);
      setSelectedVerification(null);
      setRejectingAppId(null);
      setRejectNotes('');
    };

    return (
      <div
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setSelectedVerification(null)}
      >
        <div
          className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {profile ? (
                  <>
                    <div className="w-16 h-16 rounded-xl bg-neutral-800 overflow-hidden">
                      {profile.images?.[0] && (
                        <img src={profile.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">{profile.name}</h2>
                      <p className="text-neutral-400">{profile.age} years • {profile.district}</p>
                      <p className="text-neutral-500 text-sm">Submitted: {formatDate(app.createdAt)}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-red-900/30 flex items-center justify-center">
                      <UserX size={24} className="text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-red-400">Profile Deleted</h2>
                      <p className="text-neutral-500 text-sm">Submitted: {formatDate(app.createdAt)}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {profile && (
                  <a
                    href={`/profile/${profile.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <ExternalLink size={16} />
                    Open Profile
                  </a>
                )}
                <button
                  onClick={() => setSelectedVerification(null)}
                  className="p-2 text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* Image Comparison */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Photo */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Profile Photo</h3>
                <div
                  className="aspect-[3/4] bg-neutral-800 rounded-xl overflow-hidden cursor-pointer group relative"
                  onClick={() => profile?.images?.[0] && setLightboxImage(profile.images[0])}
                >
                  {profile?.images?.[0] ? (
                    <>
                      <img src={profile.images[0]} alt="Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                      <ImageIcon size={48} />
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Selfie */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Verification Selfie</h3>
                <div
                  className="aspect-[3/4] bg-neutral-800 rounded-xl overflow-hidden cursor-pointer group relative"
                  onClick={() => app.selfieWithIdUrl && setLightboxImage(app.selfieWithIdUrl)}
                >
                  {app.selfieWithIdUrl ? (
                    <>
                      <img src={app.selfieWithIdUrl} alt="Verification" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                      <ImageIcon size={48} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Notes */}
            {app.notes && (
              <div className="mt-6 p-4 bg-neutral-800/50 rounded-xl">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">User Notes</p>
                <p className="text-neutral-300">{app.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-neutral-800 bg-neutral-900/50">
            {rejectingAppId === app.id ? (
              <div className="space-y-4">
                <textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="w-full bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors"
                  >
                    <X size={20} />
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => {
                      setRejectingAppId(null);
                      setRejectNotes('');
                    }}
                    className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors"
                >
                  <CheckCircle size={20} />
                  Approve Verification
                </button>
                <button
                  onClick={() => setRejectingAppId(app.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-medium transition-colors border border-red-600/30"
                >
                  <X size={20} />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Tier Edit Modal component
  const TierEditModal = () => {
    if (!editingProfile) return null;

    const closeModal = () => {
      setEditingProfile(null);
      setEditTier('free');
      setEditExpiresAt('');
      setEditNotes('');
      setSavingTier(false);
    };

    const saveTierChange = async () => {
      if (!editingProfile) return;

      setSavingTier(true);
      try {
        const response = await fetch('/api/admin/profile-tier', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId: editingProfile.id,
            tier: editTier,
            expiresAt: editExpiresAt || null,
            notes: editNotes || null
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update tier');
        }

        // Update local state
        setProfiles(profiles.map(p =>
          p.id === editingProfile.id
            ? { ...p, tier: editTier, isPremium: editTier === 'premium' || editTier === 'elite' }
            : p
        ));

        // Update stats if needed
        const oldTier = editingProfile.tier || 'free';
        if (oldTier !== editTier) {
          setStats(prev => ({
            ...prev,
            premiumProfiles: prev.premiumProfiles +
              ((editTier === 'premium' || editTier === 'elite') ? 1 : 0) -
              ((oldTier === 'premium' || oldTier === 'elite') ? 1 : 0)
          }));
        }

        closeModal();
      } catch (error) {
        console.error('Error saving tier:', error);
        alert(error instanceof Error ? error.message : 'Failed to update tier');
      } finally {
        setSavingTier(false);
      }
    };

    const extend30Days = () => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      setEditExpiresAt(date.toISOString().split('T')[0]);
    };

    return (
      <div
        className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
        onClick={closeModal}
      >
        <div
          className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="text-luxury-gold" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-white">Edit Subscription</h3>
                  <p className="text-sm text-neutral-400">{editingProfile.name}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-neutral-500 hover:text-white p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Current Tier Display */}
            <div className="p-4 bg-neutral-800/50 rounded-xl">
              <p className="text-xs text-neutral-500 uppercase mb-2">Current Tier</p>
              <TierBadge tier={editingProfile.tier || 'free'} />
            </div>

            {/* Tier Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                New Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['free', 'premium', 'elite'] as ModelTier[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setEditTier(t)}
                    className={`p-3 rounded-xl border transition-all ${
                      editTier === t
                        ? t === 'free'
                          ? 'bg-neutral-700 border-neutral-500 text-white'
                          : t === 'premium'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-purple-500/20 border-purple-500 text-purple-400'
                        : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {t === 'premium' && <Star size={16} className="fill-current" />}
                      {t === 'elite' && <Crown size={16} className="fill-current" />}
                      <span className="text-sm font-medium capitalize">{t}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Subscription Expires
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-luxury-gold focus:outline-none"
                />
                <button
                  onClick={extend30Days}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  +30 days
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-1">Leave empty for no expiration</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Admin Notes (optional)
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                placeholder="Reason for tier change..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-luxury-gold focus:outline-none resize-none"
              />
            </div>

            {/* Quick Actions */}
            {(editingProfile.tier === 'premium' || editingProfile.tier === 'elite') && (
              <div className="pt-2 border-t border-neutral-800">
                <p className="text-xs text-neutral-500 uppercase mb-2">Quick Actions</p>
                <button
                  onClick={() => setEditTier('free')}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors"
                >
                  Downgrade to Free
                </button>
              </div>
            )}

            {/* Boost Management - Only for non-free tiers */}
            {(editingProfile.tier === 'premium' || editingProfile.tier === 'elite') && (
              <div className="pt-4 border-t border-neutral-800">
                <p className="text-xs text-neutral-500 uppercase mb-3">Boost Management</p>
                <div className="p-3 bg-neutral-800/50 rounded-xl mb-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Boosts Remaining</span>
                    <span className="text-white font-medium">
                      {TIER_LIMITS[editingProfile.tier || 'free'].boostsPerMonth === Infinity
                        ? '∞ (Unlimited)'
                        : editingProfile.boostsRemaining || 0}
                    </span>
                  </div>
                  {editingProfile.boostedUntil && new Date(editingProfile.boostedUntil) > new Date() && (
                    <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-neutral-700">
                      <span className="text-neutral-400">Boosted Until</span>
                      <span className="text-green-400 font-medium">
                        {new Date(editingProfile.boostedUntil).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/admin/profile-boost', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ profileId: editingProfile.id, action: 'reset' })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setProfiles(profiles.map(p =>
                            p.id === editingProfile.id
                              ? { ...p, boostsRemaining: data.boostsRemaining }
                              : p
                          ));
                          setEditingProfile({ ...editingProfile, boostsRemaining: data.boostsRemaining });
                          alert(data.message);
                        } else {
                          alert(data.error);
                        }
                      } catch {
                        alert('Failed to reset boosts');
                      }
                    }}
                    className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs transition-colors"
                  >
                    Reset Boosts
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/admin/profile-boost', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ profileId: editingProfile.id, action: 'grant' })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setProfiles(profiles.map(p =>
                            p.id === editingProfile.id
                              ? { ...p, boostsRemaining: data.boostsRemaining }
                              : p
                          ));
                          setEditingProfile({ ...editingProfile, boostsRemaining: data.boostsRemaining });
                          alert(data.message);
                        } else {
                          alert(data.error);
                        }
                      } catch {
                        alert('Failed to grant boost');
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs transition-colors"
                  >
                    +1 Boost
                  </button>
                  {!(editingProfile.boostedUntil && new Date(editingProfile.boostedUntil) > new Date()) ? (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/admin/profile-boost', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ profileId: editingProfile.id, action: 'activate' })
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setProfiles(profiles.map(p =>
                              p.id === editingProfile.id
                                ? { ...p, boostedUntil: data.boostedUntil }
                                : p
                            ));
                            setEditingProfile({ ...editingProfile, boostedUntil: data.boostedUntil });
                            alert(data.message);
                          } else {
                            alert(data.error);
                          }
                        } catch {
                          alert('Failed to activate boost');
                        }
                      }}
                      className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs transition-colors"
                    >
                      Activate Boost (24h)
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/admin/profile-boost', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ profileId: editingProfile.id, action: 'deactivate' })
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setProfiles(profiles.map(p =>
                              p.id === editingProfile.id
                                ? { ...p, boostedUntil: undefined }
                                : p
                            ));
                            setEditingProfile({ ...editingProfile, boostedUntil: undefined });
                            alert(data.message);
                          } else {
                            alert(data.error);
                          }
                        } catch {
                          alert('Failed to deactivate boost');
                        }
                      }}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors"
                    >
                      Deactivate Boost
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-800 bg-neutral-900/50">
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveTierChange}
                disabled={savingTier || editTier === (editingProfile.tier || 'free')}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  savingTier || editTier === (editingProfile.tier || 'free')
                    ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                    : 'bg-luxury-gold hover:bg-amber-500 text-black'
                }`}
              >
                {savingTier ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to open tier edit modal
  const openTierEditModal = (profile: Profile) => {
    setEditingProfile(profile);
    setEditTier(profile.tier || 'free');
    setEditExpiresAt('');
    setEditNotes('');
  };

  // Risk badge component
  const FraudBadge = ({ analysis }: { analysis: FraudAnalysis }) => {
    const colors = {
      safe: 'bg-green-500/20 text-green-400 border-green-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${colors[analysis.level]}`}>
        {analysis.level === 'critical' && <AlertTriangle size={12} />}
        {analysis.level === 'high' && <Flag size={12} />}
        {analysis.score} pts
      </div>
    );
  };

  // Tier badge component for displaying model/agency tiers
  const TierBadge = ({ tier }: { tier: ModelTier }) => {
    const tierConfig = {
      free: {
        label: 'Free',
        classes: 'bg-neutral-700/50 text-neutral-400 border-neutral-600',
        icon: null
      },
      premium: {
        label: 'Premium',
        classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: <Star size={12} className="fill-current" />
      },
      elite: {
        label: 'Elite',
        classes: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        icon: <Crown size={12} className="fill-current" />
      }
    };

    const config = tierConfig[tier] || tierConfig.free;

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${config.classes}`}>
        {config.icon}
        {config.label}
      </div>
    );
  };

  // Agency tier badge component (will be used in Phase 4)
  const AgencyTierBadge = ({ tier }: { tier: AgencyTier | undefined }) => {
    const tierConfig = {
      none: {
        label: 'No Plan',
        classes: 'bg-neutral-700/50 text-neutral-500 border-neutral-600',
        icon: null
      },
      starter: {
        label: 'Starter',
        classes: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        icon: <Zap size={12} />
      },
      pro: {
        label: 'Pro',
        classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: <Rocket size={12} />
      }
    };

    const config = tierConfig[tier || 'none'];

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${config.classes}`}>
        {config.icon}
        {config.label}
      </div>
    );
  };

  // Agency Tier Edit Modal component
  const AgencyTierEditModal = () => {
    if (!editingAgency) return null;

    const closeModal = () => {
      setEditingAgency(null);
      setEditAgencyTier('none');
      setEditAgencyLimit(0);
      setEditAgencyExpiresAt('');
      setSavingAgencyTier(false);
    };

    const saveAgencyTierChange = async () => {
      if (!editingAgency) return;

      setSavingAgencyTier(true);
      try {
        const response = await fetch('/api/admin/agency-tier', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agencyId: editingAgency.id,
            tier: editAgencyTier,
            modelLimit: editAgencyLimit,
            expiresAt: editAgencyExpiresAt || null
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update agency tier');
        }

        // Update local state
        setAgencies(agencies.map(a =>
          a.id === editingAgency.id
            ? { ...a, subscriptionTier: editAgencyTier, modelLimit: editAgencyLimit }
            : a
        ));

        closeModal();
      } catch (error) {
        console.error('Error saving agency tier:', error);
        alert(error instanceof Error ? error.message : 'Failed to update agency tier');
      } finally {
        setSavingAgencyTier(false);
      }
    };

    const extend30Days = () => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      setEditAgencyExpiresAt(date.toISOString().split('T')[0]);
    };

    const tierLimits: Record<AgencyTier, number> = {
      none: 0,
      starter: 5,
      pro: 15
    };

    return (
      <div
        className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
        onClick={closeModal}
      >
        <div
          className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="text-luxury-gold" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-white">Edit Agency Plan</h3>
                  <p className="text-sm text-neutral-400">{editingAgency.name}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-neutral-500 hover:text-white p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Current Tier Display */}
            <div className="p-4 bg-neutral-800/50 rounded-xl">
              <p className="text-xs text-neutral-500 uppercase mb-2">Current Plan</p>
              <AgencyTierBadge tier={editingAgency.subscriptionTier} />
            </div>

            {/* Tier Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                New Plan
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['none', 'starter', 'pro'] as AgencyTier[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setEditAgencyTier(t);
                      setEditAgencyLimit(tierLimits[t]);
                    }}
                    className={`p-3 rounded-xl border transition-all ${
                      editAgencyTier === t
                        ? t === 'none'
                          ? 'bg-neutral-700 border-neutral-500 text-white'
                          : t === 'starter'
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {t === 'starter' && <Zap size={16} />}
                      {t === 'pro' && <Rocket size={16} />}
                      <span className="text-sm font-medium capitalize">{t === 'none' ? 'No Plan' : t}</span>
                      {t !== 'none' && (
                        <span className="text-[10px] text-neutral-500">
                          {tierLimits[t]} models
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Limit */}
            {editAgencyTier !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Model Limit
                </label>
                <input
                  type="number"
                  value={editAgencyLimit}
                  onChange={(e) => setEditAgencyLimit(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-luxury-gold focus:outline-none"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Default: {tierLimits[editAgencyTier]} models for {editAgencyTier} plan
                </p>
              </div>
            )}

            {/* Expiration Date */}
            {editAgencyTier !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Plan Expires
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={editAgencyExpiresAt}
                    onChange={(e) => setEditAgencyExpiresAt(e.target.value)}
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-luxury-gold focus:outline-none"
                  />
                  <button
                    onClick={extend30Days}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    +30 days
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-800 bg-neutral-900/50">
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAgencyTierChange}
                disabled={savingAgencyTier || editAgencyTier === (editingAgency.subscriptionTier || 'none')}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  savingAgencyTier || editAgencyTier === (editingAgency.subscriptionTier || 'none')
                    ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                    : 'bg-luxury-gold hover:bg-amber-500 text-black'
                }`}
              >
                {savingAgencyTier ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to open agency tier edit modal
  const openAgencyTierModal = (agency: Agency) => {
    setEditingAgency(agency);
    setEditAgencyTier(agency.subscriptionTier || 'none');
    setEditAgencyLimit(agency.modelLimit || 0);
    setEditAgencyExpiresAt('');
  };

  // Show loading or redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black pt-24 pb-12 px-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl text-white mb-2">VB Control Panel</h1>
            <p className="text-neutral-500">Advanced admin dashboard with fraud detection</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
              <Users size={14} />
              Total Profiles
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalProfiles}</div>
            <div className="text-xs text-blue-400 mt-1">+{stats.newThisWeek} this week</div>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-400 text-xs mb-2">
              <CheckCircle size={14} />
              Verified
            </div>
            <div className="text-3xl font-bold text-white">{stats.verifiedProfiles}</div>
            <div className="text-xs text-green-400 mt-1">
              {stats.totalProfiles > 0 ? Math.round((stats.verifiedProfiles / stats.totalProfiles) * 100) : 0}% rate
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-yellow-400 text-xs mb-2">
              <Star size={14} />
              Premium
            </div>
            <div className="text-3xl font-bold text-white">{stats.premiumProfiles}</div>
            <div className="text-xs text-yellow-400 mt-1">{stats.activeSubscriptions} active subs</div>
          </div>

          <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400 text-xs mb-2">
              <AlertTriangle size={14} />
              Flagged
            </div>
            <div className="text-3xl font-bold text-white">{stats.flaggedProfiles}</div>
            <div className="text-xs text-red-400 mt-1">Requires review</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-400 text-xs mb-2">
              <DollarSign size={14} />
              Revenue
            </div>
            <div className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</div>
            <div className="text-xs text-purple-400 mt-1">All time</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-neutral-800 pb-4">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'profiles', label: 'Profiles', icon: Users },
            { id: 'verifications', label: 'Verifications', icon: ShieldCheck },
            { id: 'fraud', label: 'Fraud Detection', icon: AlertTriangle },
            { id: 'agencies', label: 'Agencies', icon: Building2 },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-luxury-gold text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.id === 'verifications' && stats.pendingVerifications > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {stats.pendingVerifications}
                </span>
              )}
              {tab.id === 'fraud' && stats.flaggedProfiles > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {stats.flaggedProfiles}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-900/10 border border-red-900/30 rounded-lg">
            <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-luxury-gold" />
                    Recent Profiles
                  </h3>
                  <div className="space-y-3">
                    {profiles.slice(0, 8).map(profile => {
                      const fraud = analyzeFraudRisk(profile);
                      return (
                        <div key={profile.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800/50 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0">
                            {profile.images?.[0] && (
                              <img src={profile.images[0]} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium truncate">{profile.name}</span>
                              {profile.isVerified && <CheckCircle size={14} className="text-green-500 flex-shrink-0" />}
                              {(fraud.level === 'high' || fraud.level === 'critical') && (
                                <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {profile.district} • {formatDate(profile.createdAt)}
                            </div>
                          </div>
                          <FraudBadge analysis={fraud} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fraud Overview */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-luxury-gold" />
                    Fraud Risk Distribution
                  </h3>
                  <div className="space-y-4">
                    {['safe', 'low', 'medium', 'high', 'critical'].map(level => {
                      const count = profilesWithFraud.filter(p => p.fraudAnalysis.level === level).length;
                      const percentage = profiles.length > 0 ? (count / profiles.length) * 100 : 0;
                      const colors: Record<string, string> = {
                        safe: 'bg-green-500',
                        low: 'bg-blue-500',
                        medium: 'bg-yellow-500',
                        high: 'bg-orange-500',
                        critical: 'bg-red-500'
                      };
                      return (
                        <div key={level}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-neutral-400 capitalize">{level}</span>
                            <span className="text-white">{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors[level]} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Performers */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-luxury-gold" />
                    Top Performers
                  </h3>
                  <div className="space-y-3">
                    {profiles
                      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
                      .slice(0, 5)
                      .map((profile, idx) => (
                        <div key={profile.id} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-luxury-gold/20 flex items-center justify-center text-luxury-gold font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{profile.name}</div>
                            <div className="text-xs text-neutral-500">{profile.district}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">{(profile.clicks || 0).toLocaleString()}</div>
                            <div className="text-xs text-neutral-500">clicks</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* District Distribution */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-luxury-gold" />
                    By District
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(
                      profiles.reduce((acc, p) => {
                        acc[p.district] = (acc[p.district] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([district, count]) => (
                        <div key={district} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg">
                          <span className="text-neutral-400 text-sm">{district}</span>
                          <span className="text-white font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Profiles Tab */}
            {activeTab === 'profiles' && (
              <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-4 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search profiles..."
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-luxury-gold focus:outline-none"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-luxury-gold focus:outline-none"
                  >
                    <option value="all">All Profiles</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified</option>
                    <option value="premium">Premium</option>
                    <option value="disabled">Disabled</option>
                    <option value="flagged">Flagged (High Risk)</option>
                  </select>

                  {/* Tier Filter */}
                  <select
                    value={filterTier}
                    onChange={e => setFilterTier(e.target.value as typeof filterTier)}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-luxury-gold focus:outline-none"
                  >
                    <option value="all">All Tiers</option>
                    <option value="free">Free</option>
                    <option value="premium">Premium ⭐</option>
                    <option value="elite">Elite 👑</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-luxury-gold focus:outline-none"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="name">Sort by Name</option>
                    <option value="clicks">Sort by Clicks</option>
                    <option value="fraud">Sort by Fraud Score</option>
                    <option value="tier">Sort by Tier</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white transition-colors"
                  >
                    {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {/* Bulk Actions */}
                  {selectedProfiles.size > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-sm text-neutral-400">{selectedProfiles.size} selected</span>
                      <button
                        onClick={() => bulkAction('verify')}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => bulkAction('disable')}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs"
                      >
                        Disable
                      </button>
                      <button
                        onClick={() => bulkAction('delete')}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Profiles Table */}
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-900">
                        <tr>
                          <th className="w-10 p-4">
                            <input
                              type="checkbox"
                              checked={selectedProfiles.size === filteredProfiles.length && filteredProfiles.length > 0}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedProfiles(new Set(filteredProfiles.map(p => p.id)));
                                } else {
                                  setSelectedProfiles(new Set());
                                }
                              }}
                              className="rounded border-neutral-600 bg-neutral-800 text-luxury-gold focus:ring-luxury-gold"
                            />
                          </th>
                          <th className="text-left p-4 text-xs font-medium text-neutral-500 uppercase">Profile</th>
                          <th className="text-left p-4 text-xs font-medium text-neutral-500 uppercase">District</th>
                          <th className="text-center p-4 text-xs font-medium text-neutral-500 uppercase">Tier</th>
                          <th className="text-center p-4 text-xs font-medium text-neutral-500 uppercase">Boosts</th>
                          <th className="text-left p-4 text-xs font-medium text-neutral-500 uppercase">Contact</th>
                          <th className="text-center p-4 text-xs font-medium text-neutral-500 uppercase">Fraud</th>
                          <th className="text-center p-4 text-xs font-medium text-neutral-500 uppercase">Status</th>
                          <th className="text-right p-4 text-xs font-medium text-neutral-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {filteredProfiles.map(profile => (
                          <>
                            <tr key={profile.id} className={`hover:bg-neutral-800/30 ${profile.isDisabled ? 'opacity-50' : ''}`}>
                              <td className="p-4">
                                <input
                                  type="checkbox"
                                  checked={selectedProfiles.has(profile.id)}
                                  onChange={e => {
                                    const newSet = new Set(selectedProfiles);
                                    if (e.target.checked) {
                                      newSet.add(profile.id);
                                    } else {
                                      newSet.delete(profile.id);
                                    }
                                    setSelectedProfiles(newSet);
                                  }}
                                  className="rounded border-neutral-600 bg-neutral-800 text-luxury-gold focus:ring-luxury-gold"
                                />
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
                                    {profile.images?.[0] ? (
                                      <img src={profile.images[0]} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                        <ImageIcon size={20} />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-white font-medium">{profile.name}</span>
                                      {profile.isVerified && <CheckCircle size={14} className="text-green-500" />}
                                      {profile.isPremium && <Star size={14} className="text-luxury-gold" />}
                                      {profile.isVelvetChoice && <Award size={14} className="text-pink-500" />}
                                      {(profile.clicks || 0) > 2000 && <TrendingUp size={14} className="text-green-500" />}
                                    </div>
                                    <div className="text-neutral-500 text-xs">
                                      {profile.age}y • {formatCurrency(profile.priceStart)}/h • {profile.clicks || 0} clicks
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-neutral-400 text-sm">{profile.district}</td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => openTierEditModal(profile)}
                                  className="hover:opacity-80 transition-opacity"
                                  title="Edit tier"
                                >
                                  <TierBadge tier={profile.tier || 'free'} />
                                </button>
                              </td>
                              <td className="p-4 text-center">
                                {(() => {
                                  const tier = (profile.tier || 'free') as ModelTier;
                                  const limits = TIER_LIMITS[tier];
                                  const isBoosted = profile.boostedUntil && new Date(profile.boostedUntil) > new Date();
                                  const boostsRemaining = profile.boostsRemaining || 0;
                                  const isUnlimited = limits.boostsPerMonth === Infinity;

                                  if (tier === 'free') {
                                    return <span className="text-neutral-600 text-xs">-</span>;
                                  }

                                  return (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`text-xs ${isUnlimited ? 'text-purple-400' : 'text-neutral-400'}`}>
                                        {isUnlimited ? '∞' : `${boostsRemaining}/${limits.boostsPerMonth}`}
                                      </span>
                                      {isBoosted && (
                                        <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                                          Active
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  {profile.phone && <Phone size={14} className="text-green-500" />}
                                  {profile.whatsapp && <span className="text-green-500 text-xs">WA</span>}
                                  {profile.telegram && <span className="text-blue-500 text-xs">TG</span>}
                                  {!profile.phone && !profile.whatsapp && !profile.telegram && (
                                    <span className="text-red-400 text-xs">None</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => setExpandedProfile(expandedProfile === profile.id ? null : profile.id)}
                                  className="hover:opacity-80 transition-opacity"
                                >
                                  <FraudBadge analysis={profile.fraudAnalysis} />
                                </button>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => toggleDisabled(profile.id, profile.isDisabled || false)}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    profile.isDisabled
                                      ? 'bg-red-500/20 text-red-400'
                                      : 'bg-green-500/20 text-green-400'
                                  }`}
                                >
                                  {profile.isDisabled ? 'Disabled' : 'Active'}
                                </button>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => toggleVerified(profile.id, profile.isVerified)}
                                    className={`p-1.5 rounded hover:bg-neutral-700 transition-colors ${
                                      profile.isVerified ? 'text-green-500' : 'text-neutral-600'
                                    }`}
                                    title={profile.isVerified ? 'Remove verification' : 'Verify'}
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                  <button
                                    onClick={() => togglePremium(profile.id, profile.isPremium)}
                                    className={`p-1.5 rounded hover:bg-neutral-700 transition-colors ${
                                      profile.isPremium ? 'text-luxury-gold' : 'text-neutral-600'
                                    }`}
                                    title={profile.isPremium ? 'Remove premium' : 'Make premium'}
                                  >
                                    <Star size={16} />
                                  </button>
                                  <button
                                    onClick={() => toggleVelvetChoice(profile.id, profile.isVelvetChoice || false)}
                                    className={`p-1.5 rounded hover:bg-neutral-700 transition-colors ${
                                      profile.isVelvetChoice ? 'text-pink-500' : 'text-neutral-600'
                                    }`}
                                    title={profile.isVelvetChoice ? 'Remove Velvet Choice' : 'Make Velvet Choice'}
                                  >
                                    <Award size={16} />
                                  </button>
                                  <button
                                    onClick={() => toggleTopModel(profile.id, profile.clicks || 0)}
                                    className={`p-1.5 rounded hover:bg-neutral-700 transition-colors ${
                                      (profile.clicks || 0) > 2000 ? 'text-green-500' : 'text-neutral-600'
                                    }`}
                                    title={(profile.clicks || 0) > 2000 ? 'Remove Top status' : 'Make Top Model'}
                                  >
                                    <TrendingUp size={16} />
                                  </button>
                                  <button
                                    onClick={() => window.open(`/profile/${profile.id}`, '_blank')}
                                    className="p-1.5 rounded text-neutral-500 hover:text-white hover:bg-neutral-700 transition-colors"
                                    title="View profile"
                                  >
                                    <ExternalLink size={16} />
                                  </button>
                                  <button
                                    onClick={() => deleteProfile(profile.id)}
                                    className="p-1.5 rounded text-neutral-500 hover:text-red-500 hover:bg-neutral-700 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {/* Expanded Fraud Details */}
                            {expandedProfile === profile.id && (
                              <tr className="bg-neutral-900/50">
                                <td colSpan={7} className="p-4">
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium text-white mb-2">Fraud Indicators</h4>
                                      {profile.fraudAnalysis.indicators.length > 0 ? (
                                        <div className="space-y-2">
                                          {profile.fraudAnalysis.indicators.map((indicator, idx) => (
                                            <div
                                              key={idx}
                                              className={`p-2 rounded text-xs ${
                                                indicator.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                                                indicator.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                                indicator.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                                'bg-blue-500/20 text-blue-300'
                                              }`}
                                            >
                                              <div className="flex justify-between">
                                                <span className="font-medium">{indicator.type.replace(/_/g, ' ')}</span>
                                                <span>+{indicator.points} pts</span>
                                              </div>
                                              <p className="mt-1 opacity-80">{indicator.description}</p>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-green-400 text-sm">No fraud indicators detected</p>
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-white mb-2">Profile Details</h4>
                                      <div className="space-y-1 text-xs text-neutral-400">
                                        <p><span className="text-neutral-500">Created:</span> {formatDate(profile.createdAt)}</p>
                                        <p><span className="text-neutral-500">Last Active:</span> {profile.lastActive ? formatDate(profile.lastActive) : 'Never'}</p>
                                        <p><span className="text-neutral-500">Images:</span> {profile.images?.length || 0}</p>
                                        <p><span className="text-neutral-500">Services:</span> {profile.services?.length || 0}</p>
                                        <p><span className="text-neutral-500">Description:</span> {profile.description?.length || 0} chars</p>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredProfiles.length === 0 && (
                    <div className="text-center py-12 text-neutral-500">
                      No profiles found matching your criteria
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fraud Detection Tab */}
            {activeTab === 'fraud' && (
              <div className="space-y-6">
                {/* Critical Alerts */}
                {profilesWithFraud.filter(p => p.fraudAnalysis.level === 'critical').length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-red-400 mb-4 flex items-center gap-2">
                      <AlertTriangle size={20} />
                      Critical Alerts - Immediate Action Required
                    </h3>
                    <div className="space-y-3">
                      {profilesWithFraud
                        .filter(p => p.fraudAnalysis.level === 'critical')
                        .map(profile => (
                          <div key={profile.id} className="flex items-center gap-4 p-4 bg-red-500/5 rounded-lg">
                            <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden">
                              {profile.images?.[0] && (
                                <img src={profile.images[0]} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-medium">{profile.name}</div>
                              <div className="text-red-400 text-sm">
                                {profile.fraudAnalysis.indicators.map(i => i.type.replace(/_/g, ' ')).join(', ')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <FraudBadge analysis={profile.fraudAnalysis} />
                              <button
                                onClick={() => toggleDisabled(profile.id, false)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
                              >
                                <Ban size={14} className="inline mr-1" />
                                Disable
                              </button>
                              <button
                                onClick={() => deleteProfile(profile.id)}
                                className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-sm"
                              >
                                <Trash2 size={14} className="inline mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* High Risk */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-orange-400 mb-4 flex items-center gap-2">
                    <Flag size={20} />
                    High Risk Profiles ({profilesWithFraud.filter(p => p.fraudAnalysis.level === 'high').length})
                  </h3>
                  <div className="space-y-3">
                    {profilesWithFraud
                      .filter(p => p.fraudAnalysis.level === 'high')
                      .slice(0, 10)
                      .map(profile => (
                        <div key={profile.id} className="flex items-center gap-4 p-3 bg-neutral-800/30 rounded-lg">
                          <div className="w-10 h-10 rounded-lg bg-neutral-800 overflow-hidden">
                            {profile.images?.[0] && (
                              <img src={profile.images[0]} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{profile.name}</div>
                            <div className="text-neutral-500 text-xs">
                              {profile.fraudAnalysis.indicators.slice(0, 2).map(i => i.description).join(' • ')}
                            </div>
                          </div>
                          <FraudBadge analysis={profile.fraudAnalysis} />
                          <button
                            onClick={() => setExpandedProfile(expandedProfile === profile.id ? null : profile.id)}
                            className="p-2 text-neutral-400 hover:text-white"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Fraud Detection Rules */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Settings size={20} className="text-luxury-gold" />
                    Detection Rules Active
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: 'No Images', severity: 'critical', points: 30 },
                      { name: 'Stock Photo Detection', severity: 'critical', points: 40 },
                      { name: 'Suspicious Keywords', severity: 'critical', points: 35 },
                      { name: 'Unrealistic Price', severity: 'high', points: 25 },
                      { name: 'No Contact Info', severity: 'high', points: 25 },
                      { name: 'Generated Name', severity: 'high', points: 20 },
                      { name: 'Single Image', severity: 'medium', points: 15 },
                      { name: 'Short Description', severity: 'medium', points: 10 },
                      { name: 'Profile Incomplete', severity: 'medium', points: 'variable' },
                      { name: 'No Services', severity: 'medium', points: 10 },
                      { name: 'Inactive Account', severity: 'low', points: 5 },
                    ].map(rule => (
                      <div key={rule.name} className="p-3 bg-neutral-800/30 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-sm font-medium">{rule.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            rule.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                            rule.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            rule.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {rule.severity}
                          </span>
                        </div>
                        <div className="text-neutral-500 text-xs">+{rule.points} points</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Agencies Tab */}
            {activeTab === 'agencies' && (
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-900">
                      <tr>
                        <th className="text-left p-4 text-xs font-medium text-neutral-500 uppercase">Agency</th>
                        <th className="text-left p-4 text-xs font-medium text-neutral-500 uppercase">District</th>
                        <th className="text-center p-4 text-xs font-medium text-neutral-500 uppercase">Tier</th>
                        <th className="text-center p-4 text-xs font-medium text-neutral-500 uppercase">Models</th>
                        <th className="text-left p-4 text-xs font-medium text-neutral-500 uppercase">Contact</th>
                        <th className="text-center p-4 text-xs font-medium text-neutral-500 uppercase">Featured</th>
                        <th className="text-right p-4 text-xs font-medium text-neutral-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {agencies.map(agency => (
                        <tr key={agency.id} className="hover:bg-neutral-800/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden">
                                {agency.logo && (
                                  <img src={agency.logo} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div>
                                <div className="text-white font-medium">{agency.name}</div>
                                <div className="text-neutral-500 text-xs">{agency.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-neutral-400 text-sm">{agency.district}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => openAgencyTierModal(agency)}
                              className="hover:opacity-80 transition-opacity"
                              title="Edit tier"
                            >
                              <AgencyTierBadge tier={agency.subscriptionTier} />
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            {(() => {
                              const modelsCount = profiles.filter(p => p.agencyId === agency.id).length;
                              const limit = agency.modelLimit || 0;
                              const hasLimit = limit > 0;
                              const isAtLimit = hasLimit && modelsCount >= limit;

                              return (
                                <div className="flex flex-col items-center">
                                  <span className={`text-sm ${isAtLimit ? 'text-red-400' : 'text-neutral-400'}`}>
                                    {modelsCount}{hasLimit ? `/${limit}` : ''}
                                  </span>
                                  {hasLimit && (
                                    <div className="w-12 h-1 bg-neutral-700 rounded-full mt-1 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${isAtLimit ? 'bg-red-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min((modelsCount / limit) * 100, 100)}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-xs">
                              {agency.phone && <span className="text-green-400">Phone</span>}
                              {agency.whatsapp && <span className="text-green-400">WA</span>}
                              {agency.website && <span className="text-blue-400">Web</span>}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => toggleAgencyFeatured(agency.id, agency.isFeatured || false)}
                              className={`p-1.5 rounded ${agency.isFeatured ? 'text-luxury-gold' : 'text-neutral-600'}`}
                            >
                              <Star size={20} />
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => window.open(`/agency/${agency.id}`, '_blank')}
                                className="p-1.5 text-neutral-500 hover:text-white"
                              >
                                <ExternalLink size={16} />
                              </button>
                              <button
                                onClick={() => deleteAgency(agency.id)}
                                className="p-1.5 text-neutral-500 hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {agencies.length === 0 && (
                  <div className="text-center py-12 text-neutral-500">No agencies found</div>
                )}
              </div>
            )}

            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <DollarSign size={18} className="text-luxury-gold" />
                    Revenue Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-neutral-800/30 rounded-lg">
                      <span className="text-neutral-400">Total Revenue</span>
                      <span className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-neutral-800/30 rounded-lg">
                      <span className="text-neutral-400">Active Subscriptions</span>
                      <span className="text-2xl font-bold text-green-400">{stats.activeSubscriptions}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-neutral-800/30 rounded-lg">
                      <span className="text-neutral-400">Premium Profiles</span>
                      <span className="text-2xl font-bold text-luxury-gold">{stats.premiumProfiles}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-luxury-gold" />
                    Subscription Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-neutral-800/30 rounded-lg">
                      <span className="text-neutral-400">Conversion Rate</span>
                      <span className="text-xl font-bold text-white">
                        {stats.totalProfiles > 0
                          ? ((stats.premiumProfiles / stats.totalProfiles) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-neutral-800/30 rounded-lg">
                      <span className="text-neutral-400">Avg Revenue/User</span>
                      <span className="text-xl font-bold text-white">
                        {stats.premiumProfiles > 0
                          ? formatCurrency(stats.totalRevenue / stats.premiumProfiles)
                          : formatCurrency(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Verifications Tab */}
            {activeTab === 'verifications' && (
              <div className="space-y-6">
                {/* Pending Verifications */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-amber-400" />
                    Pending Verifications ({verificationApps.filter(a => a.status === 'pending').length})
                  </h3>

                  {verificationApps.filter(a => a.status === 'pending').length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                      <ShieldCheck size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No pending verification requests</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {verificationApps
                        .filter(a => a.status === 'pending')
                        .map(app => (
                          <div
                            key={app.id}
                            className="bg-neutral-800/30 rounded-xl p-4 border border-neutral-700 hover:border-neutral-600 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              {/* Profile Info */}
                              <div className="w-12 h-12 rounded-lg bg-neutral-700 overflow-hidden flex-shrink-0">
                                {app.profile?.images?.[0] ? (
                                  <img src={app.profile.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                    <ImageIcon size={20} />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">
                                    {app.profile?.name || 'Unknown Profile'}
                                  </span>
                                  {app.notes && (
                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                                      Has note
                                    </span>
                                  )}
                                </div>
                                <div className="text-neutral-400 text-sm">
                                  {app.profile?.age}y • {app.profile?.district} • {formatDate(app.createdAt)}
                                </div>
                              </div>

                              {/* Verification Thumbnail */}
                              <div className="w-16 h-12 rounded-lg overflow-hidden bg-neutral-700 flex-shrink-0">
                                {app.selfieWithIdUrl && (
                                  <img src={app.selfieWithIdUrl} alt="Verification" className="w-full h-full object-cover" />
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => setSelectedVerification(app)}
                                  className="flex items-center gap-2 px-4 py-2 bg-luxury-gold/20 hover:bg-luxury-gold text-luxury-gold hover:text-black rounded-lg text-sm font-medium transition-colors"
                                >
                                  <Eye size={16} />
                                  Review
                                </button>
                                <button
                                  onClick={() => approveVerification(app.id, app.profileId)}
                                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
                                  title="Quick Approve"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Recent Decisions */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-luxury-gold" />
                    Recent Decisions
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-neutral-800">
                        <tr>
                          <th className="text-left p-3 text-xs font-medium text-neutral-500 uppercase">Profile</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-500 uppercase">Status</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-500 uppercase">Reviewed</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-500 uppercase">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {verificationApps
                          .filter(a => a.status !== 'pending')
                          .slice(0, 10)
                          .map(app => (
                            <tr key={app.id} className="hover:bg-neutral-800/30">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {app.profile ? (
                                    <>
                                      <div className="w-8 h-8 rounded bg-neutral-800 overflow-hidden">
                                        {app.profile.images?.[0] && (
                                          <img src={app.profile.images[0]} alt="" className="w-full h-full object-cover" />
                                        )}
                                      </div>
                                      <span className="text-white text-sm">{app.profile.name}</span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-8 h-8 rounded bg-red-900/30 flex items-center justify-center">
                                        <UserX size={14} className="text-red-400" />
                                      </div>
                                      <span className="text-red-400 text-sm italic">Profile Deleted</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize ${
                                  app.status === 'approved'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {app.status === 'approved' ? <CheckCircle size={12} /> : <X size={12} />}
                                  {app.status}
                                </span>
                              </td>
                              <td className="p-3 text-neutral-400 text-sm">
                                {app.reviewedAt ? formatDate(app.reviewedAt) : '-'}
                              </td>
                              <td className="p-3 text-neutral-500 text-sm max-w-xs truncate">
                                {app.adminNotes || '-'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {verificationApps.filter(a => a.status !== 'pending').length === 0 && (
                    <div className="text-center py-8 text-neutral-500">
                      No verification decisions yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <VerificationModal />
      <ImageLightbox />
      <TierEditModal />
      <AgencyTierEditModal />
    </div>
  );
}
