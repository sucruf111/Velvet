
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Profile, Agency } from '../types';
import { db } from '../services/database';

interface DataContextType {
  profiles: Profile[];
  agencies: Agency[];
  updateProfile: (profile: Profile) => Promise<void>;
  refreshData: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await db.init();
      
      const [fetchedProfiles, fetchedAgencies] = await Promise.all([
        db.getProfiles(),
        db.getAgencies()
      ]);

      setProfiles(fetchedProfiles);
      setAgencies(fetchedAgencies);
    } catch (err) {
      console.error("Failed to load data", err);
      setError("Failed to connect to the database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateProfile = async (updatedProfile: Profile) => {
    // Optimistic update for UI responsiveness
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    
    try {
      // Actual DB update
      await db.updateProfile(updatedProfile);
    } catch (err) {
      // Revert if failed
      setError("Failed to save changes.");
      loadData(); // Reload from DB to reset state
    }
  };

  return (
    <DataContext.Provider value={{ 
      profiles, 
      agencies, 
      updateProfile, 
      refreshData: loadData,
      isLoading,
      error
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
