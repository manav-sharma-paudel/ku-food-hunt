import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '../../lib/cn';

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;
export const SheetTitle = SheetPrimitive.Title;
export const SheetDescription = SheetPrimitive.Description;

const sheetVariants = cva(
  'fixed z-50 bg-surface shadow-lift transition ease-out data-[state=closed]:duration-200 data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in',
  {
    variants: {
      side: {
        right:
          'inset-y-0 right-0 h-full w-80 max-w-[85vw] rounded-l-sheet border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        left: 'inset-y-0 left-0 h-full w-80 max-w-[85vw] rounded-r-sheet border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        bottom:
          'inset-x-0 bottom-0 max-h-[90vh] rounded-t-sheet border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
      },
    },
    defaultVariants: { side: 'right' },
  },
);

interface SheetContentProps
  extends ComponentProps<typeof SheetPrimitive.Content>, VariantProps<typeof sheetVariants> {
  showClose?: boolean;
}

export function SheetContent({
  className,
  children,
  side = 'right',
  showClose = true,
  ...props
}: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
      <SheetPrimitive.Content className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        {showClose && (
          <SheetPrimitive.Close className="absolute top-4 right-4 rounded-md p-1 text-muted transition-colors hover:bg-surface-2 hover:text-foreground">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}
