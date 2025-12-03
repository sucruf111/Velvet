
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, Agency } from '../types';
import { MOCK_PROFILES, MOCK_AGENCIES } from './mockData';

// --- CONFIGURATION ---
// To go live: Replace these empty strings with your actual Supabase URL and Anon Key.
const supabaseConfig = {
  url: '', 
  key: '' 
};

// --- SQL SETUP INSTRUCTIONS ---
/*
  If using Supabase, run this SQL in your Supabase SQL Editor to create the table:

  create table profiles (
    id text primary key,
    name text not null,
    "agencyId" text,
    age int,
    district text,
    "priceStart" int,
    languages text[],
    services text[],
    description text,
    images text[],
    "isPremium" boolean default false,
    "isNew" boolean default false,
    "isVerified" boolean default false,
    "isVelvetChoice" boolean default false,
    clicks int default 0,
    phone text,
    whatsapp text,
    telegram text,
    height int,
    "dressSize" text,
    "shoeSize" int,
    "braSize" text,
    reviews jsonb[],
    availability text[],
    "showSchedule" boolean default false,
    "lastActive" text
  );

  -- You would do the same for 'agencies' table.
*/

const STORAGE_KEYS = {
  PROFILES: 'velvet_db_profiles',
  AGENCIES: 'velvet_db_agencies'
};

// --- CLIENT INITIALIZATION ---
let supabase: SupabaseClient | null = null;
if (supabaseConfig.url && supabaseConfig.key) {
  supabase = createClient(supabaseConfig.url, supabaseConfig.key);
  console.log('🔌 Connected to Supabase');
} else {
  console.log('⚠️ No Supabase keys found. Using LocalStorage Mock Database.');
}

// --- DATABASE API ---

export const db = {
  init: async () => {
    // Seed LocalStorage if using mock mode
    if (!supabase) {
      if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
        console.log('Seeding Local DB with Mock Profiles...');
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(MOCK_PROFILES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.AGENCIES)) {
        localStorage.setItem(STORAGE_KEYS.AGENCIES, JSON.stringify(MOCK_AGENCIES));
      }
    }
  },

  getProfiles: async (): Promise<Profile[]> => {
    // 1. Try Supabase
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) return data as unknown as Profile[];
      console.error('Supabase Error:', error);
    }

    // 2. Fallback to Mock (Simulate Network Latency)
    await new Promise(resolve => setTimeout(resolve, 600)); // 600ms fake delay
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
      return data ? JSON.parse(data) : MOCK_PROFILES;
    } catch (e) {
      return MOCK_PROFILES;
    }
  },

  getAgencies: async (): Promise<Agency[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('agencies').select('*');
      if (!error && data) return data as unknown as Agency[];
    }

    await new Promise(resolve => setTimeout(resolve, 400));
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AGENCIES);
      return data ? JSON.parse(data) : MOCK_AGENCIES;
    } catch (e) {
      return MOCK_AGENCIES;
    }
  },

  updateProfile: async (updatedProfile: Profile): Promise<Profile[]> => {
    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', updatedProfile.id);
      
      if (error) {
        console.error('Update failed:', error);
        throw error;
      }
      // Return fresh list
      return await db.getProfiles();
    }

    // Mock Update
    await new Promise(resolve => setTimeout(resolve, 800));
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
    const index = profiles.findIndex((p: Profile) => p.id === updatedProfile.id);
    
    if (index !== -1) {
      profiles[index] = updatedProfile;
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    }
    return profiles;
  },

  findProfileByUsername: async (username: string): Promise<Profile | undefined> => {
    if (supabase) {
      // Very basic implementation: assuming name maps to username for demo
      const { data } = await supabase.from('profiles').select('*').ilike('name', username).single();
      return data as unknown as Profile;
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
    return profiles.find((p: Profile) => p.name.toLowerCase() === username.toLowerCase());
  }
};
