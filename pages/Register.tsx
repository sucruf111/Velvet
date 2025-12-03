
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Heart, Briefcase, Camera, Shield, Check, ArrowRight, ChevronLeft, Smartphone, MessageCircle, Send } from 'lucide-react';
import { Button, Input, Select } from '../components/UI';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { District, ServiceType } from '../types';

export const Register: React.FC = () => {
  const [step, setStep] = useState<'role-selection' | 'form'>('role-selection');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  
  return (
    <div className="min-h-screen bg-luxury-black pt-20 pb-12 px-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl text-white mb-3">
            {step === 'role-selection' ? 'Join Velvet Berlin' : 'Create Your Account'}
          </h1>
          <p className="text-neutral-400">
            {step === 'role-selection' 
              ? 'Select your account type to begin the exclusive experience.' 
              : `Registering as ${selectedRole === 'customer' ? 'a Guest' : selectedRole === 'model' ? 'a Model' : 'an Agency'}`}
          </p>
        </div>

        {step === 'role-selection' ? (
          <RoleSelection onSelect={(role) => { setSelectedRole(role); setStep('form'); }} />
        ) : (
          <RegistrationForm role={selectedRole} onBack={() => setStep('role-selection')} />
        )}

      </div>
    </div>
  );
};

// --- Sub-Components ---

const RoleSelection: React.FC<{ onSelect: (role: UserRole) => void }> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <RoleCard 
        icon={<User size={32} />}
        title="Guest"
        description="For gentlemen seeking companionship. Anonymous, secure, and free."
        features={['Save Favorites', 'Private Notes', 'No Email Required']}
        onClick={() => onSelect('customer')}
      />
      <RoleCard 
        icon={<Camera size={32} />}
        title="Model"
        description="For independent escorts and massage artists. Manage your profile."
        features={['Self-Service Dashboard', 'Keep 100% Earnings', '24/7 Support']}
        onClick={() => onSelect('model')}
        highlight
      />
      <RoleCard 
        icon={<Briefcase size={32} />}
        title="Agency"
        description="For established agencies managing multiple talents."
        features={['Multi-Profile Management', 'Bulk Analytics', 'Priority Placement']}
        onClick={() => onSelect('agency')}
      />
    </div>
  );
};

const RoleCard: React.FC<{ icon: React.ReactNode, title: string, description: string, features: string[], onClick: () => void, highlight?: boolean }> = ({ 
  icon, title, description, features, onClick, highlight 
}) => (
  <div 
    onClick={onClick}
    className={`relative group cursor-pointer p-8 border rounded-sm transition-all duration-300 hover:-translate-y-2 ${highlight ? 'bg-luxury-gold/5 border-luxury-gold shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'bg-neutral-900/50 border-neutral-800 hover:border-luxury-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]'}`}
  >
    <div className={`mb-6 ${highlight ? 'text-luxury-gold' : 'text-neutral-400 group-hover:text-luxury-gold'}`}>
      {icon}
    </div>
    <h3 className="font-serif text-2xl text-white mb-3">{title}</h3>
    <p className="text-neutral-400 text-sm mb-6 leading-relaxed min-h-[60px]">{description}</p>
    <ul className="space-y-3 mb-8">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-500 group-hover:text-neutral-300">
          <Check size={12} className="text-luxury-gold" /> {f}
        </li>
      ))}
    </ul>
    <Button variant={highlight ? 'primary' : 'outline'} fullWidth>Select</Button>
  </div>
);

const RegistrationForm: React.FC<{ role: UserRole, onBack: () => void }> = ({ role, onBack }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [wizardStep, setWizardStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    username: '',
    password: '',
    district: '',
    age: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    services: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(formData, role);
    navigate('/dashboard');
  };

  // --- Customer Flow (Simple) ---
  if (role === 'customer') {
    return (
      <div className="max-w-md mx-auto bg-neutral-900/50 border border-neutral-800 p-8 rounded-sm">
        <button onClick={onBack} className="text-neutral-500 hover:text-white flex items-center gap-2 mb-6 text-sm">
          <ChevronLeft size={14} /> Back
        </button>
        
        <div className="bg-luxury-gold/10 border border-luxury-gold/30 p-4 mb-6 rounded flex gap-3 items-start">
           <Shield className="text-luxury-gold shrink-0 mt-1" size={18} />
           <div>
             <h4 className="text-luxury-gold text-sm font-bold mb-1">100% Anonymous</h4>
             <p className="text-neutral-400 text-xs leading-relaxed">We do not require an email address. Your account is identified only by your username and password. Do not lose them.</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Username</label>
            <Input 
              required 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="Choose a discreet username" 
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Password</label>
            <Input 
              type="password"
              required 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••" 
            />
          </div>
          
          <Button type="submit" fullWidth className="mt-4">Create Anonymous Account</Button>
          
          <p className="text-center text-xs text-neutral-600 mt-4">
            Already have an account? <Link to="/login" className="text-luxury-gold hover:underline">Login here</Link>
          </p>
        </form>
      </div>
    );
  }

  // --- Model/Agency Flow (Wizard) ---
  const totalSteps = role === 'model' ? 3 : 2;

  const nextStep = () => setWizardStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setWizardStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-xl mx-auto bg-neutral-900/50 border border-neutral-800 p-8 rounded-sm">
      {/* Wizard Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="text-neutral-500 hover:text-white text-sm">Cancel</button>
        <div className="flex gap-2">
          {[...Array(totalSteps)].map((_, i) => (
            <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i + 1 <= wizardStep ? 'bg-luxury-gold' : 'bg-neutral-800'}`} />
          ))}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if(wizardStep === totalSteps) handleSubmit(e); else nextStep(); }}>
        
        {/* Step 1: Credentials (Shared) */}
        {wizardStep === 1 && (
          <div className="space-y-6 animate-fade-in">
             <h3 className="font-serif text-2xl text-white">Account Details</h3>
             <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Username / Login ID</label>
                <Input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Login Name" />
             </div>
             <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Password</label>
                <Input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
             </div>
             <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Email (Private)</label>
                <Input type="email" required placeholder="For notifications & recovery" />
             </div>
          </div>
        )}

        {/* Step 2: Model Specifics */}
        {role === 'model' && wizardStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="font-serif text-2xl text-white">Profile Basics</h3>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Display Name</label>
                  <Input required placeholder="Stage Name" />
               </div>
               <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Age</label>
                  <Input type="number" required placeholder="21" />
               </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Primary District</label>
              <Select value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})}>
                <option value="">Select District</option>
                {Object.values(District).map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>

            {/* Contact Details in Wizard */}
            <div className="pt-4 border-t border-neutral-800">
                <h4 className="text-luxury-gold text-sm uppercase tracking-widest font-bold mb-4">Contact Details</h4>
                <div className="space-y-4">
                    <div>
                        <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 mb-2"><Smartphone size={12}/> Phone</label>
                        <Input placeholder="+49..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 mb-2"><MessageCircle size={12}/> WhatsApp</label>
                            <Input placeholder="+49..." value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 mb-2"><Send size={12}/> Telegram</label>
                            <Input placeholder="username" value={formData.telegram} onChange={e => setFormData({...formData, telegram: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Step 3: Model Services (Mock) */}
        {role === 'model' && wizardStep === 3 && (
           <div className="space-y-6 animate-fade-in">
             <h3 className="font-serif text-2xl text-white">Verification</h3>
             <div className="bg-neutral-950 p-6 border border-dashed border-neutral-700 text-center">
                <Camera className="mx-auto text-neutral-500 mb-3" />
                <p className="text-neutral-300 text-sm mb-2">Upload a verification selfie</p>
                <p className="text-neutral-500 text-xs">Hold a piece of paper with "Velvet" and today's date.</p>
                <Button type="button" variant="outline" className="mt-4">Choose File</Button>
             </div>
             <p className="text-xs text-neutral-500">By clicking Complete, you agree to our Terms of Service.</p>
           </div>
        )}

        {/* Step 2: Agency Details */}
        {role === 'agency' && wizardStep === 2 && (
          <div className="space-y-6 animate-fade-in">
             <h3 className="font-serif text-2xl text-white">Agency Details</h3>
             <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Agency Name</label>
                <Input required placeholder="Agency Brand Name" />
             </div>
             <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Official Website</label>
                <Input placeholder="https://" />
             </div>
          </div>
        )}

        <div className="flex gap-4 mt-8 pt-6 border-t border-neutral-800">
           {wizardStep > 1 && (
             <Button type="button" variant="ghost" onClick={prevStep}>Previous</Button>
           )}
           <Button type="submit" fullWidth className="ml-auto">
             {wizardStep === totalSteps ? 'Complete Registration' : 'Next Step'}
           </Button>
        </div>
      </form>
    </div>
  );
};
