'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createBrowserClient } from '@supabase/ssr';
import {
  Users, Building2, BarChart3, CheckCircle,
  Trash2, Eye, Shield, TrendingUp, Clock
} from 'lucide-react';
import { Profile, Agency } from '@/lib/types';

type Tab = 'profiles' | 'agencies' | 'analytics';

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function VBControlPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profiles');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProfiles: 0,
    verifiedProfiles: 0,
    premiumProfiles: 0,
    totalAgencies: 0,
    totalClicks: 0,
    newThisWeek: 0
  });

  const supabase = createClient();

  // Check admin access
  useEffect(() => {
    if (isAuthenticated !== undefined && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Fetch data
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
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

      if (profilesData) {
        setProfiles(profilesData);

        // Calculate stats
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        setStats({
          totalProfiles: profilesData.length,
          verifiedProfiles: profilesData.filter(p => p.isVerified).length,
          premiumProfiles: profilesData.filter(p => p.isPremium).length,
          totalAgencies: agenciesData?.length || 0,
          totalClicks: profilesData.reduce((sum, p) => sum + (p.clicks || 0), 0),
          newThisWeek: profilesData.filter(p => new Date(p.createdAt) > weekAgo).length
        });
      }

      if (agenciesData) {
        setAgencies(agenciesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (!confirm('Are you sure you want to delete this profile? This cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (!error) {
      setProfiles(profiles.filter(p => p.id !== profileId));
      setStats(prev => ({
        ...prev,
        totalProfiles: prev.totalProfiles - 1
      }));
    }
  };

  const deleteAgency = async (agencyId: string) => {
    if (!confirm('Are you sure you want to delete this agency? This cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from('agencies')
      .delete()
      .eq('id', agencyId);

    if (!error) {
      setAgencies(agencies.filter(a => a.id !== agencyId));
      setStats(prev => ({
        ...prev,
        totalAgencies: prev.totalAgencies - 1
      }));
    }
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-white mb-2">VB Control Panel</h1>
          <p className="text-neutral-500">Manage profiles, agencies, and view analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Users size={14} />
              Total Profiles
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalProfiles}</div>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <CheckCircle size={14} />
              Verified
            </div>
            <div className="text-2xl font-bold text-green-500">{stats.verifiedProfiles}</div>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Shield size={14} />
              Premium
            </div>
            <div className="text-2xl font-bold text-luxury-gold">{stats.premiumProfiles}</div>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Building2 size={14} />
              Agencies
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalAgencies}</div>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <TrendingUp size={14} />
              Total Clicks
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalClicks.toLocaleString()}</div>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Clock size={14} />
              New This Week
            </div>
            <div className="text-2xl font-bold text-blue-500">{stats.newThisWeek}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-4">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profiles'
                ? 'bg-luxury-gold text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Users size={16} />
            Profiles
          </button>
          <button
            onClick={() => setActiveTab('agencies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'agencies'
                ? 'bg-luxury-gold text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Building2 size={16} />
            Agencies
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-luxury-gold text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <BarChart3 size={16} />
            Analytics
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Profiles Tab */}
            {activeTab === 'profiles' && (
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-900">
                      <tr>
                        <th className="text-left p-4 text-xs font-medium text-neutral-500 uppercase">Profile</th>
                        <th className="text-left p-4 text-xs font-medium text-neutral-500 uppercase">District</th>
                        <th className="text-left p-4 text-xs font-medium text-neutral-500 uppercase">Clicks</th>
                        <th className="text-center p-4 text-xs font-medium text-neutral-500 uppercase">Verified</th>
                        <th className="text-center p-4 text-xs font-medium text-neutral-500 uppercase">Premium</th>
                        <th className="text-center p-4 text-xs font-medium text-neutral-500 uppercase">Status</th>
                        <th className="text-right p-4 text-xs font-medium text-neutral-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {profiles.map(profile => (
                        <tr key={profile.id} className={`hover:bg-neutral-800/30 ${profile.isDisabled ? 'opacity-50' : ''}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden">
                                {profile.images?.[0] && (
                                  <img
                                    src={profile.images[0]}
                                    alt={profile.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="text-white font-medium">{profile.name}</div>
                                <div className="text-neutral-500 text-xs">{profile.age} years</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-neutral-400 text-sm">{profile.district}</td>
                          <td className="p-4 text-neutral-400 text-sm">{profile.clicks || 0}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => toggleVerified(profile.id, profile.isVerified)}
                              className={`p-1 rounded ${profile.isVerified ? 'text-green-500' : 'text-neutral-600'}`}
                            >
                              <CheckCircle size={20} />
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => togglePremium(profile.id, profile.isPremium)}
                              className={`p-1 rounded ${profile.isPremium ? 'text-luxury-gold' : 'text-neutral-600'}`}
                            >
                              <Shield size={20} />
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
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => window.open(`/profile/${profile.id}`, '_blank')}
                                className="p-2 text-neutral-500 hover:text-white transition-colors"
                                title="View"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => deleteProfile(profile.id)}
                                className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                                title="Delete"
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
                {profiles.length === 0 && (
                  <div className="text-center py-12 text-neutral-500">
                    No profiles found
                  </div>
                )}
              </div>
            )}

            {/* Agencies Tab */}
            {activeTab === 'agencies' && (
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-900">
                      <tr>
                        <th className="text-left p-4 text-xs font-medium text-neutral-500 uppercase">Agency</th>
                        <th className="text-left p-4 text-xs font-medium text-neutral-500 uppercase">District</th>
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
                              <div className="w-10 h-10 rounded bg-neutral-800 overflow-hidden">
                                {agency.logo && (
                                  <img
                                    src={agency.logo}
                                    alt={agency.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="text-white font-medium">{agency.name}</div>
                            </div>
                          </td>
                          <td className="p-4 text-neutral-400 text-sm">{agency.district}</td>
                          <td className="p-4 text-neutral-400 text-sm">{agency.email}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => toggleAgencyFeatured(agency.id, agency.isFeatured || false)}
                              className={`p-1 rounded ${agency.isFeatured ? 'text-luxury-gold' : 'text-neutral-600'}`}
                            >
                              <Shield size={20} />
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => window.open(`/agency/${agency.id}`, '_blank')}
                                className="p-2 text-neutral-500 hover:text-white transition-colors"
                                title="View"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => deleteAgency(agency.id)}
                                className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                                title="Delete"
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
                  <div className="text-center py-12 text-neutral-500">
                    No agencies found
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Overview */}
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Overview</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <div className="text-neutral-500 text-sm mb-1">Verification Rate</div>
                      <div className="text-2xl font-bold text-white">
                        {stats.totalProfiles > 0
                          ? Math.round((stats.verifiedProfiles / stats.totalProfiles) * 100)
                          : 0}%
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-500 text-sm mb-1">Premium Rate</div>
                      <div className="text-2xl font-bold text-white">
                        {stats.totalProfiles > 0
                          ? Math.round((stats.premiumProfiles / stats.totalProfiles) * 100)
                          : 0}%
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-500 text-sm mb-1">Avg Clicks/Profile</div>
                      <div className="text-2xl font-bold text-white">
                        {stats.totalProfiles > 0
                          ? Math.round(stats.totalClicks / stats.totalProfiles)
                          : 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-500 text-sm mb-1">Weekly Growth</div>
                      <div className="text-2xl font-bold text-green-500">
                        +{stats.newThisWeek}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Profiles by Clicks */}
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Top Profiles by Clicks</h3>
                  <div className="space-y-3">
                    {profiles
                      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
                      .slice(0, 10)
                      .map((profile, index) => (
                        <div key={profile.id} className="flex items-center gap-4">
                          <div className="text-neutral-600 w-6 text-sm">#{index + 1}</div>
                          <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden">
                            {profile.images?.[0] && (
                              <img
                                src={profile.images[0]}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 text-white">{profile.name}</div>
                          <div className="text-neutral-400">{profile.clicks || 0} clicks</div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Profiles by District */}
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Profiles by District</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(
                      profiles.reduce((acc, p) => {
                        acc[p.district] = (acc[p.district] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([district, count]) => (
                        <div key={district} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded">
                          <span className="text-neutral-400">{district}</span>
                          <span className="text-white font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
