
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/database';

export type UserRole = 'customer' | 'model' | 'agency' | null;

export interface User {
  id: string;
  username: string;
  role: UserRole;
  favorites: string[]; // Array of Profile IDs
  avatar?: string;
  profileId?: string; // Link to actual profile in DB
}

interface AuthContextType {
  user: User | null;
  login: (username: string, role: UserRole) => Promise<void>;
  register: (data: any, role: UserRole) => void;
  logout: () => void;
  toggleFavorite: (profileId: string) => void;
  isFavorite: (profileId: string) => boolean;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Load user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('velvet_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, role: UserRole) => {
    setIsLoggingIn(true);
    try {
        let profileId = undefined;
        let avatar = `https://ui-avatars.com/api/?name=${username}&background=d4af37&color=000`;

        // Smart Login: Connect to DB profile if it exists (Async now)
        if (role === 'model') {
           const existingProfile = await db.findProfileByUsername(username);
           if (existingProfile) {
             profileId = existingProfile.id;
             avatar = existingProfile.images[0] || avatar;
           }
        }

        const newUser: User = {
          id: profileId || Math.random().toString(36).substr(2, 9),
          username,
          role,
          favorites: user?.favorites || [], // Keep favorites if re-logging
          avatar,
          profileId
        };
        
        setUser(newUser);
        localStorage.setItem('velvet_user', JSON.stringify(newUser));
    } finally {
        setIsLoggingIn(false);
    }
  };

  const register = (data: any, role: UserRole) => {
    // In a real app, this would create a Supabase Auth user. 
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: data.username || data.agencyName || 'User',
      role,
      favorites: [],
      avatar: `https://ui-avatars.com/api/?name=${data.username || 'U'}&background=d4af37&color=000`
    };
    setUser(newUser);
    localStorage.setItem('velvet_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('velvet_user');
  };

  const toggleFavorite = (profileId: string) => {
    if (!user) return;

    const isFav = user.favorites.includes(profileId);
    let newFavorites;
    
    if (isFav) {
      newFavorites = user.favorites.filter(id => id !== profileId);
    } else {
      newFavorites = [...user.favorites, profileId];
    }

    const updatedUser = { ...user, favorites: newFavorites };
    setUser(updatedUser);
    localStorage.setItem('velvet_user', JSON.stringify(updatedUser));
  };

  const isFavorite = (profileId: string) => {
    return user?.favorites.includes(profileId) || false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      toggleFavorite, 
      isFavorite,
      isAuthenticated: !!user,
      isLoggingIn
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
