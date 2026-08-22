import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-md transition-all duration-160 focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  const variantClasses = {
    primary: 'bg-teal-deep hover:bg-teal text-white active:scale-95',
    secondary: 'bg-surface border border-hairline text-ink hover:bg-surface-soft active:bg-teal-soft',
    ghost: 'text-teal hover:bg-teal-soft active:text-teal-deep',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-small h-8',
    md: 'px-4 py-3 text-body h-10',
    lg: 'px-6 py-4 text-body h-12',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
