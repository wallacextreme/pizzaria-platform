import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "gold";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pizza-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-pizza-charcoal disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-pizza-terracotta text-white hover:bg-pizza-terracotta-dark shadow-lg shadow-pizza-terracotta/20 active:shadow-none",
      secondary:
        "bg-pizza-charcoal-card text-pizza-cream hover:bg-pizza-charcoal-hover border border-pizza-border hover:border-stone-700",
      outline:
        "border-2 border-pizza-terracotta text-pizza-terracotta hover:bg-pizza-terracotta/10",
      ghost:
        "text-stone-300 hover:text-white hover:bg-white/5",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20",
      gold:
        "bg-pizza-gold text-pizza-charcoal font-semibold hover:bg-pizza-gold-dark shadow-lg shadow-pizza-gold/20",
    };

    const sizeStyles = {
      sm: "h-9 px-3 text-xs gap-1.5",
      md: "h-11 px-4 text-sm gap-2",
      lg: "h-13 px-6 text-base gap-2.5",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
