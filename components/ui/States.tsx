import React from 'react';
import { Button } from './Button';

// Skeleton loader with shimmer effect
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded-md animate-shimmer ${className}`} />;
}

export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-4 mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </>
  );
}

// Empty state
interface EmptyStateProps {
  icon: string; // emoji
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-h1 font-serif text-ink mb-2">{title}</h3>
      <p className="text-body text-slate max-w-sm mb-8">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

// Error state
interface ErrorStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorState({
  title,
  message,
  action,
}: ErrorStateProps) {
  return (
    <div className="bg-error bg-opacity-5 border border-error border-opacity-20 rounded-lg p-6">
      <div className="flex gap-4">
        <div className="flex-shrink-0 text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-body font-semibold text-error mb-1">{title}</h3>
          <p className="text-small text-slate mb-4">{message}</p>
          {action && (
            <Button
              variant="secondary"
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Success toast (use with position-fixed)
export function Toast({
  message,
  variant = 'success',
}: {
  message: string;
  variant?: 'success' | 'error' | 'info';
}) {
  const bgColor = {
    success: 'bg-success',
    error: 'bg-error',
    info: 'bg-teal',
  };

  return (
    <div
      className={`${bgColor[variant]} text-white px-6 py-3 rounded-md text-body font-medium shadow-lg animate-slide-in-top`}
    >
      {message}
    </div>
  );
}
