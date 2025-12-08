import { createClient } from '@supabase/supabase-js';
import { Profile, Agency } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side data fetching functions
export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('isDisabled', false)
    .order('lastActive', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  return data || [];
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

  return data;
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
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('isDisabled', false);

  if (error) {
    console.error('Error counting profiles:', error);
    return 0;
  }

  return count || 0;
}
