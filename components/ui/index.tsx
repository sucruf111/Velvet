'use client';

import React from 'react';

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

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ className = '', error, ...props }) => (
  <input
    className={`w-full bg-neutral-950 border text-white p-3 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/50 transition-all placeholder-neutral-500 rounded-sm autofill:bg-neutral-950 autofill:text-white ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-neutral-700 hover:border-neutral-600'} ${className}`}
    style={{
      WebkitBoxShadow: '0 0 0 1000px #0a0a0a inset',
      WebkitTextFillColor: '#ffffff',
      caretColor: '#ffffff'
    }}
    {...props}
  />
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select: React.FC<SelectProps> = ({ className = '', error, children, ...props }) => (
  <div className="relative">
    <select
      className={`w-full bg-neutral-950 border text-white p-3 appearance-none focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/50 transition-all rounded-sm cursor-pointer ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-neutral-700 hover:border-neutral-600'} ${className}`}
      style={{
        WebkitBoxShadow: '0 0 0 1000px #0a0a0a inset',
        WebkitTextFillColor: '#ffffff'
      }}
      {...props}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-luxury-gold">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  </div>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }> = ({ className = '', error, ...props }) => (
  <textarea
    className={`w-full bg-neutral-950 border text-white p-3 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/50 transition-all placeholder-neutral-500 rounded-sm resize-none ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-neutral-700 hover:border-neutral-600'} ${className}`}
    style={{
      WebkitBoxShadow: '0 0 0 1000px #0a0a0a inset',
      WebkitTextFillColor: '#ffffff',
      caretColor: '#ffffff'
    }}
    {...props}
  />
);
