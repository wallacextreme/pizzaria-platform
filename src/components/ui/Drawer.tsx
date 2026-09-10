import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: "right" | "bottom";
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = "right",
  className,
}: DrawerProps) {
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Surface */}
      <div
        className={cn(
          "relative z-10 bg-pizza-charcoal-card border-pizza-border shadow-2xl flex flex-col transition-transform duration-300",
          side === "right" &&
            "ml-auto h-full w-full max-w-md border-l animate-in slide-in-from-right duration-200",
          side === "bottom" &&
            "mt-auto w-full max-h-[85vh] rounded-t-3xl border-t animate-in slide-in-from-bottom duration-200",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-pizza-border shrink-0">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-pizza-cream font-display">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-stone-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pizza-terracotta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
