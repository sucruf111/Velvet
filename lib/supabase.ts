import { createClient } from '@supabase/supabase-js';
import { Profile, Agency, ModelTier } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Calculate 30 days ago for filtering inactive profiles
function getThirtyDaysAgo(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString();
}

// Transform database profile to frontend Profile type with tier defaults
function transformProfile(dbProfile: Record<string, unknown>): Profile {
  return {
    ...dbProfile,
    // Map snake_case to camelCase for new tier fields
    tier: (dbProfile.tier as ModelTier) || 'free',
    boostsRemaining: (dbProfile.boosts_remaining as number) || 0,
    boostedUntil: dbProfile.boosted_until as string | undefined,
    videoUrls: (dbProfile.video_urls as string[]) || [],
    primaryContact: dbProfile.primary_contact as 'phone' | 'whatsapp' | 'telegram' | undefined,
  } as Profile;
}

// Server-side data fetching functions
export async function getProfiles(): Promise<Profile[]> {
  const thirtyDaysAgo = getThirtyDaysAgo();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or('isDisabled.is.null,isDisabled.eq.false')
    .or(`lastActive.is.null,lastActive.gte.${thirtyDaysAgo}`)
    .order('lastActive', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  // Client-side filter to ensure both conditions are properly met
  // (Supabase .or() chaining can have complex behavior)
  const filteredData = (data || []).filter(profile => {
    // Must not be disabled
    const notDisabled = profile.isDisabled === null || profile.isDisabled === false;

    // Must be active within last 30 days (or have no lastActive set for backwards compatibility)
    const isActive = !profile.lastActive || new Date(profile.lastActive) >= new Date(thirtyDaysAgo);

    return notDisabled && isActive;
  });

  // Transform all profiles to include tier defaults
  return filteredData.map(transformProfile);
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data ? transformProfile(data) : null;
}

export async function getAgencies(): Promise<Agency[]> {
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching agencies:', error);
    return [];
  }

  return data || [];
}

export async function getAgencyById(id: string): Promise<Agency | null> {
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching agency:', error);
    return null;
  }

  return data;
}

// Get profiles count for statistics
export async function getProfilesCount(): Promise<number> {
  // Use getProfiles to ensure consistent filtering logic
  const profiles = await getProfiles();
  return profiles.length;
}
