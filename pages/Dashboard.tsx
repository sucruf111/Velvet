
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Image as ImageIcon, CreditCard, Settings, Users, ShieldAlert, ListChecks, Heart, LogOut, Save, Smartphone, MessageCircle, Send, Check } from 'lucide-react';
import { Button, Input } from '../components/UI';
import { ProfileCard } from '../components/ProfileCard';
import { MOCK_PACKAGES } from '../services/mockData';
import { ServiceType, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export const Dashboard: React.FC = () => {
  const { user, logout, isFavorite } = useAuth();
  const { profiles } = useData(); // Fetch real profiles from context
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  // --- Customer Dashboard View ---
  if (user.role === 'customer') {
    const favoriteProfiles = profiles.filter(p => isFavorite(p.id));

    return (
      <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
        <div className="flex justify-between items-center mb-10 border-b border-neutral-800 pb-6">
           <div>
              <h1 className="font-serif text-4xl text-white mb-2">My Favorites</h1>
              <p className="text-neutral-400">Welcome back, {user.username}. Here are your saved profiles.</p>
           </div>
           <Button variant="outline" onClick={() => { logout(); navigate('/'); }} className="flex gap-2 items-center">
             <LogOut size={16} /> Logout
           </Button>
        </div>

        {favoriteProfiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favoriteProfiles.map(profile => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-sm">
             <Heart size={48} className="mx-auto text-neutral-700 mb-4" />
             <h3 className="text-xl text-white font-serif mb-2">No Favorites Yet</h3>
             <p className="text-neutral-500 mb-6">Browse our exclusive directory to find your perfect match.</p>
             <Button onClick={() => navigate('/search')}>Browse Escorts</Button>
          </div>
        )}
      </div>
    );
  }

  // --- Model/Agency/Admin Dashboard View ---
  
  const dashboardRole = user.role === 'model' ? 'escort' : 'admin';
  
  // Find the actual profile for the logged in model
  const myProfile = user.profileId ? profiles.find(p => p.id === user.profileId) : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="font-serif text-3xl text-white">
                {user.role === 'model' ? 'Model Dashboard' : 'Agency Management'}
            </h1>
            {myProfile && <p className="text-luxury-gold text-sm mt-1">Editing Profile: {myProfile.name}</p>}
        </div>
        <div className="flex items-center gap-4">
            <span className="text-neutral-400 text-sm">Logged in as <span className="text-white font-bold">{user.username}</span></span>
            <button onClick={() => { logout(); navigate('/'); }} className="text-neutral-500 hover:text-white">Logout</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          {dashboardRole === 'escort' ? (
            <>
              <NavButton icon={<BarChart3 size={18} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <NavButton icon={<ListChecks size={18} />} label="My Services" active={activeTab === 'services'} onClick={() => setActiveTab('services')} />
              <NavButton icon={<ImageIcon size={18} />} label="My Photos" active={activeTab === 'photos'} onClick={() => setActiveTab('photos')} />
              <NavButton icon={<CreditCard size={18} />} label="Packages & Billing" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
              <NavButton icon={<Settings size={18} />} label="Profile Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </>
          ) : (
            <>
              <NavButton icon={<BarChart3 size={18} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <NavButton icon={<ShieldAlert size={18} />} label="Pending Approvals" active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} />
              <NavButton icon={<Users size={18} />} label="Model Management" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            </>
          )}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-neutral-900/50 border border-neutral-800 p-8 min-h-[500px]">
          {/* Show a warning if model is logged in but not linked to a real profile */}
          {dashboardRole === 'escort' && !myProfile && (
            <div className="bg-red-900/20 border border-red-900/50 p-4 text-red-200 mb-6 rounded-sm">
                <strong>Demo Mode:</strong> You are logged in as a generic model. 
                To edit a specific profile, please logout and login with a username matching a profile name (e.g., "Anastasia").
            </div>
          )}

          {dashboardRole === 'escort' && myProfile && (
              <>
                {activeTab === 'overview' && <EscortOverview profile={myProfile} />}
                {activeTab === 'services' && <EscortServices profile={myProfile} />}
                {activeTab === 'billing' && <EscortBilling />}
                {activeTab === 'photos' && <EscortPhotos profile={myProfile} />}
                {activeTab === 'settings' && <EscortSettings profile={myProfile} />}
              </>
          )}

          {/* Admin Views */}
          {dashboardRole === 'admin' && activeTab === 'overview' && <EscortOverview profile={profiles[0]} />} 
          {dashboardRole === 'admin' && activeTab === 'approvals' && <AdminApprovals />}
        </div>
      </div>
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${active ? 'bg-luxury-gold/10 text-luxury-gold border-r-2 border-luxury-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
  >
    {icon} {label}
  </button>
);

const EscortOverview: React.FC<{profile: Profile}> = ({profile}) => (
  <div className="space-y-8 animate-fade-in">
    <h2 className="font-serif text-3xl text-white">Overview: {profile.name}</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Profile Views (30d)" value={(profile.clicks + 241).toString()} change="+12%" />
      <StatCard label="Phone Clicks" value={Math.floor(profile.clicks / 20).toString()} change="+5%" />
      <StatCard label="Search Appearances" value={(profile.clicks * 5).toString()} change="+22%" />
    </div>

    <div className="bg-neutral-950 border border-neutral-800 p-6">
      <h3 className="text-luxury-gold text-sm uppercase tracking-widest mb-4">Current Status</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-lg font-medium">{profile.isPremium ? 'Premium Package Active' : 'Standard Package'}</p>
          <p className="text-neutral-500 text-sm">{profile.isPremium ? 'Expires in 12 days' : 'Upgrade to get more views'}</p>
        </div>
        <Button variant="outline">{profile.isPremium ? 'Extend Now' : 'Upgrade Now'}</Button>
      </div>
    </div>
  </div>
);

const EscortServices: React.FC<{profile: Profile}> = ({profile}) => {
    const { updateProfile } = useData();
    const [selectedServices, setSelectedServices] = useState<ServiceType[]>(profile.services);
    const [isSaved, setIsSaved] = useState(false);
    
    const toggleService = (service: ServiceType) => {
        if (selectedServices.includes(service)) {
            setSelectedServices(selectedServices.filter(s => s !== service));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
        setIsSaved(false);
    };

    const handleSave = () => {
        updateProfile({
            ...profile,
            services: selectedServices
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const allServices = Object.values(ServiceType);

    return (
        <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center border-b border-neutral-800 pb-6">
                <div>
                    <h2 className="font-serif text-3xl text-white">Service List</h2>
                    <p className="text-neutral-400 text-sm mt-1">Check all the services you offer. This will be displayed on your public profile.</p>
                </div>
                <Button onClick={handleSave} className="min-w-[140px]">
                    {isSaved ? <span className="flex items-center gap-2"><Check size={16}/> Saved</span> : 'Save Changes'}
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {allServices.map((service) => (
                    <div 
                        key={service} 
                        onClick={() => toggleService(service)}
                        className="flex items-center gap-4 p-2 cursor-pointer group hover:bg-neutral-800/50 rounded transition-colors"
                    >
                         <div className={`w-6 h-6 border rounded flex items-center justify-center transition-all ${selectedServices.includes(service) ? 'bg-luxury-gold border-luxury-gold' : 'border-neutral-600 bg-neutral-900 group-hover:border-neutral-500'}`}>
                            {selectedServices.includes(service) && <div className="w-3 h-3 bg-black rounded-sm" />}
                         </div>
                         <span className={`text-sm ${selectedServices.includes(service) ? 'text-white font-medium' : 'text-neutral-400 group-hover:text-neutral-300'}`}>
                             {service}
                         </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const EscortSettings: React.FC<{profile: Profile}> = ({profile}) => {
  const { updateProfile } = useData();
  const [formData, setFormData] = useState({
    phone: profile.phone || '',
    whatsapp: profile.whatsapp || '',
    telegram: profile.telegram || '',
    displayName: profile.name,
    age: profile.age,
    priceStart: profile.priceStart,
    description: profile.description
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
      updateProfile({
          ...profile,
          name: formData.displayName,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          telegram: formData.telegram,
          age: Number(formData.age),
          priceStart: Number(formData.priceStart),
          description: formData.description
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex justify-between items-center border-b border-neutral-800 pb-6">
          <h2 className="font-serif text-3xl text-white">Profile Settings</h2>
          <Button onClick={handleSave} className="flex items-center gap-2 min-w-[150px]">
            {isSaved ? <Check size={16} /> : <Save size={16} />} 
            {isSaved ? 'Changes Saved' : 'Save Changes'}
          </Button>
       </div>

       <div className="space-y-8 max-w-3xl">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Display Name</label>
                <Input 
                  value={formData.displayName} 
                  onChange={e => setFormData({...formData, displayName: e.target.value})} 
                />
             </div>
             <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Age</label>
                <Input 
                  type="number"
                  value={formData.age} 
                  onChange={e => setFormData({...formData, age: Number(e.target.value)})} 
                />
             </div>
             <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Hourly Rate (€)</label>
                <Input 
                  type="number"
                  value={formData.priceStart} 
                  onChange={e => setFormData({...formData, priceStart: Number(e.target.value)})} 
                />
             </div>
         </div>

         <div>
             <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">About Me (HTML allowed)</label>
             <textarea 
                className="w-full h-40 bg-neutral-900/50 border border-neutral-700 text-luxury-white p-3 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/50 transition-all placeholder-neutral-600 rounded-sm font-sans"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
             />
         </div>

         <div className="bg-neutral-950 p-6 border border-neutral-800 rounded-sm space-y-6">
            <h3 className="text-luxury-gold text-sm uppercase tracking-widest font-bold">Contact Options</h3>
            <p className="text-neutral-500 text-xs">These will be displayed on your profile. Leave empty to hide.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 mb-2">
                    <Smartphone size={14} /> Phone Number
                  </label>
                  <Input 
                    placeholder="+49..." 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
               </div>
               <div>
                  <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 mb-2">
                    <MessageCircle size={14} /> WhatsApp Number
                  </label>
                  <Input 
                    placeholder="+49..." 
                    value={formData.whatsapp}
                    onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  />
               </div>
               <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 mb-2">
                    <Send size={14} /> Telegram Username
                  </label>
                  <div className="flex">
                    <span className="bg-neutral-900 border border-r-0 border-neutral-700 text-neutral-500 p-3 text-sm flex items-center rounded-l-sm">t.me/</span>
                    <Input 
                      className="rounded-l-none"
                      placeholder="username" 
                      value={formData.telegram}
                      onChange={e => setFormData({...formData, telegram: e.target.value})}
                    />
                  </div>
               </div>
            </div>
         </div>
       </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string, change: string }> = ({ label, value, change }) => (
  <div className="bg-neutral-950 p-6 border border-neutral-800">
    <p className="text-neutral-500 text-xs uppercase tracking-widest mb-2">{label}</p>
    <p className="text-3xl text-white font-serif mb-1">{value}</p>
    <p className="text-green-500 text-sm">{change}</p>
  </div>
);

const EscortBilling: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <h2 className="font-serif text-2xl text-white">Active Packages</h2>
    <div className="space-y-4">
      {MOCK_PACKAGES.map(pkg => (
        <div key={pkg.id} className={`p-6 border ${pkg.isHighlight ? 'border-luxury-gold bg-luxury-gold/5' : 'border-neutral-800 bg-neutral-950'} flex justify-between items-center`}>
          <div>
            <h4 className="text-xl font-serif text-white">{pkg.name}</h4>
            <p className="text-neutral-400 text-sm">{pkg.durationDays} Days Duration</p>
            <ul className="mt-2 text-xs text-neutral-500 flex gap-2">
              {pkg.features.slice(0, 2).map((f, i) => <li key={i}>• {f}</li>)}
            </ul>
          </div>
          <div className="text-right">
            <p className="text-2xl font-serif text-luxury-gold mb-2">{pkg.price}€</p>
            <Button variant={pkg.isHighlight ? 'primary' : 'outline'} className="!py-2 !px-4 !text-xs">
              Buy Now
            </Button>
          </div>
        </div>
      ))}
    </div>

    <h3 className="font-serif text-xl text-white mt-12 mb-4">Invoices</h3>
    <table className="w-full text-left text-sm text-neutral-400">
      <thead className="border-b border-neutral-800 uppercase text-xs">
        <tr>
          <th className="py-3">Date</th>
          <th className="py-3">Package</th>
          <th className="py-3">Amount</th>
          <th className="py-3">Download</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-neutral-900">
          <td className="py-3">2023-10-01</td>
          <td>Premium 30 Days</td>
          <td>150.00€</td>
          <td><button className="text-luxury-gold underline">PDF</button></td>
        </tr>
      </tbody>
    </table>
  </div>
);

const EscortPhotos: React.FC<{profile: Profile}> = ({profile}) => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <h2 className="font-serif text-2xl text-white">Gallery Management</h2>
      <Button>Upload New</Button>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
       {profile.images.map((img, i) => (
         <div key={i} className="relative group aspect-[3/4] bg-neutral-800">
           <img src={img} alt="" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
             <button className="text-white hover:text-red-500">Delete</button>
           </div>
         </div>
       ))}
    </div>
  </div>
);

const AdminApprovals: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <h2 className="font-serif text-2xl text-white">Pending Verifications</h2>
    <div className="bg-neutral-950 border border-neutral-800 p-4">
      <div className="flex items-start gap-4">
        <div className="w-24 h-32 bg-neutral-800">
          <img src="https://picsum.photos/200/300" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg text-white font-bold">New User: "Bella"</h4>
          <p className="text-neutral-400 text-sm mb-4">Submitted ID photo matches profile selfie.</p>
          <div className="flex gap-2">
            <Button className="!py-1 !px-3 bg-green-700 hover:bg-green-600 text-white !border-none">Approve</Button>
            <Button className="!py-1 !px-3 bg-red-900 hover:bg-red-800 text-white !border-none">Reject</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
