import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-graphite-800 text-porcelain-100 hover:bg-graphite-700",
        success: "border-transparent bg-lime-500 text-graphite-950 hover:bg-lime-600",
        warning: "border-transparent bg-champagne-400 text-graphite-950 hover:bg-champagne-500",
        error: "border-transparent bg-red-500 text-white hover:bg-red-600",
        info: "border-transparent bg-signal-500 text-white hover:bg-signal-600",
        ai: "border-transparent bg-iris-500 text-white hover:bg-iris-600",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        md: "text-xs px-2.5 py-0.5",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-75" aria-hidden="true" />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
