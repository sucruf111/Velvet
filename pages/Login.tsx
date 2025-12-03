
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/UI';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'customer' | 'model' | 'agency'>('customer');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center px-4 animate-fade-in">
      <div className="max-w-md w-full bg-neutral-900/50 border border-neutral-800 p-8 rounded-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-white mb-2">Welcome Back</h1>
          <p className="text-neutral-500 text-sm">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Quick Mock Role Switcher for Demo Purposes */}
          <div className="flex p-1 bg-neutral-950 rounded border border-neutral-800 mb-6">
             {['customer', 'model', 'agency'].map((r) => (
               <button
                 key={r}
                 type="button"
                 onClick={() => setRole(r as any)}
                 className={`flex-1 py-2 text-xs uppercase tracking-wider font-bold rounded-sm transition-colors ${role === r ? 'bg-luxury-gold text-black' : 'text-neutral-500 hover:text-white'}`}
               >
                 {r}
               </button>
             ))}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Username</label>
            <Input 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username" 
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Password</label>
            <Input type="password" required placeholder="••••••••" />
          </div>

          <Button type="submit" fullWidth>Login</Button>
          
          <div className="text-center mt-6">
            <span className="text-neutral-500 text-sm">New to Velvet? </span>
            <Link to="/register" className="text-luxury-gold hover:underline text-sm">Create an account</Link>
          </div>
        </form>
      </div>
    </div>
  );
};
