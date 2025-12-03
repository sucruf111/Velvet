
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseClasses = "py-3 px-6 text-sm uppercase tracking-widest font-bold transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
  
  const variants = {
    primary: "bg-luxury-gold-gradient text-black hover:bg-luxury-gold-gradient-hover shadow-gold-glow border border-yellow-200/20",
    outline: "border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-black hover:shadow-gold-glow",
    ghost: "text-luxury-gray hover:text-luxury-gold"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Badge: React.FC<{ type: 'premium' | 'new' | 'verified' | 'top' | 'choice' }> = ({ type }) => {
  const { t } = useLanguage();

  const styles = {
    premium: "bg-luxury-gold-gradient text-black border border-white/20 shadow-md",
    new: "bg-rose-600 text-white border border-rose-500/50 shadow-md",
    verified: "bg-blue-600 text-white border border-blue-500",
    top: "bg-neutral-900/80 backdrop-blur-md text-luxury-gold border border-luxury-gold/50",
    choice: "bg-black/90 text-luxury-gold border border-luxury-gold ring-1 ring-luxury-gold/20 shadow-lg"
  };

  const labels = {
    premium: t('badge.premium'),
    new: t('badge.new'),
    verified: t('badge.verified'),
    top: t('badge.top'),
    choice: t('badge.choice')
  };

  return (
    <span className={`px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold rounded-sm ${styles[type]}`}>
      {labels[type]}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    className="w-full bg-neutral-900/50 border border-neutral-700 text-luxury-white p-3 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/50 transition-all placeholder-neutral-600 rounded-sm"
    {...props}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <div className="relative">
    <select 
      className="w-full bg-neutral-900/50 border border-neutral-700 text-luxury-white p-3 appearance-none focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/50 transition-all rounded-sm"
      {...props}
    >
      {props.children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-luxury-gold">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  </div>
);
