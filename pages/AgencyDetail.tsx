
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, ArrowLeft, MessageSquareQuote, Star, Send } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ProfileCard } from '../components/ProfileCard';
import { Button } from '../components/UI';
import { LuxuryBackground } from '../components/LuxuryBackground';

export const AgencyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { agencies, profiles } = useData();
  const agency = agencies.find(a => a.id === id);
  const agencyProfiles = profiles.filter(p => p.agencyId === id);
  
  // Local state to handle image errors
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!agency) return <div className="text-center py-20 text-white">Agency not found</div>;

  return (
    <div className="animate-fade-in pb-20 bg-luxury-black min-h-screen">
      {/* Header/Banner with Innovative Background */}
      <div className="relative h-[400px] w-full overflow-hidden flex items-end">
        {/* Animated Background instead of static image */}
        <div className="absolute inset-0 z-0 bg-[#050505]">
             <LuxuryBackground intensity="low" />
             {/* Gradient Overlay for Text Readability */}
             <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-luxury-black/60 to-transparent z-10"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full p-8 z-20">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-8">
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-luxury-gold bg-black overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.3)] shrink-0 relative z-30">
                   {!logoError ? (
                       <img 
                        src={agency.logo} 
                        alt={agency.name} 
                        className="w-full h-full object-cover"
                        onError={() => setLogoError(true)}
                       />
                   ) : (
                       <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-luxury-gold font-serif text-2xl">
                           {agency.name.substring(0,2).toUpperCase()}
                       </div>
                   )}
               </div>
               <div className="mb-4">
                   <h1 className="font-serif text-5xl md:text-6xl text-white mb-2 drop-shadow-lg">{agency.name}</h1>
                   <div className="flex items-center gap-2 text-luxury-gold text-sm uppercase tracking-widest font-bold drop-shadow-md">
                       <MapPin size={16} /> {agency.district}, Berlin
                   </div>
               </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: Info */}
          <div className="lg:col-span-1 space-y-8">
              <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-sm">
                  {/* Agency Profile Image for Branding consistency */}
                  <div className="mb-8 overflow-hidden rounded-sm border border-neutral-800 relative aspect-[3/4]">
                      {!imageError ? (
                        <img 
                            src={agency.image} 
                            alt="Agency Vibe" 
                            className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                            onError={() => setImageError(true)}
                        />
                      ) : (
                         <div className="absolute inset-0 w-full h-full bg-neutral-800 flex items-center justify-center">
                             <span className="text-neutral-600 font-serif">Image not available</span>
                         </div>
                      )}
                  </div>

                  <h3 className="font-serif text-2xl text-white mb-6 border-b border-neutral-800 pb-4">About Agency</h3>
                  <p className="text-neutral-400 leading-relaxed mb-8 font-serif">
                      {agency.description}
                  </p>
                  
                  <div className="space-y-4">
                      {agency.website && (
                          <a href={`https://${agency.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-300 hover:text-luxury-gold transition-colors text-sm">
                              <Globe size={16} className="text-luxury-gold" /> {agency.website}
                          </a>
                      )}
                      {agency.phone && (
                          <a href={`tel:${agency.phone}`} className="flex items-center gap-3 text-neutral-300 hover:text-luxury-gold transition-colors text-sm">
                              <Phone size={16} className="text-luxury-gold" /> {agency.phone}
                          </a>
                      )}
                      {agency.telegram && (
                          <a href={`https://t.me/${agency.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-300 hover:text-luxury-gold transition-colors text-sm">
                              <Send size={16} className="text-luxury-gold" /> t.me/{agency.telegram.replace('@', '')}
                          </a>
                      )}
                      <a href={`mailto:${agency.email}`} className="flex items-center gap-3 text-neutral-300 hover:text-luxury-gold transition-colors text-sm">
                          <Mail size={16} className="text-luxury-gold" /> {agency.email}
                      </a>
                  </div>

                  <div className="mt-8 pt-8 border-t border-neutral-800">
                      <Button fullWidth>Contact Agency</Button>
                  </div>
              </div>
              
              <Link to="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold">
                  <ArrowLeft size={16} /> Back to Directory
              </Link>
          </div>

          {/* Right: Models & Reviews */}
          <div className="lg:col-span-2 space-y-16">
              
              {/* Models Section */}
              <div>
                <div className="flex items-center justify-between mb-8 border-b border-neutral-800 pb-4">
                    <h2 className="font-serif text-3xl text-white">
                        Our Models <span className="text-neutral-500 text-lg ml-2 align-middle">({agencyProfiles.length})</span>
                    </h2>
                </div>
                
                {agencyProfiles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {agencyProfiles.map(profile => (
                            <ProfileCard key={profile.id} profile={profile} />
                        ))}
                    </div>
                ) : (
                    <p className="text-neutral-500 italic">No models currently listed for this agency.</p>
                )}
              </div>

              {/* Guestbook Section (New) */}
              <div>
                <h3 className="font-serif text-3xl text-white mb-8 flex items-center gap-3 border-b border-neutral-800 pb-4">
                    <MessageSquareQuote size={24} className="text-luxury-gold" strokeWidth={1} /> Agency Guestbook
                </h3>
                
                {agency.reviews && agency.reviews.length > 0 ? (
                    <div className="grid gap-6">
                        {agency.reviews.map((review, i) => (
                            <div key={i} className="bg-neutral-900/30 p-6 border-l-2 border-luxury-gold">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-white font-serif text-lg">{review.author}</span>
                                        <span className="text-neutral-500 text-xs uppercase tracking-widest ml-3">{review.date}</span>
                                    </div>
                                    <div className="flex">
                                        {[...Array(5)].map((_, starI) => (
                                            <Star key={starI} size={14} className={`${starI < review.rating ? 'fill-luxury-gold text-luxury-gold' : 'text-neutral-700'}`} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-neutral-300 italic font-serif">"{review.text}"</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 border border-dashed border-neutral-800 rounded-sm">
                        <p className="text-neutral-500 italic">No public reviews yet.</p>
                    </div>
                )}
              </div>

          </div>
      </div>
    </div>
  );
};
