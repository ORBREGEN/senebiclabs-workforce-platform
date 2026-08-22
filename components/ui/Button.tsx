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
  const baseClasses = 'font-sans font-600 rounded-md transition-all duration-150 ease-smooth focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-accent-deep text-white hover:bg-opacity-90 focus:ring-accent',
    secondary: 'bg-surface border border-hairline text-ink hover:bg-bg focus:ring-accent',
    ghost: 'bg-transparent text-ink hover:bg-bg focus:ring-accent',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-small',
    md: 'px-4 py-2.5 text-body',
    lg: 'px-6 py-3 text-body',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="inline-block animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
      )}
      {children}
    </button>
  );
}
