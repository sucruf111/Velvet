'use client';

import React from 'react';

// ============================================
// SPINNER COMPONENT
// ============================================

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const spinnerSizes: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => (
  <div
    className={`${spinnerSizes[size]} border-luxury-gold border-t-transparent rounded-full animate-spin ${className}`}
    role="status"
    aria-label="Loading"
  />
);

// ============================================
// BUTTON SPINNER (for inside buttons)
// ============================================

export const ButtonSpinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`animate-spin h-4 w-4 ${className}`} viewBox="0 0 24 24" fill="none">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ============================================
// FULL PAGE LOADER
// ============================================

interface FullPageLoaderProps {
  message?: string;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({ message }) => (
  <div className="min-h-screen bg-luxury-black flex flex-col items-center justify-center gap-4">
    <Spinner size="lg" />
    {message && <p className="text-neutral-400 text-sm">{message}</p>}
  </div>
);

// ============================================
// SKELETON COMPONENTS
// ============================================

interface SkeletonProps {
  className?: string;
}

// Base skeleton with shimmer animation
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    className={`bg-neutral-800 rounded-sm animate-pulse ${className}`}
    aria-hidden="true"
  />
);

// Text line skeleton
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

// Circle skeleton (for avatars)
export const SkeletonCircle: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => (
  <div
    className={`bg-neutral-800 rounded-full animate-pulse ${className}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  />
);

// Card skeleton (for ProfileCard)
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-neutral-900 border border-neutral-800 rounded-sm overflow-hidden ${className}`}>
    {/* Image placeholder */}
    <Skeleton className="aspect-[3/4] w-full rounded-none" />
    {/* Content */}
    <div className="p-4 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 mt-2">
        <Skeleton className="h-6 w-16 rounded-sm" />
        <Skeleton className="h-6 w-16 rounded-sm" />
      </div>
    </div>
  </div>
);

// Stats card skeleton
export const SkeletonStats: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-neutral-900 border border-neutral-800 rounded-lg p-5 ${className}`}>
    <Skeleton className="h-3 w-24 mb-2" />
    <Skeleton className="h-8 w-16" />
  </div>
);

// Grid of skeleton cards
export const SkeletonGrid: React.FC<{ count?: number; className?: string }> = ({
  count = 8,
  className = '',
}) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

// ============================================
// LOADING OVERLAY
// ============================================

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message,
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-luxury-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
        <Spinner size="md" />
        {message && <p className="text-neutral-400 text-sm">{message}</p>}
      </div>
    )}
  </div>
);

// ============================================
// CONTENT LOADER (shows skeleton while loading)
// ============================================

interface ContentLoaderProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

export const ContentLoader: React.FC<ContentLoaderProps> = ({
  isLoading,
  skeleton,
  children,
}) => (isLoading ? <>{skeleton}</> : <>{children}</>);
