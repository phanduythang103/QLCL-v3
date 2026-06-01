import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  default: 'border-primary-600 bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'border-slate-100 bg-slate-100 text-slate-700 hover:bg-slate-200',
  destructive: 'border-red-600 bg-red-600 text-white hover:bg-red-700',
  outline: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
};

const sizes: Record<ButtonSize, string> = {
  default: 'min-h-10 px-4 py-2',
  sm: 'min-h-9 px-3 py-1.5 text-xs',
  lg: 'min-h-11 px-6 py-3',
  icon: 'size-10 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';
