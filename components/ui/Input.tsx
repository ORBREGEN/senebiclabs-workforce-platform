import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({
  label,
  hint,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-body font-500 text-ink mb-2">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      {hint && !error && (
        <p className="text-small text-muted mb-2">{hint}</p>
      )}
      <input
        className={`w-full px-4 py-3 bg-surface border border-hairline rounded-md text-body text-ink placeholder-muted transition-all duration-160 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal ${error ? 'border-error ring-2 ring-error ring-opacity-20' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-small text-error mt-2">{error}</p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  error,
  className = '',
  ...props
}: InputProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-body font-500 text-ink mb-2">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      {hint && !error && (
        <p className="text-small text-muted mb-2">{hint}</p>
      )}
      <textarea
        className={`w-full px-4 py-3 bg-surface border border-hairline rounded-md text-body text-ink placeholder-muted transition-all duration-160 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal resize-none ${error ? 'border-error ring-2 ring-error ring-opacity-20' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-small text-error mt-2">{error}</p>
      )}
    </div>
  );
}

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label?: string;
  hint?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
}

export function RadioGroup({
  label,
  hint,
  options,
  value,
  onChange,
  error,
  required,
}: RadioGroupProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-body font-500 text-ink mb-2">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      {hint && !error && (
        <p className="text-small text-muted mb-3">{hint}</p>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-3 p-3 rounded-md border border-hairline hover:border-teal hover:bg-teal-soft transition-all duration-160 cursor-pointer"
          >
            <input
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              className="w-5 h-5 text-teal"
            />
            <span className="text-body text-ink">{option.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="text-small text-error mt-2">{error}</p>
      )}
    </div>
  );
}
