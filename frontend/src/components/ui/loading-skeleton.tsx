import * as React from "react"
import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-porcelain-300", className)}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="surface-card p-6 space-y-4 border border-porcelain-400 rounded-lg">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-4 px-2 border-b border-porcelain-200">
      <Skeleton className="h-4 w-8" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-8 w-16 ml-auto" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="surface-card p-6 border border-porcelain-400 rounded-lg h-64 flex flex-col justify-end">
      <div className="flex items-end space-x-2 h-3/4 w-full">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="w-full" style={{ height: `${Math.max(20, Math.random() * 100)}%` }} />
        ))}
      </div>
    </div>
  )
}
