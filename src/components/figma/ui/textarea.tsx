import * as React from "react";

import { cn } from "./utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, style, ...props }, ref) => {
    const renders = React.useRef(0)
    renders.current += 1
    React.useEffect(() => {
      console.debug('[Textarea] render', { renders: renders.current })
      return () => { console.debug('[Textarea] unmount') }
    })
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
  style={{ ...( { backgroundColor: '#2e3d49', color: '#f1eee5' } as React.CSSProperties), ...(style as React.CSSProperties) }}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea };
