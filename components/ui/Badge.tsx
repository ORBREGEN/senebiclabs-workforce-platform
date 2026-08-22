import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-teal-soft text-teal-deep',
    success: 'bg-success bg-opacity-10 text-success',
    warning: 'bg-warning bg-opacity-10 text-warning',
    error: 'bg-error bg-opacity-10 text-error',
    info: 'bg-teal-soft text-teal-deep',
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-caption font-semibold uppercase tracking-wide ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
