import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "warning" | "terracotta" | "outline";
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  className,
  variant = "default",
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-pizza-charcoal text-stone-300 border-pizza-border",
    success: "bg-pizza-basil/15 text-emerald-400 border-emerald-500/30",
    danger: "bg-red-500/15 text-red-400 border-red-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    terracotta: "bg-pizza-terracotta/15 text-pizza-terracotta border-pizza-terracotta/30",
    outline: "bg-transparent text-stone-400 border-stone-700",
  };

  const dotColors = {
    default: "bg-stone-400",
    success: "bg-emerald-400",
    danger: "bg-red-400",
    warning: "bg-amber-400",
    terracotta: "bg-pizza-terracotta",
    outline: "bg-stone-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColors[variant],
            pulse && "animate-pulse"
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
