import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-xl bg-white/5 border border-white/5",
        className
      )}
      {...props}
    />
  );
}

export function PizzaCardSkeleton() {
  return (
    <div className="bg-pizza-charcoal-card rounded-2xl border border-pizza-border p-4 space-y-4">
      <Skeleton className="w-full aspect-video rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <div className="pt-2 flex items-center justify-between border-t border-pizza-border/60">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}
