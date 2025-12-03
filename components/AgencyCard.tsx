
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Crown } from 'lucide-react';
import { Agency } from '../types';

interface AgencyCardProps {
  agency: Agency;
}

export const AgencyCard: React.FC<AgencyCardProps> = ({ agency }) => {
  return (
    <div className={`group relative w-full bg-luxury-darkgray border hover:border-luxury-gold transition-all duration-500 hover:shadow-[0_0_30px_rgba(191,149,63,0.2)] overflow-hidden rounded-sm ${agency.isFeatured ? 'border-luxury-gold shadow-[0_0_15px_rgba(191,149,63,0.1)]' : 'border-white/10'}`}>
      <Link to={`/agency/${agency.id}`} className="block relative aspect-[3/4] overflow-hidden bg-neutral-900 group-image">
        
        {/* Main Image (Using vertical profile image) */}
        <img 
          src={agency.image} 
          alt={agency.name} 
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
        />

        {/* Dark Overlay - Lighter than before to show image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition-opacity duration-500"></div>

        {/* Agency Badge */}
        <div className="absolute top-3 left-3 z-30 flex gap-2">
            <span className="bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-lg px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded-sm">
                AGENCY
            </span>
            {agency.isFeatured && (
                <span className="bg-luxury-gold-gradient text-black border border-white/20 shadow-lg px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded-sm flex items-center gap-1">
                    <Crown size={10} fill="black" /> Featured
                </span>
            )}
        </div>

        {/* Info Overlay (Bottom) */}
        <div className="absolute bottom-0 left-0 w-full p-5 z-30 flex flex-col justify-end h-full pointer-events-none">
            <div className="mt-auto mb-4 pointer-events-auto text-center">
                <h3 className="font-serif text-3xl text-white font-normal group-hover:text-gold-gradient transition-all leading-none tracking-tight shadow-black drop-shadow-xl mb-2">
                  {agency.name}
                </h3>
                
                <div className="flex items-center justify-center gap-1.5 text-neutral-100 text-sm shadow-black drop-shadow-lg font-bold">
                  <MapPin size={14} className="text-luxury-gold" />
                  <span className="font-sans uppercase tracking-wide opacity-90 drop-shadow-md">{agency.district}</span>
                </div>
            </div>

            <button className="w-full pointer-events-auto bg-luxury-gold-gradient hover:bg-luxury-gold-gradient-hover text-black font-black py-4 uppercase tracking-[0.25em] text-xs transition-all flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(0,0,0,0.6)] rounded-sm transform active:scale-[0.98] border border-white/20">
                 View Models
            </button>
        </div>
      </Link>
    </div>
  );
};
