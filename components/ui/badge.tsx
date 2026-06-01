import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary-600 text-white',
  secondary: 'border-transparent bg-slate-100 text-slate-700',
  destructive: 'border-transparent bg-red-100 text-red-700',
  outline: 'border-slate-200 bg-white text-slate-700',
  success: 'border-transparent bg-emerald-100 text-emerald-700',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold leading-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
