'use client'

import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'

import { cn } from './utils'
import { toggleVariants } from './toggle-variants'
import type { ToggleVariantProps } from './toggle-variants'

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & ToggleVariantProps) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle }
