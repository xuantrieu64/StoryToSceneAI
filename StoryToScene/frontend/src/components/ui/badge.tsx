import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 text-xs leading-4 font-semibold tracking-[0.04em] whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-surface text-ink-muted",
        accent: "bg-peach text-brand-deep",
        white: "bg-white text-ink-muted",
        solid: "bg-brand text-white",
      },
      shape: {
        tag: "rounded-sm px-2.5 py-1",
        compact: "rounded-sm px-2 py-0.5",
        pill: "rounded-full px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "neutral",
      shape: "tag",
    },
  }
)

function Badge({
  className,
  variant,
  shape,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, shape }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
