import * as SliderPrimitive from '@radix-ui/react-slider';
import type { ComponentProps } from 'react';

import { cn } from '../../lib/cn';

export function Slider({ className, ...props }: ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-input">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-4 rounded-full border-2 border-primary bg-surface shadow-sm transition-colors focus-visible:outline-none" />
    </SliderPrimitive.Root>
  );
}
