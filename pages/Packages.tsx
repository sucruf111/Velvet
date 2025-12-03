
import React, { useState } from 'react';
import { Check, Info } from 'lucide-react';
import { MOCK_PACKAGES } from '../services/mockData';
import { Button } from '../components/UI';

export const Packages: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'model' | 'agency'>('model');

  const displayedPackages = MOCK_PACKAGES.filter(pkg => pkg.type === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="font-serif text-5xl text-white mb-6">Advertise with Velvet</h1>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Choose the perfect package to showcase your elegance. We offer high visibility, 
          premium clientele, and complete control over your profile.
        </p>

        {/* Type Switcher */}
        <div className="flex justify-center mt-12">
            <div className="bg-neutral-900 p-1 rounded-sm inline-flex border border-neutral-800">
                <button 
                    onClick={() => setActiveTab('model')}
                    className={`px-8 py-3 rounded-sm text-sm uppercase tracking-widest font-bold transition-all ${activeTab === 'model' ? 'bg-luxury-gold text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                >
                    For Models
                </button>
                <button 
                    onClick={() => setActiveTab('agency')}
                    className={`px-8 py-3 rounded-sm text-sm uppercase tracking-widest font-bold transition-all ${activeTab === 'agency' ? 'bg-luxury-gold text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                >
                    For Agencies
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {displayedPackages.map(pkg => (
          <div 
            key={pkg.id} 
            className={`relative p-8 border flex flex-col ${pkg.isHighlight ? 'border-luxury-gold bg-gradient-to-b from-neutral-900 to-black transform scale-105 shadow-[0_0_30px_rgba(212,175,55,0.1)]' : 'border-neutral-800 bg-neutral-950'}`}
          >
            {pkg.isHighlight && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-luxury-gold text-black px-4 py-1 text-xs font-bold uppercase tracking-widest">
                Most Popular
              </div>
            )}
            
            <h3 className="font-serif text-2xl text-white mb-2">{pkg.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-serif text-luxury-gold">{pkg.price}€</span>
              <span className="text-neutral-500 text-sm"> / {pkg.durationDays} days</span>
              {pkg.extraModelPrice && (
                  <div className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                      <Info size={12} />
                      +{pkg.extraModelPrice}€ per additional model
                  </div>
              )}
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {pkg.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-neutral-300">
                  <Check size={16} className="text-luxury-gold flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button variant={pkg.isHighlight ? 'primary' : 'outline'} fullWidth>
              Select Package
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-20 text-center">
        <h3 className="font-serif text-2xl text-white mb-4">Why choose Velvet Berlin?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-8 max-w-5xl mx-auto">
           <div className="p-6 border border-neutral-900 bg-neutral-950/50">
             <h4 className="text-luxury-gold font-bold mb-2">High-End Clientele</h4>
             <p className="text-neutral-500 text-sm">We market specifically to affluent gentlemen visiting Berlin.</p>
           </div>
           <div className="p-6 border border-neutral-900 bg-neutral-950/50">
             <h4 className="text-luxury-gold font-bold mb-2">Self-Service</h4>
             <p className="text-neutral-500 text-sm">You have full control. Upload photos and change rates instantly.</p>
           </div>
           <div className="p-6 border border-neutral-900 bg-neutral-950/50">
             <h4 className="text-luxury-gold font-bold mb-2">Discrete & Secure</h4>
             <p className="text-neutral-500 text-sm">Servers in Switzerland. No data sharing. Your privacy is paramount.</p>
           </div>
        </div>
      </div>
    </div>
  );
};