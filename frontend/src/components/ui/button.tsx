import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-irent-accent disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-irent-accent text-white hover:bg-irent-accent-dark",

                outline: "border border-irent-border bg-irent-surface text-irent-primary hover:bg-irent-background",

                secondary: "bg-irent-accent-soft text-irent-primary hover:bg-irent-background",

                ghost: "text-irent-primary hover:bg-irent-background",

                destructive: "bg-irent-danger text-white hover:opacity-90",

                link: "text-irent-primary underline-offset-4 hover:underline",
            },

            size: {
                default: "h-10 px-4",
                xs: "h-7 px-2 text-xs",
                sm: "h-8 px-3",
                lg: "h-11 px-5",
                icon: "size-10",
            },
        },
      defaultVariants: {
        variant: "default",
        size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
