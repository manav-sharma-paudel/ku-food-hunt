import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn font-medium transition-[transform,background-color,border-color,color] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // primary-strong is the AA-contrast paprika (≥4.5:1 with white); in dark mode
        // it equals --primary, so this only deepens light-mode buttons to meet WCAG AA.
        primary: 'bg-primary-strong text-primary-foreground shadow-soft hover:brightness-95',
        secondary: 'border border-border bg-surface text-foreground hover:bg-surface-2',
        ghost: 'text-foreground hover:bg-surface-2',
        outline: 'border border-border bg-transparent text-foreground hover:bg-surface-2',
        destructive: 'bg-danger text-danger-foreground hover:opacity-90',
        link: 'text-primary-strong underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-sm [&_svg]:size-4',
        default: 'h-11 px-5 text-sm [&_svg]:size-[18px]',
        lg: 'h-13 px-7 text-base [&_svg]:size-5',
        icon: 'size-11 [&_svg]:size-[18px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
