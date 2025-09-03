import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from './utils'
import { buttonVariants } from './button-variants'
import type { ButtonVariantProps } from './button-variants'

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & ButtonVariantProps & {
    asChild?: boolean
  }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = 'Button'

export { Button }
