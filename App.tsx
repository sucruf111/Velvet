
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { SearchPage } from './pages/Search';
import { ProfileDetail } from './pages/ProfileDetail';
import { AgencyDetail } from './pages/AgencyDetail';
import { Dashboard } from './pages/Dashboard';
import { Packages } from './pages/Packages';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Button } from './components/UI';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

const AgeGate: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => (
  <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
    <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-4xl text-luxury-white mb-2">VELVET <span className="text-luxury-gold">BERLIN</span></h1>
        <p className="text-neutral-500 uppercase tracking-[0.3em] text-xs">Premium Escort Directory</p>
      </div>
      
      <div className="border border-neutral-800 p-8 bg-neutral-900/30 backdrop-blur">
        <h2 className="text-xl text-white mb-4 font-serif">Adult Content Warning</h2>
        <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
          This website contains sexually explicit material intended for adults. 
          By entering, you confirm that you are at least 18 years of age.
        </p>
        <div className="flex gap-4">
           <Button onClick={onConfirm} fullWidth>I am 18+</Button>
           <a href="https://google.com" className="w-full">
             <Button variant="outline" fullWidth>Exit</Button>
           </a>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isAgeVerified, setIsAgeVerified] = useState(() => localStorage.getItem('age-verified') === 'true');

  const handleAgeVerify = () => {
    localStorage.setItem('age-verified', 'true');
    setIsAgeVerified(true);
  };

  if (!isAgeVerified) return <AgeGate onConfirm={handleAgeVerify} />;

  return (
    <DataProvider>
      <AuthProvider>
        <LanguageProvider>
          <HashRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/profile/:id" element={<ProfileDetail />} />
                <Route path="/agency/:id" element={<AgencyDetail />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/packages" element={<Packages />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </Layout>
          </HashRouter>
        </LanguageProvider>
      </AuthProvider>
    </DataProvider>
  );
};

export default App;
