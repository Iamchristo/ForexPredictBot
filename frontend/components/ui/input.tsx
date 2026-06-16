'use client';
import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue = props.value !== '' && props.value !== undefined;

    return (
      <div className="relative w-full">
        <div
          className={cn(
            'relative flex items-center w-full rounded-xl border bg-surface2 transition-all duration-200',
            focused ? 'border-gold ring-1 ring-gold/30' : 'border-border',
            error ? 'border-red-500' : '',
            icon ? 'pl-10' : ''
          )}
        >
          {icon && (
            <div className="absolute left-3 text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-transparent px-4 py-3.5 text-slate-100 placeholder-muted focus:outline-none text-sm',
              icon && 'pl-3',
              className
            )}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
        </div>
        {label && (
          <label
            className={cn(
              'absolute left-4 transition-all duration-200 pointer-events-none text-muted',
              focused || hasValue
                ? '-top-2 text-xs bg-surface2 px-1 text-gold'
                : 'top-3.5 text-sm'
            )}
          >
            {label}
          </label>
        )}
        {error && (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
