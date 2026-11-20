import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
                "h-11 w-full rounded-xl border border-irent-border bg-irent-surface px-3 text-sm text-irent-text outline-none transition placeholder:text-irent-muted focus:border-irent-accent focus:ring-2 focus:ring-irent-accent-soft disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
