'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { District } from './types';

export type UserRole = 'customer' | 'model' | 'agency' | 'admin' | null;

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  favorites: string[];
  avatar?: string;
  profileId?: string;
  isVerified?: boolean;
}

interface UserMetadata {
  username: string;
  role: 'customer' | 'model' | 'agency' | 'admin';
  profile_id?: string;
  favorites: string[];
  is_verified?: boolean;
}

interface RegistrationData {
  email?: string;
  phone?: string;
  password: string;
  username?: string;
  displayName?: string;
  agencyName?: string;
  district?: string;
  age?: string;
  priceStart?: number;
  description?: string;
  contactPhone?: string;
  whatsapp?: string;
  telegram?: string;
  website?: string;
  height?: number;
  dressSize?: string;
  shoeSize?: number;
  braSize?: string;
  services?: string[];
  visitType?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, password: string) => Promise<void>;
  register: (data: RegistrationData, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (profileId: string) => void;
  isFavorite: (profileId: string) => boolean;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  resetPassword: (email: string) => Promise<void>;
  canAdvertise: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create Supabase client for browser
function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const sanitizeString = (str: string | undefined): string => {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
};

function transformSupabaseUser(user: SupabaseUser, isVerified?: boolean): User {
  const metadata = user.user_metadata as UserMetadata;
  return {
    id: user.id,
    email: user.email || '',
    username: metadata?.username || user.email?.split('@')[0] || 'User',
    role: metadata?.role || 'customer',
    favorites: metadata?.favorites || [],
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(metadata?.username || 'User')}&background=d4af37&color=000`,
    profileId: metadata?.profile_id,
    isVerified: isVerified ?? metadata?.is_verified ?? false
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const supabase = createClient();

  // Helper to fetch verification status from database
  const fetchVerificationStatus = async (userId: string, role: string, profileId?: string): Promise<boolean> => {
    if (!profileId) return false;

    // Agencies are considered verified once registered
    if (role === 'agency') return true;

    // For models, check the profiles table
    if (role === 'model') {
      const { data } = await supabase
        .from('profiles')
        .select('isVerified')
        .eq('id', profileId)
        .single();
      return data?.isVerified ?? false;
    }

    return false;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const metadata = currentUser.user_metadata as UserMetadata;
          const isVerified = await fetchVerificationStatus(
            currentUser.id,
            metadata?.role || 'customer',
            metadata?.profile_id
          );
          setUser(transformSupabaseUser(currentUser, isVerified));
        }
      } catch {
        // User not logged in
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const metadata = session.user.user_metadata as UserMetadata;
        const isVerified = await fetchVerificationStatus(
          session.user.id,
          metadata?.role || 'customer',
          metadata?.profile_id
        );
        setUser(transformSupabaseUser(session.user, isVerified));
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Map Supabase error messages to user-friendly messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw error;
      }
      if (!data.user) throw new Error('Invalid email or password');

      const metadata = data.user.user_metadata as UserMetadata;
      const isVerified = await fetchVerificationStatus(
        data.user.id,
        metadata?.role || 'customer',
        metadata?.profile_id
      );
      setUser(transformSupabaseUser(data.user, isVerified));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginWithPhone = async (phone: string, password: string) => {
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password
      });

      if (error) {
        // Map Supabase error messages to user-friendly messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid phone number or password');
        }
        throw error;
      }
      if (!data.user) throw new Error('Invalid phone number or password');

      const metadata = data.user.user_metadata as UserMetadata;
      const isVerified = await fetchVerificationStatus(
        data.user.id,
        metadata?.role || 'customer',
        metadata?.profile_id
      );
      setUser(transformSupabaseUser(data.user, isVerified));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async (data: RegistrationData, role: UserRole) => {
    // Simple registration - create user and sign in, profile creation happens in background
    const username = sanitizeString(data.username || data.displayName || data.agencyName).toLowerCase();

    const initialMetadata = {
      username,
      role: role as 'customer' | 'model' | 'agency' | 'admin',
      favorites: [] as string[],
      // Store registration data for profile creation later
      pendingProfile: role !== 'customer' ? {
        displayName: data.displayName,
        agencyName: data.agencyName,
        district: data.district,
        age: data.age,
        priceStart: data.priceStart,
        description: data.description,
        contactPhone: data.contactPhone,
        whatsapp: data.whatsapp,
        telegram: data.telegram,
        website: data.website,
        height: data.height,
        dressSize: data.dressSize,
        shoeSize: data.shoeSize,
        braSize: data.braSize,
        services: data.services,
        visitType: data.visitType
      } : undefined
    };

    // Sign up
    const signUpResult = data.phone
      ? await supabase.auth.signUp({
          phone: data.phone,
          password: data.password,
          options: { data: initialMetadata }
        })
      : await supabase.auth.signUp({
          email: data.email!,
          password: data.password,
          options: { data: initialMetadata }
        });

    if (signUpResult.error) throw signUpResult.error;
    if (!signUpResult.data?.user) throw new Error('Signup failed');

    // Sign in immediately
    const signInResult = data.phone
      ? await supabase.auth.signInWithPassword({
          phone: data.phone,
          password: data.password
        })
      : await supabase.auth.signInWithPassword({
          email: data.email!,
          password: data.password
        });

    if (signInResult.error) {
      // User created but needs email confirmation
      console.warn('Sign-in failed:', signInResult.error.message);
    }

    // Set user state - don't wait for profile creation
    setUser(transformSupabaseUser(signUpResult.data.user));

    // Create profile/agency in background (non-blocking)
    if (role === 'model' && data.displayName) {
      createModelProfile(signUpResult.data.user.id, data).catch(console.error);
    } else if (role === 'agency' && data.agencyName) {
      createAgencyProfile(signUpResult.data.user.id, data).catch(console.error);
    }
  };

  // Background profile creation functions
  const createModelProfile = async (userId: string, data: RegistrationData) => {
    const now = new Date().toISOString();
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        userId,
        name: sanitizeString(data.displayName),
        age: Math.min(99, Math.max(18, Number(data.age) || 25)),
        district: (data.district || 'Mitte') as District,
        priceStart: Math.min(10000, Math.max(0, Number(data.priceStart) || 150)),
        languages: ['Deutsch', 'English'],
        services: data.services || [],
        description: sanitizeString(data.description) || 'Welcome to my profile.',
        images: [],
        isPremium: false,
        isNew: true,
        isVerified: false,
        isVelvetChoice: false,
        clicks: 0,
        phone: sanitizeString(data.contactPhone),
        whatsapp: sanitizeString(data.whatsapp),
        telegram: sanitizeString(data.telegram),
        height: Math.min(220, Math.max(100, Number(data.height) || 170)),
        dressSize: sanitizeString(data.dressSize) || '36',
        shoeSize: Math.min(50, Math.max(30, Number(data.shoeSize) || 38)),
        braSize: sanitizeString(data.braSize) || '75B',
        reviews: [],
        availability: [],
        showSchedule: false,
        lastActive: now,
        isOnline: true,
        createdAt: now,
        visitType: (data.visitType || 'both')
      })
      .select()
      .single();

    if (!error && newProfile) {
      await supabase.auth.updateUser({ data: { profile_id: newProfile.id } });
    }
  };

  const createAgencyProfile = async (userId: string, data: RegistrationData) => {
    const sanitizedAgencyName = sanitizeString(data.agencyName);
    const { data: newAgency, error } = await supabase
      .from('agencies')
      .insert({
        id: crypto.randomUUID(),
        userId,
        name: sanitizedAgencyName,
        description: sanitizeString(data.description) || 'Welcome to our agency.',
        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedAgencyName)}&background=000&color=d4af37&size=200`,
        banner: '',
        image: '',
        website: sanitizeString(data.website),
        phone: sanitizeString(data.contactPhone),
        whatsapp: sanitizeString(data.whatsapp),
        telegram: sanitizeString(data.telegram),
        email: sanitizeString(data.email),
        district: (data.district || 'Mitte') as District,
        isFeatured: false,
        reviews: []
      })
      .select()
      .single();

    if (!error && newAgency) {
      await supabase.auth.updateUser({ data: { profile_id: newAgency.id } });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const toggleFavorite = async (profileId: string) => {
    if (!user) return;

    const isFav = user.favorites.includes(profileId);
    let newFavorites: string[];

    if (isFav) {
      newFavorites = user.favorites.filter(id => id !== profileId);
    } else {
      newFavorites = [...user.favorites, profileId];
    }

    setUser({ ...user, favorites: newFavorites });

    try {
      await supabase.auth.updateUser({
        data: { favorites: newFavorites }
      });
    } catch {
      setUser({ ...user, favorites: user.favorites });
    }
  };

  const isFavorite = (profileId: string) => {
    return user?.favorites.includes(profileId) || false;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  };

  // User can advertise if they are:
  // 1. A verified model (isVerified = true)
  // 2. An agency (agencies are always allowed to advertise)
  const canAdvertise = !!(
    user &&
    ((user.role === 'model' && user.isVerified) || user.role === 'agency')
  );

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithPhone,
      register,
      logout,
      toggleFavorite,
      isFavorite,
      isAuthenticated: !!user,
      isLoggingIn,
      resetPassword,
      canAdvertise
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
