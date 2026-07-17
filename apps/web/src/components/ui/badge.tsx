import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium leading-none whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-surface-2 text-foreground',
        primary: 'bg-primary/10 text-primary-strong',
        success: 'bg-basil/12 text-basil',
        danger: 'bg-danger/12 text-danger',
        honey: 'bg-honey/15 text-foreground',
        outline: 'border border-border text-muted',
        solidSuccess: 'bg-basil text-basil-foreground',
        solidDanger: 'bg-danger text-danger-foreground',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px]',
        default: 'px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
