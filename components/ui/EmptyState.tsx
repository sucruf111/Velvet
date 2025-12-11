'use client';

import React from 'react';
import {
  Search,
  Heart,
  Users,
  Image as ImageIcon,
  FileText,
  Inbox,
  FolderOpen,
  UserPlus,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Button } from './index';

// ============================================
// EMPTY STATE COMPONENT
// ============================================

type EmptyStateVariant =
  | 'search'
  | 'favorites'
  | 'models'
  | 'photos'
  | 'services'
  | 'inbox'
  | 'folder'
  | 'users'
  | 'schedule'
  | 'billing'
  | 'custom';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantIcons: Record<Exclude<EmptyStateVariant, 'custom'>, React.ReactNode> = {
  search: <Search size={48} />,
  favorites: <Heart size={48} />,
  models: <Users size={48} />,
  photos: <ImageIcon size={48} />,
  services: <FileText size={48} />,
  inbox: <Inbox size={48} />,
  folder: <FolderOpen size={48} />,
  users: <UserPlus size={48} />,
  schedule: <Calendar size={48} />,
  billing: <CreditCard size={48} />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'custom',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  const displayIcon = icon || (variant !== 'custom' ? variantIcons[variant] : <Inbox size={48} />);

  return (
    <div className={`text-center py-16 px-6 ${className}`}>
      {/* Icon Container */}
      <div className="mx-auto w-20 h-20 flex items-center justify-center bg-neutral-900/50 border border-neutral-800 rounded-full mb-6">
        <div className="text-neutral-600">{displayIcon}</div>
      </div>

      {/* Title */}
      <h3 className="font-serif text-xl text-white mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-neutral-500 text-sm max-w-sm mx-auto mb-6">{description}</p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// PRE-CONFIGURED EMPTY STATES
// ============================================

interface SimpleEmptyStateProps {
  onAction?: () => void;
  actionLabel?: string;
}

// No search results
export const EmptySearchResults: React.FC<SimpleEmptyStateProps> = ({
  onAction,
  actionLabel = 'Clear Filters'
}) => (
  <EmptyState
    variant="search"
    title="No results found"
    description="Try adjusting your search or filter criteria to find what you're looking for."
    action={onAction ? { label: actionLabel, onClick: onAction } : undefined}
  />
);

// No favorites
export const EmptyFavorites: React.FC<SimpleEmptyStateProps> = ({
  onAction,
  actionLabel = 'Browse Escorts'
}) => (
  <EmptyState
    variant="favorites"
    title="No favorites yet"
    description="Start exploring and save profiles you like to see them here."
    action={onAction ? { label: actionLabel, onClick: onAction } : undefined}
  />
);

// No models (for agencies)
export const EmptyModels: React.FC<SimpleEmptyStateProps> = ({
  onAction,
  actionLabel = 'Add First Model'
}) => (
  <EmptyState
    variant="models"
    title="No models yet"
    description="Add your first model to start managing your agency."
    action={onAction ? { label: actionLabel, onClick: onAction } : undefined}
  />
);

// No photos
export const EmptyPhotos: React.FC<SimpleEmptyStateProps> = ({
  onAction,
  actionLabel = 'Upload Photos'
}) => (
  <EmptyState
    variant="photos"
    title="No photos uploaded"
    description="Upload photos to make your profile more attractive to clients."
    action={onAction ? { label: actionLabel, onClick: onAction } : undefined}
  />
);

// ============================================
// ERROR STATE
// ============================================

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
}) => (
  <div className="text-center py-16 px-6 bg-red-900/10 border border-red-900/30 rounded-lg">
    <div className="mx-auto w-16 h-16 flex items-center justify-center bg-red-900/20 border border-red-900/50 rounded-full mb-4">
      <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="font-serif text-xl text-red-300 mb-2">{title}</h3>
    <p className="text-red-400/80 text-sm mb-6">{message}</p>
    {onRetry && (
      <Button variant="outline" onClick={onRetry}>
        {retryLabel}
      </Button>
    )}
  </div>
);
